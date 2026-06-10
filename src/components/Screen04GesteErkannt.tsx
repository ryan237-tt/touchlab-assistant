import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  RotateCcw,
  Sparkles,
  UserRound,
} from "lucide-react";
import { motion } from "motion/react";
import {
  FaceLandmarker,
  FilesetResolver,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

/**
 * Props für Screen 04.
 *
 * onNavigate kommt aus App.tsx.
 * Damit gehen wir nach erfolgreicher Geste zurück zur Anleitung.
 */
type Screen04GesteErkanntProps = {
  onNavigate: (screen: string) => void;
};

/**
 * Status der Kamera / Erkennung.
 */
type CameraState = "loading" | "ready" | "error";

/**
 * Richtung der erkannten Kopfbewegung.
 *
 * LEFT: Kopf nach links
 * CENTER: Kopf neutral
 * RIGHT: Kopf nach rechts
 * NO_FACE: kein Gesicht erkannt
 */
type HeadDirection = "LEFT" | "CENTER" | "RIGHT" | "NO_FACE";

/**
 * Anzeige-Modus:
 *
 * camera:
 * Der Nutzer sieht sein echtes Kamerabild.
 *
 * avatar:
 * Die Kamera läuft im Hintergrund für die Erkennung,
 * aber visuell wird ein neutraler Avatar angezeigt.
 */
type DisplayMode = "camera" | "avatar";

/**
 * Datenstruktur für einen Avatar.
 *
 * Wichtig:
 * Diese Avatare sind anime-inspiriert, aber original.
 * Wir nutzen keine echten geschützten Figuren oder Bilder.
 */
type AvatarOption = {
  id: string;
  name: string;
  role: string;
  emoji: string;
  gradient: string;
};

/**
 * Originale anime-inspirierte Avatar-Profile.
 *
 * Sie erinnern nur an Archetypen, kopieren aber keine echten Charaktere.
 */
const avatarOptions: AvatarOption[] = [
  {
    id: "energy-fighter",
    name: "Kiro",
    role: "Energy Fighter",
    emoji: "⚡",
    gradient: "from-yellow-400 to-orange-500",
  },
  {
    id: "explorer-captain",
    name: "Maro",
    role: "Explorer Captain",
    emoji: "🏴‍☠️",
    gradient: "from-red-500 to-yellow-400",
  },
  {
    id: "blade-guardian",
    name: "Riku",
    role: "Blade Guardian",
    emoji: "⚔️",
    gradient: "from-orange-500 to-rose-500",
  },
  {
    id: "strategic-analyst",
    name: "Lian",
    role: "Strategic Analyst",
    emoji: "📓",
    gradient: "from-slate-800 to-gray-500",
  },
  {
    id: "lab-engineer",
    name: "Nami",
    role: "Lab Engineer",
    emoji: "🔬",
    gradient: "from-cyan-400 to-blue-500",
  },
];

/**
 * Screen 04: echte Kopfbewegungserkennung mit MediaPipe.
 *
 * HCI-Ziel:
 * Der Nutzer soll durch eine Laboranleitung navigieren,
 * ohne das Smartphone zu berühren.
 *
 * Wichtig:
 * Eine Aktion wird erst ausgelöst, wenn die Kopfbewegung kurz gehalten wird.
 * Das verhindert Fehlbedienung durch natürliche Bewegungen.
 *
 * Zusätzliche HCI-Idee:
 * Der Nutzer kann wählen:
 * - eigenes Kamerabild anzeigen
 * - Avatar-Modus anzeigen
 *
 * Im Avatar-Modus läuft die Kamera trotzdem im Hintergrund,
 * aber das echte Gesicht wird nicht sichtbar angezeigt.
 */
export default function Screen04GesteErkannt({
  onNavigate,
}: Screen04GesteErkanntProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  /**
   * Diese Refs speichern technische Werte,
   * ohne das UI bei jedem Videoframe neu zu rendern.
   */
  const lastVideoTimeRef = useRef(-1);
  const holdStartRef = useRef<number | null>(null);
  const lastDirectionRef = useRef<HeadDirection>("CENTER");
  const cooldownUntilRef = useRef(0);

  const [cameraState, setCameraState] = useState<CameraState>("loading");
  const [direction, setDirection] = useState<HeadDirection>("NO_FACE");
  const [feedback, setFeedback] = useState("Kamera wird gestartet...");
  const [gestureConfirmed, setGestureConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Standard ist Avatar-Modus.
   *
   * Vorteil:
   * Nutzer müssen ihr echtes Gesicht nicht dauerhaft sehen.
   * Das verbessert Komfort und Privatsphäre.
   */
  const [displayMode, setDisplayMode] = useState<DisplayMode>("avatar");
  const [selectedAvatarId, setSelectedAvatarId] =
    useState("energy-fighter");

  const selectedAvatar =
    avatarOptions.find((avatar) => avatar.id === selectedAvatarId) ||
    avatarOptions[0];

  /**
   * Beim Laden des Screens:
   * 1. MediaPipe Face Landmarker laden
   * 2. Kamera starten
   * 3. Video-Loop starten
   */
  useEffect(() => {
    let active = true;

    async function initFaceTracking() {
      try {
        setCameraState("loading");
        setFeedback("MediaPipe wird geladen...");

        /**
         * FilesetResolver lädt die WebAssembly-Dateien,
         * die MediaPipe im Browser benötigt.
         */
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        /**
         * FaceLandmarker ist das Modell zur Gesichtspunkt-Erkennung.
         *
         * runningMode VIDEO ist wichtig,
         * weil wir Live-Video analysieren.
         */
        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
        });

        if (!active) {
          faceLandmarker.close();
          return;
        }

        landmarkerRef.current = faceLandmarker;

        setFeedback("Kamera wird geöffnet...");

        /**
         * facingMode user:
         * Auf Smartphone wird möglichst die Frontkamera genutzt.
         */
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (!videoRef.current) return;

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        setCameraState("ready");
        setFeedback("Bereit: Kopf nach links oder rechts bewegen.");

        startPredictionLoop();
      } catch (error) {
        console.error(error);
        setCameraState("error");
        setErrorMessage(
          "Kamera oder MediaPipe konnte nicht gestartet werden. Bitte Chrome/Edge nutzen und Kamera erlauben."
        );
        setFeedback("Fehler beim Starten der Kamera.");
      }
    }

    initFaceTracking();

    /**
     * Cleanup:
     * Wenn der Screen verlassen wird, stoppen wir Kamera,
     * Animation Frame und MediaPipe.
     */
    return () => {
      active = false;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      landmarkerRef.current?.close();

      const video = videoRef.current;
      const stream = video?.srcObject;

      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  /**
   * Prediction Loop:
   * Diese Funktion läuft pro Animation Frame
   * und analysiert das aktuelle Videobild.
   */
  function startPredictionLoop() {
    function predict() {
      detectHeadDirection();
      animationFrameRef.current = requestAnimationFrame(predict);
    }

    predict();
  }

  /**
   * Kernfunktion:
   * 1. Videobild analysieren
   * 2. Gesichtspunkte lesen
   * 3. Kopf-Richtung bestimmen
   * 4. Haltezeit prüfen
   */
  function detectHeadDirection() {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !landmarker || video.readyState < 2) return;

    /**
     * Nur analysieren, wenn ein neues Videobild vorhanden ist.
     * Das spart Leistung.
     */
    if (video.currentTime === lastVideoTimeRef.current) return;
    lastVideoTimeRef.current = video.currentTime;

    const result = landmarker.detectForVideo(video, performance.now());

    if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
      updateDirection("NO_FACE");
      return;
    }

    const landmarks = result.faceLandmarks[0];
    const newDirection = estimateHeadDirection(landmarks);

    updateDirection(newDirection);
  }

  /**
   * Schätzt, ob der Kopf nach links/rechts zeigt.
   *
   * Wir nutzen drei Landmarken:
   * - 1: Nase
   * - 33: linker Augenbereich
   * - 263: rechter Augenbereich
   *
   * Idee:
   * Wenn sich die Nase relativ zur Augenmitte verschiebt,
   * interpretieren wir das als Kopfbewegung.
   */
  function estimateHeadDirection(
    landmarks: NormalizedLandmark[]
  ): HeadDirection {
    const nose = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    if (!nose || !leftEye || !rightEye) return "NO_FACE";

    const faceCenterX = (leftEye.x + rightEye.x) / 2;
    const offset = nose.x - faceCenterX;

    /**
     * Schwellenwert:
     * Kleine natürliche Kopfbewegungen sollen nicht auslösen.
     *
     * Wenn es zu empfindlich ist: threshold erhöhen, z. B. 0.045.
     * Wenn es zu schwer auslöst: threshold senken, z. B. 0.025.
     */
    const threshold = 0.035;

    /**
     * Wichtig:
     * Das Video ist gespiegelt, damit es sich für Nutzer natürlich anfühlt.
     * Deshalb tauschen wir LEFT/RIGHT hier bewusst.
     */
    if (offset > threshold) return "LEFT";
    if (offset < -threshold) return "RIGHT";

    return "CENTER";
  }

  /**
   * Interaktionslogik.
   *
   * Eine Richtung wird nicht sofort als Aktion gezählt.
   * Der Nutzer muss sie ca. 700 ms halten.
   */
  function updateDirection(newDirection: HeadDirection) {
    const now = Date.now();

    setDirection(newDirection);

    if (gestureConfirmed) return;

    if (newDirection === "NO_FACE") {
      setFeedback("Kein Gesicht erkannt.");
      holdStartRef.current = null;
      lastDirectionRef.current = "NO_FACE";
      return;
    }

    if (newDirection === "CENTER") {
      setFeedback("Kopf in der Mitte.");
      holdStartRef.current = null;
      lastDirectionRef.current = "CENTER";
      return;
    }

    if (cooldownUntilRef.current > now) {
      setFeedback("Kurze Pause, um Mehrfachauslösung zu vermeiden.");
      return;
    }

    /**
     * Wenn eine neue Richtung beginnt,
     * startet die Haltezeit neu.
     */
    if (lastDirectionRef.current !== newDirection) {
      lastDirectionRef.current = newDirection;
      holdStartRef.current = now;

      setFeedback(
        newDirection === "RIGHT"
          ? "Kopf rechts erkannt – kurz halten..."
          : "Kopf links erkannt – kurz halten..."
      );

      return;
    }

    const holdTime = holdStartRef.current ? now - holdStartRef.current : 0;

    if (holdTime >= 700) {
      setGestureConfirmed(true);
      cooldownUntilRef.current = now + 1200;
      holdStartRef.current = null;

      setFeedback(
        newDirection === "RIGHT"
          ? "Geste bestätigt: Weiter."
          : "Geste bestätigt: Zurück."
      );
    }
  }

  /**
   * Zurücksetzen, damit man die Geste nochmal testen kann.
   */
  function resetGesture() {
    setGestureConfirmed(false);
    setFeedback("Bereit: Kopf nach links oder rechts bewegen.");
    setDirection("CENTER");
    holdStartRef.current = null;
    lastDirectionRef.current = "CENTER";
    cooldownUntilRef.current = Date.now() + 500;
  }

  const directionLabel = getDirectionLabel(direction);

  return (
    <section className="min-h-[932px] bg-[#F7F9FC] px-6 py-10">
      {/* Header */}
      <header className="flex items-start gap-4">
        <button
          onClick={() => onNavigate("03")}
          aria-label="Zurück zur Anleitung"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EAECF0] bg-white text-[#344054] shadow-sm transition hover:bg-[#F9FAFB] active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>

        <div>
          <h1 className="text-[22px] font-bold leading-tight text-[#101828]">
            Kopfbewegung testen
          </h1>

          <p className="mt-2 text-[15px] leading-[22px] text-[#475467]">
            Navigiere durch die Laboranleitung mit einer echten Kopfbewegung.
          </p>
        </div>
      </header>

      {/* Anzeige-Modus wählen */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          onClick={() => setDisplayMode("avatar")}
          className={[
            "flex h-11 items-center justify-center gap-2 rounded-2xl text-[13px] font-bold transition active:scale-[0.99]",
            displayMode === "avatar"
              ? "bg-[#1D4ED8] text-white"
              : "bg-[#E8F0FE] text-[#1D4ED8]",
          ].join(" ")}
        >
          <Sparkles size={16} />
          Avatar
        </button>

        <button
          onClick={() => setDisplayMode("camera")}
          className={[
            "flex h-11 items-center justify-center gap-2 rounded-2xl text-[13px] font-bold transition active:scale-[0.99]",
            displayMode === "camera"
              ? "bg-[#1D4ED8] text-white"
              : "bg-[#E8F0FE] text-[#1D4ED8]",
          ].join(" ")}
        >
          <UserRound size={16} />
          Eigener Kopf
        </button>
      </div>

      {/* Avatar-Auswahl */}
      {displayMode === "avatar" && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {avatarOptions.map((avatar) => {
            const active = avatar.id === selectedAvatarId;

            return (
              <button
                key={avatar.id}
                onClick={() => setSelectedAvatarId(avatar.id)}
                className={[
                  "min-w-[78px] rounded-2xl border p-2 text-center transition active:scale-[0.98]",
                  active
                    ? "border-[#1D4ED8] bg-[#EEF4FF]"
                    : "border-[#EAECF0] bg-white",
                ].join(" ")}
              >
                <div
                  className={[
                    "mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-xl text-white",
                    avatar.gradient,
                  ].join(" ")}
                >
                  {avatar.emoji}
                </div>

                <p className="mt-1 text-[11px] font-bold text-[#101828]">
                  {avatar.name}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Kamera oder Avatar-Anzeige */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-5 overflow-hidden rounded-3xl border border-[#EAECF0] bg-black shadow-sm"
      >
        <div className="relative h-[260px]">
          {/*
            Wichtig:
            Das Video bleibt immer im DOM und aktiv,
            weil MediaPipe das Video für die Kopf-Erkennung braucht.

            Im Avatar-Modus wird das Video nur unsichtbar gemacht.
            Es wird NICHT entfernt.
          */}
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            className={[
              "absolute inset-0 h-full w-full object-cover scale-x-[-1]",
              displayMode === "camera" ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />

          {displayMode === "avatar" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#101828] p-6 text-center text-white">
              <motion.div
                animate={
                  direction === "LEFT"
                    ? { x: [-8, -24, -8], rotate: [-2, -8, -2] }
                    : direction === "RIGHT"
                      ? { x: [8, 24, 8], rotate: [2, 8, 2] }
                      : { x: 0, rotate: 0 }
                }
                transition={{ duration: 0.45 }}
                className={[
                  "flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br text-5xl shadow-2xl",
                  selectedAvatar.gradient,
                ].join(" ")}
              >
                {selectedAvatar.emoji}
              </motion.div>

              <h2 className="mt-5 text-[22px] font-bold">
                {selectedAvatar.name}
              </h2>

              <p className="mt-1 text-[14px] text-white/70">
                {selectedAvatar.role}
              </p>

              <p className="mt-4 rounded-full bg-white/10 px-4 py-2 text-[12px] font-semibold text-white/80">
                Kamera läuft im Hintergrund für Kopfbewegung
              </p>
            </div>
          )}

          {cameraState === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
              <Loader2 className="animate-spin" size={36} />
              <p className="mt-3 text-[14px]">Kamera wird geladen...</p>
            </div>
          )}

          {cameraState === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center text-white">
              <Camera size={36} />
              <p className="mt-3 text-[14px] leading-5">{errorMessage}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Status */}
      <div className="mt-6 rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm">
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#667085]">
          Live Status
        </p>

        <p className="mt-3 text-[16px] font-bold text-[#101828]">
          {feedback}
        </p>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#F9FAFB] p-4">
          <div>
            <p className="text-[12px] text-[#667085]">Erkannte Richtung</p>
            <p className="mt-1 font-mono text-[15px] font-bold text-[#101828]">
              {directionLabel}
            </p>
          </div>

          <DirectionIcon direction={direction} />
        </div>
      </div>

      {/* Ergebnis / Aktion */}
      {gestureConfirmed ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-7 rounded-3xl border border-[#A7F3D0] bg-[#ECFDF5] p-5 text-center shadow-sm"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5] text-[#059669]">
            <CheckCircle2 size={38} />
          </div>

          <h2 className="mt-4 text-[20px] font-bold text-[#101828]">
            Kopfbewegung erkannt
          </h2>

          <p className="mt-2 text-[14px] leading-5 text-[#047857]">
            Die Aktion wurde erst nach kurzer Haltezeit bestätigt. Das reduziert
            Fehlbedienungen durch natürliche Kopfbewegungen.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={resetGesture}
              className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#E8F0FE] text-[14px] font-bold text-[#1D4ED8] transition active:scale-[0.99]"
            >
              <RotateCcw size={18} />
              Nochmal
            </button>

            <button
              onClick={() => onNavigate("03")}
              className="h-[52px] rounded-2xl bg-[#1D4ED8] text-[14px] font-bold text-white shadow-sm transition active:scale-[0.99]"
            >
              Zur Anleitung
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="mt-7 grid grid-cols-2 gap-3">
          <InstructionCard
            icon={<ArrowLeft size={22} />}
            title="Kopf links"
            text="zurück"
          />

          <InstructionCard
            icon={<ArrowRight size={22} />}
            title="Kopf rechts"
            text="weiter"
          />
        </div>
      )}
    </section>
  );
}

/**
 * Label für den UI-Status.
 */
function getDirectionLabel(direction: HeadDirection) {
  if (direction === "LEFT") return "KOPF LINKS";
  if (direction === "RIGHT") return "KOPF RECHTS";
  if (direction === "CENTER") return "MITTE";
  return "KEIN GESICHT";
}

/**
 * Kleines Status-Icon je nach Richtung.
 */
function DirectionIcon({ direction }: { direction: HeadDirection }) {
  if (direction === "LEFT") {
    return <ArrowLeft size={28} className="text-[#1D4ED8]" />;
  }

  if (direction === "RIGHT") {
    return <ArrowRight size={28} className="text-[#1D4ED8]" />;
  }

  if (direction === "NO_FACE") {
    return <Camera size={28} className="text-[#98A2B3]" />;
  }

  return (
    <div className="h-7 w-7 rounded-full border-4 border-[#1D4ED8] bg-white" />
  );
}

/**
 * Kleine Karte für Erklärung links/rechts.
 */
function InstructionCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-[#EAECF0] bg-white p-5 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#1D4ED8]">
        {icon}
      </div>

      <p className="mt-3 text-[15px] font-bold text-[#101828]">{title}</p>
      <p className="mt-1 text-[13px] text-[#667085]">{text}</p>
    </div>
  );
}