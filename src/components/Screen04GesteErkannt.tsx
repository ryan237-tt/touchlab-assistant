import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  RefreshCcw,
} from "lucide-react";
import { motion } from "motion/react";

/**
 * Props für Screen 04.
 *
 * onNavigate kommt aus App.tsx.
 * Damit können wir:
 * - zurück zu Screen 03 gehen
 * - nach erfolgreicher Geste wieder zur Anleitung navigieren
 */
type Screen04GesteErkanntProps = {
  onNavigate: (screen: string) => void;
};

/**
 * Mögliche Zustände dieses Screens.
 *
 * waiting:
 *   Die App wartet auf eine Bewegung.
 *
 * detected:
 *   Eine Geste wurde erkannt und Feedback wird angezeigt.
 */
type GestureState = "waiting" | "detected";

/**
 * Mögliche Gestenrichtungen.
 *
 * RIGHT bedeutet: weiter
 * LEFT bedeutet: zurück
 * NONE bedeutet: noch keine Geste erkannt
 */
type GestureDirection = "LEFT" | "RIGHT" | "NONE";

/**
 * Screen 04: Geste erkannt
 *
 * Ziel:
 * Dieser Screen simuliert eine echte Gestenerkennung.
 *
 * Warum erstmal Maus/Touch/Pfeiltasten?
 * - Funktioniert sofort auf PC und Smartphone.
 * - Zeigt schon die Interaktionslogik.
 * - Später können wir die Erkennung durch MediaPipe ersetzen.
 *
 * HCI-Idee:
 * Die App gibt sichtbares Feedback, bevor sie weiterleitet.
 * Dadurch fühlt sich die Interaktion kontrollierbarer und sicherer an.
 */
export default function Screen04GesteErkannt({
  onNavigate,
}: Screen04GesteErkanntProps) {
  const [state, setState] = useState<GestureState>("waiting");
  const [direction, setDirection] = useState<GestureDirection>("NONE");
  const [countdown, setCountdown] = useState(3);

  /**
   * Wir speichern die letzte X-Position der Maus oder des Fingers.
   * So können wir berechnen:
   * Hat sich der Nutzer schnell nach rechts oder links bewegt?
   */
  const lastXRef = useRef<number | null>(null);

  /**
   * Schwellenwert für eine Geste.
   *
   * Wenn sich Maus/Finger um mehr als 80 Pixel bewegt,
   * zählen wir das als bewusste Geste.
   *
   * Warum 80?
   * Kleine Bewegungen sollen nicht direkt eine Aktion auslösen.
   */
  const gestureThreshold = 80;

  /**
   * Wenn eine Geste erkannt wurde, startet ein Countdown.
   * Nach 3 Sekunden geht es automatisch zurück zur Anleitung.
   */
  useEffect(() => {
    if (state !== "detected") return;

    setCountdown(3);

    const interval = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          onNavigate("03");
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [state, onNavigate]);

  /**
   * Tastatursteuerung:
   * Pfeil rechts = Geste nach rechts
   * Pfeil links = Geste nach links
   *
   * Das ist gut für Demos am Laptop.
   */
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (state !== "waiting") return;

      if (event.key === "ArrowRight") {
        detectGesture("RIGHT");
      }

      if (event.key === "ArrowLeft") {
        detectGesture("LEFT");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state]);

  /**
   * Mausbewegung erkennen.
   *
   * Wir vergleichen aktuelle X-Position mit der letzten X-Position.
   * Positive Differenz = Bewegung nach rechts.
   * Negative Differenz = Bewegung nach links.
   */
  function handlePointerMove(clientX: number) {
    if (state !== "waiting") return;

    if (lastXRef.current === null) {
      lastXRef.current = clientX;
      return;
    }

    const deltaX = clientX - lastXRef.current;

    if (deltaX > gestureThreshold) {
      detectGesture("RIGHT");
    } else if (deltaX < -gestureThreshold) {
      detectGesture("LEFT");
    }
  }

  /**
   * Wird aufgerufen, wenn eine Geste erkannt wurde.
   */
  function detectGesture(newDirection: GestureDirection) {
    setDirection(newDirection);
    setState("detected");
  }

  /**
   * Reset-Funktion:
   * Nutzer kann die Geste nochmal testen.
   */
  function resetGesture() {
    setState("waiting");
    setDirection("NONE");
    setCountdown(3);
    lastXRef.current = null;
  }

  const directionLabel =
    direction === "RIGHT"
      ? "Kopf rechts → Weiter"
      : direction === "LEFT"
        ? "Kopf links → Zurück"
        : "Keine Geste";

  return (
    <section
      className="min-h-[932px] bg-[#F7F9FC] px-6 py-10"
      onMouseMove={(event) => handlePointerMove(event.clientX)}
      onTouchMove={(event) => {
        const touch = event.touches[0];
        if (touch) handlePointerMove(touch.clientX);
      }}
    >
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
            Geste testen
          </h1>

          <p className="mt-2 text-[15px] leading-[22px] text-[#475467]">
            Bewege den Kopf nach rechts oder links. Im Prototyp funktioniert es
            mit Maus, Finger oder Pfeiltasten.
          </p>
        </div>
      </header>

      {state === "waiting" && (
        <WaitingState
          onPointerStart={(x) => {
            lastXRef.current = x;
          }}
        />
      )}

      {state === "detected" && (
        <DetectedState
          directionLabel={directionLabel}
          direction={direction}
          countdown={countdown}
          onReset={resetGesture}
          onContinue={() => onNavigate("03")}
        />
      )}
    </section>
  );
}

