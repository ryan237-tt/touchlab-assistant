import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Loader2,
  Mic,
  MicOff,
  MoveHorizontal,
  Volume2,
} from "lucide-react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useVoiceCommands } from "../hooks/useVoiceCommands";

type Screen = "01" | "02" | "03" | "04" | "05" | "06" | "07" | "timer";

type GlobalTouchFreeDockProps = {
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

export default function GlobalTouchFreeDock({
  current,
  onNavigate,
}: GlobalTouchFreeDockProps) {
  const currentRef = useRef<Screen>(current);
  const navigateRef = useRef(onNavigate);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const lastVideoTimeRef = useRef(-1);
  const holdStartRef = useRef<number | null>(null);
  const lastDirectionRef = useRef<HeadDirection>("CENTER");
  const cooldownUntilRef = useRef(0);

  const latestOffsetRef = useRef(0);
  const neutralOffsetRef = useRef(0);

  /**
   * Wichtig:
   * MediaPipe läuft in einem Animation-Loop.
   * Dieser Loop braucht aktuelle Werte über refs,
   * sonst bleibt er manchmal auf alten React-State-Werten.
   */
  const calibratedRef = useRef(false);
  const headEnabledRef = useRef(false);

  const [headEnabled, setHeadEnabled] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [calibrated, setCalibrated] = useState(false);
  const [direction, setDirection] = useState<HeadDirection>("CENTER");
  const [headFeedback, setHeadFeedback] = useState("Kopf aus");
  const [headError, setHeadError] = useState("");

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    navigateRef.current = onNavigate;
  }, [onNavigate]);

  useEffect(() => {
    headEnabledRef.current = headEnabled;
  }, [headEnabled]);

  useEffect(() => {
    calibratedRef.current = calibrated;
  }, [calibrated]);

  const {
    listening,
    supported,
    liveTranscript,
    lastTranscript,
    lastCommand,
    errorMessage,
    startListening,
    stopListening,
  } = useVoiceCommands({
    commands: [
      {
        words: ["start", "home", "hauptmenü"],
        action: () => navigateRef.current("01"),
      },
      {
        words: ["versuch", "experiment"],
        action: () => navigateRef.current("02"),
      },
      {
        words: ["anleitung", "schritt"],
        action: () => navigateRef.current("03"),
      },
      {
        words: ["weiter", "nächster", "rechts"],
        action: () => navigateRef.current("04"),
      },
      {
        words: ["notiz", "aufnahme", "dokumentation"],
        action: () => navigateRef.current("05"),
      },
      {
        words: ["sicherheit", "gefahr", "stoff"],
        action: () => navigateRef.current("06"),
      },
      {
        words: ["timer", "zeit", "stoppuhr"],
        action: () => navigateRef.current("timer"),
      },
      {
        words: ["zurück", "links"],
        action: () => {
          const previous = getScreenFromGesture(currentRef.current, "LEFT");

          if (previous) {
            navigateRef.current(previous);
          }
        },
      },
    ],
  });

  useEffect(() => {
    if (!headEnabled) return;

    let active = true;

    async function initHeadTracking() {
      try {
        setCameraState("loading");
        setHeadError("");
        setHeadFeedback("Kamera startet...");

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
            delegate: "CPU",
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
        setHeadFeedback("Bitte kalibrieren");

        startPredictionLoop();
      } catch (error) {
        console.error(error);
        setCameraState("error");
        setHeadFeedback("Kamera Fehler");
        setHeadError("Kamera blockiert oder nicht verfügbar.");
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
  }, [headEnabled]);

  function startPredictionLoop() {
    function predict() {
      if (!headEnabledRef.current) return;

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

    /**
     * Falls es zu schwer auslöst: 0.03
     * Falls es zu empfindlich ist: 0.05
     */
    const threshold = 0.035;

    /**
     * Gespiegelte Nutzerlogik:
     * Kopf rechts soll als rechts wirken.
     */
    if (adjustedOffset > threshold) return "LEFT";
    if (adjustedOffset < -threshold) return "RIGHT";

    return "CENTER";
  }

  function updateDirection(newDirection: HeadDirection) {
    const now = Date.now();

    setDirection(newDirection);

    if (newDirection === "NO_FACE") {
      setHeadFeedback("Kein Gesicht");
      holdStartRef.current = null;
      lastDirectionRef.current = "NO_FACE";
      return;
    }

    if (!calibratedRef.current) {
      setHeadFeedback("Bitte kalibrieren");
      holdStartRef.current = null;
      lastDirectionRef.current = "CENTER";
      return;
    }

    if (newDirection === "CENTER") {
      setHeadFeedback("Kopf Mitte");
      holdStartRef.current = null;
      lastDirectionRef.current = "CENTER";
      return;
    }

    if (cooldownUntilRef.current > now) {
      setHeadFeedback("Pause...");
      return;
    }

    if (lastDirectionRef.current !== newDirection) {
      lastDirectionRef.current = newDirection;
      holdStartRef.current = now;

      setHeadFeedback(
        newDirection === "RIGHT"
          ? "Rechts erkannt..."
          : "Links erkannt..."
      );

      return;
    }

    const holdTime = holdStartRef.current ? now - holdStartRef.current : 0;

    if (holdTime >= 650) {
      executeGesture(newDirection);
      cooldownUntilRef.current = now + 1300;
      holdStartRef.current = null;
      lastDirectionRef.current = "CENTER";
    }
  }

  function executeGesture(gesture: "LEFT" | "RIGHT") {
    const currentScreen = currentRef.current;
    const nextScreen = getScreenFromGesture(currentScreen, gesture);

    if (!nextScreen) {
      setHeadFeedback("Keine Aktion");
      return;
    }

    setHeadFeedback(gesture === "RIGHT" ? "Weiter" : "Zurück");

    /**
     * Wichtig:
     * Navigation über ref, damit der Kamera-Loop nicht alte Props nutzt.
     */
    navigateRef.current(nextScreen);
  }

  function calibrateNeutralPosition() {
    neutralOffsetRef.current = latestOffsetRef.current;

    calibratedRef.current = true;
    setCalibrated(true);

    setDirection("CENTER");
    holdStartRef.current = null;
    lastDirectionRef.current = "CENTER";
    cooldownUntilRef.current = Date.now() + 800;

    setHeadFeedback("Kalibriert");
  }

  function stopHeadControl() {
    headEnabledRef.current = false;
    calibratedRef.current = false;

    setHeadEnabled(false);
    setCameraState("idle");
    setCalibrated(false);
    setDirection("CENTER");
    setHeadFeedback("Kopf aus");
    setHeadError("");
  }

  const voiceText =
    liveTranscript ||
    lastTranscript ||
    (listening ? "Hört aktiv zu" : "Stimme aus");

  return (
    <div className="absolute bottom-4 left-1/2 z-50 w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2 rounded-3xl border border-[#D0D5DD] bg-white/95 p-3 shadow-2xl backdrop-blur">
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        className="pointer-events-none absolute h-1 w-1 opacity-0"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={headEnabled ? stopHeadControl : () => setHeadEnabled(true)}
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition active:scale-95",
            headEnabled
              ? "bg-[#D1FAE5] text-[#059669]"
              : "bg-[#EEF4FF] text-[#1D4ED8]",
          ].join(" ")}
          aria-label="Kopfsteuerung starten oder stoppen"
        >
          {cameraState === "loading" ? (
            <Loader2 size={20} className="animate-spin" />
          ) : headEnabled ? (
            <MoveHorizontal size={20} />
          ) : (
            <Camera size={20} />
          )}
        </button>

        <button
          onClick={listening ? stopListening : startListening}
          disabled={!supported}
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition active:scale-95",
            listening
              ? "bg-[#D1FAE5] text-[#059669]"
              : "bg-[#EEF4FF] text-[#1D4ED8]",
            !supported ? "opacity-50" : "",
          ].join(" ")}
          aria-label="Sprachsteuerung starten oder stoppen"
        >
          {listening ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Volume2 size={13} className="shrink-0 text-[#667085]" />

            <p className="truncate text-[11px] font-bold uppercase tracking-[0.1em] text-[#667085]">
              Touchfrei-Dock
            </p>
          </div>

          <p className="mt-1 truncate text-[13px] font-bold text-[#101828]">
            Kopf: {headFeedback} · Stimme: {voiceText}
          </p>

          <p className="mt-1 truncate text-[11px] text-[#667085]">
            Screen: {current} · Richtung: {getDirectionLabel(direction)}
          </p>

          {headError && (
            <p className="mt-1 truncate text-[11px] font-semibold text-[#D92D20]">
              {headError}
            </p>
          )}

          {errorMessage && (
            <p className="mt-1 truncate text-[11px] font-semibold text-[#D92D20]">
              {errorMessage}
            </p>
          )}

          {lastCommand && !liveTranscript && (
            <p className="mt-1 truncate text-[11px] font-bold text-[#059669]">
              Befehl: „{lastCommand}“
            </p>
          )}
        </div>
      </div>

      {headEnabled && cameraState === "ready" && !calibrated && (
        <button
          onClick={calibrateNeutralPosition}
          disabled={direction === "NO_FACE"}
          className={[
            "mt-3 h-9 w-full rounded-2xl text-[12px] font-bold transition active:scale-[0.99]",
            direction !== "NO_FACE"
              ? "bg-[#1D4ED8] text-white"
              : "bg-[#F2F4F7] text-[#98A2B3]",
          ].join(" ")}
        >
          Geradeaus kalibrieren
        </button>
      )}

      <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold text-[#344054]">
        <span className="rounded-xl bg-[#F7F9FC] px-2 py-1">N Notiz</span>
        <span className="rounded-xl bg-[#F7F9FC] px-2 py-1">W Weiter</span>
        <span className="rounded-xl bg-[#F7F9FC] px-2 py-1">T Timer</span>
        <span className="rounded-xl bg-[#F7F9FC] px-2 py-1">S Safety</span>
      </div>
    </div>
  );
}

function getScreenFromGesture(
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

  return null;
}

function getDirectionLabel(direction: HeadDirection) {
  if (direction === "LEFT") return "KOPF LINKS";
  if (direction === "RIGHT") return "KOPF RECHTS";
  if (direction === "NO_FACE") return "KEIN GESICHT";
  return "MITTE";
}