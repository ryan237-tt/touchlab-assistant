import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  Hand,
  Laptop,
  Mic,
  Microscope,
  Minus,
  Monitor,
  Plus,
} from "lucide-react";
import { motion } from "motion/react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import slide1 from "../assets/slides/biology-slide-1.jpg";
import slide2 from "../assets/slides/biology-slide-2.png";
import slide3 from "../assets/slides/biology-slide-3.jpg";

type ScreenSlidesScannerProps = {
  onNavigate: (screen: string) => void;
};

type DeviceType = "Laptop" | "PC" | "Mikroskop";
type ScannerStep = "connect" | "success" | "viewer";
type CameraState = "starting" | "ready" | "error";

type SpeechRecognitionConstructor = new () => any;

const slides = [
  {
    name: "Pflanzliches Leitgewebe",
    image: slide1,
  },
  {
    name: "Stängel-Querschnitt",
    image: slide2,
  },
  {
    name: "Mikroskop-Probe",
    image: slide3,
  },
];

export default function ScreenSlidesScanner({
  onNavigate,
}: ScreenSlidesScannerProps) {
  const [step, setStep] = useState<ScannerStep>("connect");
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>("Mikroskop");
  const [activeSlide, setActiveSlide] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [cameraState, setCameraState] = useState<CameraState>("starting");
  const [gestureFeedback, setGestureFeedback] = useState("Kamera-Gestensteuerung startet in der Folienansicht");
  const [voiceFeedback, setVoiceFeedback] = useState("Spracherkennung startet in der Folienansicht");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const lastPointRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const cooldownUntilRef = useRef(0);
  const zoomRef = useRef(zoom);
  const stepRef = useRef(step);
  const recognitionRef = useRef<any>(null);

  const selectedSlide = slides[activeSlide];

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const resetViewer = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((value) => Math.min(5, value + 1));
    setVoiceFeedback("Sprachbefehl: Zoom in");
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((value) => {
      const nextZoom = Math.max(1, value - 1);
      if (nextZoom === 1) setOffset({ x: 0, y: 0 });
      return nextZoom;
    });
    setVoiceFeedback("Sprachbefehl: Zoom out");
  }, []);

  const nextSlide = useCallback(() => {
    setActiveSlide((index) => (index + 1) % slides.length);
    resetViewer();
    setGestureFeedback("Geste: nächste Folie");
  }, [resetViewer]);

  const previousSlide = useCallback(() => {
    setActiveSlide((index) => (index - 1 + slides.length) % slides.length);
    resetViewer();
    setGestureFeedback("Geste: vorherige Folie");
  }, [resetViewer]);

  const goMainMenu = useCallback(() => {
    onNavigate("01");
  }, [onNavigate]);

  function moveInsideZoom(direction: "left" | "right" | "up" | "down") {
    const distance = 90;

    setOffset((old) => {
      const maxMove = (zoomRef.current - 1) * 190;
      const clamp = (value: number) => Math.max(-maxMove, Math.min(maxMove, value));

      if (direction === "left") return { ...old, x: clamp(old.x - distance) };
      if (direction === "right") return { ...old, x: clamp(old.x + distance) };
      if (direction === "up") return { ...old, y: clamp(old.y - distance) };
      return { ...old, y: clamp(old.y + distance) };
    });

    setGestureFeedback(`Geste: Bild bewegen (${direction})`);
  }

  function executeHandGesture(direction: "left" | "right" | "up" | "down") {
    const now = Date.now();
    if (cooldownUntilRef.current > now) return;
    cooldownUntilRef.current = now + 900;

    if (zoomRef.current > 1) {
      moveInsideZoom(direction);
      return;
    }

    if (direction === "left") nextSlide();
    if (direction === "right") previousSlide();
  }

  useEffect(() => {
    if (step !== "viewer") return;

    let active = true;
    setCameraState("starting");
    setGestureFeedback("Kamera für Handgesten wird gestartet...");

    async function startHandGestureCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Die Kamera-API ist in diesem Browser nicht verfügbar.");
        }

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });

        if (!active) {
          handLandmarker.close();
          return;
        }

        handLandmarkerRef.current = handLandmarker;

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
        setGestureFeedback("Kamera bereit: Wische mit der Hand nach links/rechts. Bei Zoom bewegst du dich im Bild.");

        const predict = () => {
          if (!active) return;
          detectHandGesture();
          animationFrameRef.current = requestAnimationFrame(predict);
        };

        predict();
      } catch (error) {
        console.error(error);
        setCameraState("error");
        setGestureFeedback("Kamera blockiert oder nicht verfügbar. Erlaube die Kamera und nutze Chrome/Edge auf localhost.");
      }
    }

    startHandGestureCamera();

    return () => {
      active = false;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      handLandmarkerRef.current?.close();
      handLandmarkerRef.current = null;

      const video = videoRef.current;
      const stream = video?.srcObject;

      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (video) video.srcObject = null;
    };
  }, [step]);

  function detectHandGesture() {
    const video = videoRef.current;
    const handLandmarker = handLandmarkerRef.current;

    if (!video || !handLandmarker || video.readyState < 2) return;
    if (video.currentTime === lastVideoTimeRef.current) return;

    lastVideoTimeRef.current = video.currentTime;
    const result = handLandmarker.detectForVideo(video, performance.now());

    if (!result.landmarks?.length) {
      lastPointRef.current = null;
      return;
    }

    const indexFingerTip = result.landmarks[0]?.[8];
    if (!indexFingerTip) return;

    const now = Date.now();
    const point = { x: indexFingerTip.x, y: indexFingerTip.y, time: now };
    const previousPoint = lastPointRef.current;
    lastPointRef.current = point;

    if (!previousPoint) return;

    const deltaX = point.x - previousPoint.x;
    const deltaY = point.y - previousPoint.y;
    const elapsed = now - previousPoint.time;

    if (elapsed > 350) return;

    const horizontalSwipe = Math.abs(deltaX) > 0.075 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4;
    const verticalSwipe = Math.abs(deltaY) > 0.075 && Math.abs(deltaY) > Math.abs(deltaX) * 1.4;

    if (horizontalSwipe) executeHandGesture(deltaX < 0 ? "left" : "right");
    if (verticalSwipe && zoomRef.current > 1) executeHandGesture(deltaY < 0 ? "up" : "down");
  }

  useEffect(() => {
    if (step !== "viewer") return;

    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    const SpeechRecognitionAPI =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setVoiceFeedback("Spracherkennung wird in diesem Browser nicht unterstützt. Nutze Chrome oder Edge.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: unknown) => {
      const speechEvent = event as {
        results: ArrayLike<{ 0?: { transcript?: string } }>;
      };

      const text = Array.from(speechEvent.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .toLowerCase();

      if (text.includes("zoom in")) zoomIn();
      if (text.includes("zoom out")) zoomOut();
      if (text.includes("main menu")) goMainMenu();
    };

    recognition.onerror = () => {
      setVoiceFeedback("Mikrofon blockiert oder Spracherkennung gestoppt. Nutze Chrome/Edge und erlaube das Mikrofon.");
    };

    recognition.onend = () => {
      if (stepRef.current === "viewer") {
        try {
          recognition.start();
        } catch {
          // Browser can throw if recognition is already started.
        }
      }
    };

    try {
      recognition.start();
      setVoiceFeedback("Spracherkennung bereit: Sage „Zoom in“, „Zoom out“ oder „Main menu“.");
    } catch {
      setVoiceFeedback("Spracherkennung konnte nicht starten. Aktualisiere die Seite und erlaube das Mikrofon.");
    }

    return () => {
      recognition.onend = null;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [step, goMainMenu, zoomIn, zoomOut]);

  useEffect(() => {
    if (step !== "viewer") return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "+" || event.key === "=") zoomIn();
      if (event.key === "-" || event.key === "_") zoomOut();
      if (event.key === "ArrowRight") {
        if (zoomRef.current > 1) moveInsideZoom("right");
        else nextSlide();
      }
      if (event.key === "ArrowLeft") {
        if (zoomRef.current > 1) moveInsideZoom("left");
        else previousSlide();
      }
      if (event.key === "ArrowUp" && zoomRef.current > 1) moveInsideZoom("up");
      if (event.key === "ArrowDown" && zoomRef.current > 1) moveInsideZoom("down");
      if (event.key === "Escape") goMainMenu();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, goMainMenu, zoomIn, zoomOut]);

  const viewerTransform = useMemo(
    () => ({
      transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
      transformOrigin: "center center",
    }),
    [offset.x, offset.y, zoom]
  );

  if (step === "success") {
    return (
      <section className="min-h-[932px] bg-white px-6 py-8">
        <Header title="Slides Scanner" onBack={() => setStep("connect")} />

        <div className="mt-28 flex flex-col items-center text-center">
          <div className="flex h-72 w-72 items-center justify-center rounded-full bg-[#16A34A] text-white shadow-lg">
            <Check size={170} strokeWidth={3.5} />
          </div>

          <h1 className="mt-16 text-[36px] font-black leading-tight text-[#050B20]">
            Erfolgreich verbunden!
          </h1>

          <p className="mt-6 max-w-[330px] text-[21px] leading-9 text-[#6B7280]">
            {deviceLabel(selectedDevice)} ist bereit. Du kannst jetzt deine biologischen Objektträger scannen.
          </p>
        </div>

        <button
          onClick={() => setStep("viewer")}
          className="absolute bottom-16 left-6 right-6 h-[82px] rounded-xl bg-[#0D6BFF] text-[30px] font-black text-white shadow-md active:scale-[0.99]"
        >
          Scannen starten →
        </button>
      </section>
    );
  }

  if (step === "viewer") {
    return (
      <section className="min-h-[932px] bg-[#020713] px-6 py-8 text-white">
        <Header title="Folienansicht" dark onBack={() => setStep("success")} />

        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className="pointer-events-none absolute h-1 w-1 opacity-0"
        />

        <div className="absolute right-6 top-10 rounded-3xl bg-[#0D6BFF] px-5 py-2 text-[24px] font-black">
          {zoom}x
        </div>

        <div className="mt-5 flex gap-2 text-[11px] font-bold">
          <StatusPill icon={<Camera size={14} />} text={cameraState === "ready" ? "Kamera bereit" : cameraState === "starting" ? "Kamera startet" : "Kamera blockiert"} active={cameraState === "ready"} />
          <StatusPill icon={<Mic size={14} />} text="Spracherkennung" active={!voiceFeedback.includes("nicht unterstützt") && !voiceFeedback.includes("blockiert")} />
          <StatusPill icon={<Hand size={14} />} text={zoom > 1 ? "Gesten bewegen das Bild" : "Gesten wechseln Folien"} active />
        </div>

        <div className="mt-6 flex aspect-square w-full items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_0_45px_rgba(255,255,255,0.12)]">
          <motion.img
            key={activeSlide}
            src={selectedSlide.image}
            alt={selectedSlide.name}
            initial={{ opacity: 0.7, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="h-full w-full select-none object-cover"
            style={viewerTransform}
            draggable={false}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-5">
          <RoundButton label="Verkleinern" onClick={zoomOut}>
            <Minus size={38} />
          </RoundButton>

          <div className="flex-1">
            <input
              aria-label="Zoomstufe"
              min={1}
              max={5}
              value={zoom}
              onChange={(event) => {
                const nextZoom = Number(event.target.value);
                setZoom(nextZoom);
                if (nextZoom === 1) setOffset({ x: 0, y: 0 });
              }}
              type="range"
              className="w-full accent-[#0D6BFF]"
            />
            <p className="mt-3 text-center text-[25px] font-black">{zoom}x / 5x</p>
          </div>

          <RoundButton label="Vergrößern" onClick={zoomIn}>
            <Plus size={38} />
          </RoundButton>
        </div>

        <div className="mt-6 flex justify-center gap-7">
          {slides.map((slide, index) => (
            <button
              key={slide.name}
              onClick={() => {
                setActiveSlide(index);
                resetViewer();
              }}
              className={`h-[82px] w-[82px] rounded-2xl border-[4px] bg-cover bg-center transition ${
                index === activeSlide
                  ? "border-[#0D6BFF]"
                  : "border-[#293044] opacity-90"
              }`}
              style={{ backgroundImage: `url(${slide.image})` }}
              aria-label={`Öffnen: ${slide.name}`}
            />
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-white/8 p-3 text-center text-[14px] font-bold leading-6 text-white/90">
          <p>{voiceFeedback}</p>
          <p>{gestureFeedback}</p>
          <p className="mt-1 text-white">Sage: Zoom in · Zoom out · Main menu</p>
          <p className="text-white/75">Folienwechsel nur mit Handgesten, wenn nicht gezoomt.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[932px] bg-white px-6 py-8">
      <Header title="Slides Scanner" onBack={() => onNavigate("01")} />

      <p className="mt-14 text-center text-[22px] text-[#6B7280]">
        Verbinde dein Gerät, um mit dem Scannen zu beginnen.
      </p>

      <div className="mt-10 space-y-5">
        <DeviceCard
          title="Laptop"
          text="Verbinde deinen Laptop per USB oder WLAN"
          active={selectedDevice === "Laptop"}
          onClick={() => setSelectedDevice("Laptop")}
          icon={<Laptop size={78} />}
        />
        <DeviceCard
          title="PC"
          text="Verbinde deinen PC per USB oder Netzwerk"
          active={selectedDevice === "PC"}
          onClick={() => setSelectedDevice("PC")}
          icon={<Monitor size={78} />}
        />
        <DeviceCard
          title="Mikroskop"
          text="Direkt mit deinem Mikroskop verbinden"
          active={selectedDevice === "Mikroskop"}
          onClick={() => setSelectedDevice("Mikroskop")}
          icon={<Microscope size={82} />}
        />
      </div>

      <button
        onClick={() => setStep("success")}
        className="mt-24 h-[74px] w-full rounded-xl bg-[#0D6BFF] text-[25px] font-black text-white shadow-md active:scale-[0.99]"
      >
        Verbinden
      </button>

      <p className="mt-14 flex items-center justify-center gap-4 text-[20px] text-[#6B7280]">
        <span className="h-4 w-4 rounded-full bg-[#778196]" /> Nicht verbunden
      </p>
    </section>
  );
}

function deviceLabel(device: DeviceType) {
  if (device === "Mikroskop") return "Mikroskop";
  if (device === "Laptop") return "Laptop";
  return "PC";
}

function Header({
  title,
  dark = false,
  onBack,
}: {
  title: string;
  dark?: boolean;
  onBack: () => void;
}) {
  return (
    <div className="relative flex h-12 items-center justify-center">
      <button
        onClick={onBack}
        className="absolute left-0 rounded-full p-2 active:scale-95"
        aria-label="Zurück"
      >
        <ArrowLeft size={34} className={dark ? "text-white" : "text-[#050B20]"} />
      </button>
      <h1 className={`text-[30px] font-black ${dark ? "text-white" : "text-[#050B20]"}`}>
        {title}
      </h1>
    </div>
  );
}

function DeviceCard({
  title,
  text,
  icon,
  active,
  onClick,
}: {
  title: string;
  text: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-[166px] w-full items-center gap-8 rounded-2xl border p-8 text-left transition active:scale-[0.99] ${
        active
          ? "border-[#0D6BFF] bg-[#EFF6FF]"
          : "border-[#D8DCE3] bg-white"
      }`}
    >
      <div className="w-24 text-[#111827]">{icon}</div>
      <div>
        <h2 className="text-[31px] font-black text-[#050B20]">{title}</h2>
        <p className="mt-3 text-[19px] leading-6 text-[#6B7280]">{text}</p>
      </div>
    </button>
  );
}

function StatusPill({
  icon,
  text,
  active,
}: {
  icon: React.ReactNode;
  text: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${
        active ? "bg-[#0D6BFF] text-white" : "bg-white/10 text-white/70"
      }`}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}

function RoundButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="flex h-[74px] w-[74px] items-center justify-center rounded-full border-[4px] border-white bg-transparent text-white active:scale-95"
    >
      {children}
    </button>
  );
}