/**
 * Wartender Zustand:
 * Die App wartet auf eine Geste.
 */
function WaitingState({
  onPointerStart,
}: {
  onPointerStart: (x: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mt-10"
    >
      {/* Tracking-Box */}
      <div
        className="rounded-3xl border-2 border-dashed border-[#93C5FD] bg-[#EEF4FF] p-5"
        onMouseDown={(event) => onPointerStart(event.clientX)}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (touch) onPointerStart(touch.clientX);
        }}
      >
        <div className="flex h-28 items-center justify-center">
          <motion.div
            animate={{ x: [-80, 80, -80] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1D4ED8] text-white shadow-lg"
          >
            <ArrowRight size={26} />
          </motion.div>
        </div>

        <p className="text-center text-[14px] font-semibold text-[#1D4ED8]">
          Maus/Finger schnell nach rechts oder links bewegen
        </p>

        <p className="mt-2 text-center text-[12px] leading-5 text-[#667085]">
          Alternative: Pfeiltasten ← oder → drücken
        </p>
      </div>

      {/* Erklärungskarte */}
      <div className="mt-8 rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm">
        <h2 className="text-[18px] font-bold text-[#101828]">
          Interaktionslogik
        </h2>

        <p className="mt-2 text-[14px] leading-5 text-[#667085]">
          Eine Kopfbewegung soll nicht versehentlich ausgelöst werden. Deshalb
          braucht der Prototyp eine klare Bewegung und zeigt danach sichtbares
          Feedback.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#F9FAFB] p-4 text-center">
            <ArrowLeft className="mx-auto text-[#1D4ED8]" size={24} />
            <p className="mt-2 text-[13px] font-bold text-[#101828]">
              Links
            </p>
            <p className="text-[12px] text-[#667085]">Zurück</p>
          </div>

          <div className="rounded-2xl bg-[#F9FAFB] p-4 text-center">
            <ArrowRight className="mx-auto text-[#1D4ED8]" size={24} />
            <p className="mt-2 text-[13px] font-bold text-[#101828]">
              Rechts
            </p>
            <p className="text-[12px] text-[#667085]">Weiter</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Erkannter Zustand:
 * Die App bestätigt die erkannte Geste.
 */
function DetectedState({
  directionLabel,
  direction,
  countdown,
  onReset,
  onContinue,
}: {
  directionLabel: string;
  direction: GestureDirection;
  countdown: number;
  onReset: () => void;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mt-16 text-center"
    >
      <motion.div
        initial={{ scale: 0.7 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#D1FAE5] text-[#059669]"
      >
        <CheckCircle2 size={54} />
      </motion.div>

      <h2 className="mt-8 text-[22px] font-bold text-[#101828]">
        Kopfbewegung erkannt
      </h2>

      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-4 py-2 text-[14px] font-bold text-[#1D4ED8]">
        {direction === "RIGHT" ? (
          <ArrowRight size={18} />
        ) : (
          <ArrowLeft size={18} />
        )}
        {directionLabel}
      </div>

      <p className="mt-5 text-[15px] leading-[22px] text-[#475467]">
        Die App hat die Bewegung erkannt und bestätigt die Aktion visuell.
      </p>

      <div className="mt-8 rounded-3xl border border-[#A7F3D0] bg-[#ECFDF5] p-5">
        <p className="text-[13px] font-semibold text-[#047857]">
          Automatische Weiterleitung
        </p>

        <p className="mt-2 text-[42px] font-bold tabular-nums text-[#059669]">
          {countdown}
        </p>

        <p className="text-[12px] text-[#047857]">
          Danach wird die Anleitung wieder geöffnet.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          onClick={onReset}
          className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#E8F0FE] text-[14px] font-bold text-[#1D4ED8] transition hover:bg-[#DCEBFF] active:scale-[0.99]"
        >
          <RefreshCcw size={18} />
          Nochmal
        </button>

        <button
          onClick={onContinue}
          className="h-[52px] rounded-2xl bg-[#1D4ED8] text-[14px] font-bold text-white shadow-sm transition hover:brightness-95 active:scale-[0.99]"
        >
          Weiter
        </button>
      </div>
    </motion.div>
  );
}