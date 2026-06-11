import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Loader2,
  MoveHorizontal,
} from "lucide-react";
import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

type Screen = "01" | "02" | "03" | "04" | "05" | "06" | "07" | "timer";

type GlobalHeadGestureControlProps = {
  current: Screen;
  onNavigate: (screen: string) => void;
};

type CameraState = "idle" | "loading" | "ready" | "error";

type HeadDirection = "LEFT" | "CENTER" | "RIGHT" | "NO_FACE";

type FacePoint = {
  x: number;
  y: number;
  z?: number;
};

export default function GlobalHeadGestureControl({
  current,
  onNavigate,
}: GlobalHeadGestureControlProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const lastVideoTimeRef = useRef(-1);
  const holdStartRef = useRef<number | null>(null);
  const lastDirectionRef = useRef<HeadDirection>("CENTER");
  const cooldownUntilRef = useRef(0);

  const latestOffsetRef = useRef(0);
  const neutralOffsetRef = useRef(0);

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [enabled, setEnabled] = useState(false);
  const [calibrated, setCalibrated] = useState(false);
  const [direction, setDirection] = useState<HeadDirection>("CENTER");
  const [feedback, setFeedback] = useState("Kopfsteuerung noch nicht gestartet.");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    async function initHeadTracking() {
      try {
        setCameraState("loading");
        setFeedback("Kopfsteuerung wird gestartet...");

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

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
        setFeedback("Bitte geradeaus kalibrieren.");

        startPredictionLoop();
      } catch (error) {
        console.error(error);
        setCameraState("error");
        setErrorMessage(
          "Kamera konnte nicht gestartet werden. Bitte Kamera erlauben und Chrome/Edge nutzen."
        );
        setFeedback("Fehler bei der Kopfsteuerung.");
      }
    }

    initHeadTracking();

    return () => {
      active = false;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      landmarkerRef.current?.close();
      landmarkerRef.current = null;

      const video = videoRef.current;
      const stream = video?.srcObject;

      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (video) {
        video.srcObject = null;
      }
    };
  }, [enabled]);

  function startPredictionLoop() {
    function predict() {
      detectHeadDirection();
      animationFrameRef.current = requestAnimationFrame(predict);
    }

    predict();
  }

  function detectHeadDirection() {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !landmarker || video.readyState < 2) return;

    if (video.currentTime === lastVideoTimeRef.current) return;
    lastVideoTimeRef.current = video.currentTime;

    const result = landmarker.detectForVideo(video, performance.now());

    if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
      updateDirection("NO_FACE");
      return;
    }

    const landmarks = result.faceLandmarks[0] as FacePoint[];
    const newDirection = estimateHeadDirection(landmarks);

    updateDirection(newDirection);
  }

  function estimateHeadDirection(landmarks: FacePoint[]): HeadDirection {
    const nose = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    if (!nose || !leftEye || !rightEye) return "NO_FACE";

    const faceCenterX = (leftEye.x + rightEye.x) / 2;
    const rawOffset = nose.x - faceCenterX;

    latestOffsetRef.current = rawOffset;

    const adjustedOffset = rawOffset - neutralOffsetRef.current;
    const threshold = 0.04;

    /**
     * Das Kamerabild ist intern nicht gespiegelt.
     * Für die Nutzerlogik tauschen wir links/rechts.
     */
    if (adjustedOffset > threshold) return "LEFT";
    if (adjustedOffset < -threshold) return "RIGHT";

    return "CENTER";
  }

  function updateDirection(newDirection: HeadDirection) {
    const now = Date.now();

    setDirection(newDirection);

    if (newDirection === "NO_FACE") {
      setFeedback("Kein Gesicht erkannt.");
      holdStartRef.current = null;
      lastDirectionRef.current = "NO_FACE";
      return;
    }

    if (!calibrated) {
      setFeedback("Bitte zuerst geradeaus kalibrieren.");
      holdStartRef.current = null;
      lastDirectionRef.current = "CENTER";
      return;
    }

    if (newDirection === "CENTER") {
      setFeedback("Kopf in der Mitte.");
      holdStartRef.current = null;
      lastDirectionRef.current = "CENTER";
      return;
    }

    if (cooldownUntilRef.current > now) {
      setFeedback("Kurze Pause gegen Fehlbedienung.");
      return;
    }

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

    if (holdTime >= 750) {
      executeGesture(newDirection);
      cooldownUntilRef.current = now + 1500;
      holdStartRef.current = null;
      lastDirectionRef.current = "CENTER";
    }
  }

  function executeGesture(gesture: "LEFT" | "RIGHT") {
    const nextScreen = getNextScreenFromGesture(current, gesture);

    if (!nextScreen) {
      setFeedback("Für diesen Screen ist diese Geste deaktiviert.");
      return;
    }

    setFeedback(
      gesture === "RIGHT"
        ? "Geste bestätigt: Weiter."
        : "Geste bestätigt: Zurück."
    );

    onNavigate(nextScreen);
  }

  function calibrateNeutralPosition() {
    neutralOffsetRef.current = latestOffsetRef.current;
    setCalibrated(true);
    setDirection("CENTER");
    holdStartRef.current = null;
    lastDirectionRef.current = "CENTER";
    cooldownUntilRef.current = Date.now() + 800;
    setFeedback("Kalibrierung gespeichert. Kopfsteuerung aktiv.");
  }

  function stopHeadControl() {
    setEnabled(false);
    setCameraState("idle");
    setCalibrated(false);
    setDirection("CENTER");
    setFeedback("Kopfsteuerung gestoppt.");
  }

  return (
    <div className="absolute bottom-[150px] left-1/2 z-40 w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2 rounded-3xl border border-[#D0D5DD] bg-white/95 p-3 shadow-xl backdrop-blur">
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        className="pointer-events-none absolute h-1 w-1 opacity-0"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={enabled ? stopHeadControl : () => setEnabled(true)}
          className={[
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition active:scale-95",
            enabled
              ? "bg-[#D1FAE5] text-[#059669]"
              : "bg-[#EEF4FF] text-[#1D4ED8]",
          ].join(" ")}
          aria-label="Kopfsteuerung starten oder stoppen"
        >
          {cameraState === "loading" ? (
            <Loader2 size={22} className="animate-spin" />
          ) : enabled ? (
            <MoveHorizontal size={22} />
          ) : (
            <Camera size={22} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-bold uppercase tracking-[0.1em] text-[#667085]">
            Globale Kopfsteuerung
          </p>

          <p className="mt-1 text-[13px] font-bold text-[#101828]">
            {enabled ? feedback : "Einmal starten"}
          </p>

          {errorMessage && (
            <p className="mt-1 text-[12px] font-semibold text-[#D92D20]">
              {errorMessage}
            </p>
          )}

          {enabled && cameraState === "ready" && (
            <div className="mt-2 flex items-center gap-2">
              <span
                className={[
                  "rounded-xl px-2 py-1 text-[11px] font-bold",
                  calibrated
                    ? "bg-[#D1FAE5] text-[#059669]"
                    : "bg-[#FFFAEB] text-[#DC6803]",
                ].join(" ")}
              >
                {calibrated ? "kalibriert" : "offen"}
              </span>

              <span className="rounded-xl bg-[#F7F9FC] px-2 py-1 text-[11px] font-bold text-[#344054]">
                {getDirectionLabel(direction)}
              </span>
            </div>
          )}
        </div>
      </div>

      {enabled && cameraState === "ready" && !calibrated && (
        <button
          onClick={calibrateNeutralPosition}
          disabled={direction === "NO_FACE"}
          className={[
            "mt-3 h-10 w-full rounded-2xl text-[13px] font-bold transition active:scale-[0.99]",
            direction !== "NO_FACE"
              ? "bg-[#1D4ED8] text-white"
              : "bg-[#F2F4F7] text-[#98A2B3]",
          ].join(" ")}
        >
          Geradeaus kalibrieren
        </button>
      )}

      {enabled && calibrated && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[11px] font-bold text-[#344054]">
          <span className="rounded-xl bg-[#F7F9FC] px-2 py-1">
            <ArrowLeft size={12} className="mr-1 inline" />
            Zurück
          </span>
          <span className="rounded-xl bg-[#F7F9FC] px-2 py-1">
            Weiter
            <ArrowRight size={12} className="ml-1 inline" />
          </span>
        </div>
      )}
    </div>
  );
}

function getNextScreenFromGesture(
  current: Screen,
  gesture: "LEFT" | "RIGHT"
): Screen | null {
  if (current === "01") {
    if (gesture === "RIGHT") return "02";
    return null;
  }

  if (current === "02") {
    if (gesture === "RIGHT") return "03";
    if (gesture === "LEFT") return "01";
  }

  if (current === "03") {
    if (gesture === "RIGHT") return "04";
    if (gesture === "LEFT") return "02";
  }

  if (current === "06") {
    if (gesture === "LEFT") return "01";
    return null;
  }

  if (current === "timer") {
    if (gesture === "LEFT") return "01";
    return null;
  }

  /**
   * Auf Screen05 und Screen07 keine globale Gestenaktion.
   * Grund:
   * Notiz speichern und bestätigen sind kritische Aktionen.
   */
  return null;
}

function getDirectionLabel(direction: HeadDirection) {
  if (direction === "LEFT") return "KOPF LINKS";
  if (direction === "RIGHT") return "KOPF RECHTS";
  if (direction === "NO_FACE") return "KEIN GESICHT";
  return "MITTE";
}