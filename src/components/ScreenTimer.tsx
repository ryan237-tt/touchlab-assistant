import InteractionModeBanner from "./InteractionModeBanner";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { motion } from "motion/react";


/**
 * Props für den Timer-Screen.
 *
 * onNavigate kommt aus App.tsx.
 * Damit kann der Timer zurück zum Startscreen gehen.
 */
type ScreenTimerProps = {
  onNavigate: (screen: string) => void;
};

/**
 * Timer-Presets in Sekunden.
 *
 * 5 Minuten = 300 Sekunden
 * 10 Minuten = 600 Sekunden
 * usw.
 */
const presets = [
  { label: "5 Min", seconds: 5 * 60 },
  { label: "10 Min", seconds: 10 * 60 },
  { label: "15 Min", seconds: 15 * 60 },
  { label: "30 Min", seconds: 30 * 60 },
];

/**
 * ScreenTimer
 *
 * Ziel:
 * Ein echter Countdown-Timer für Laborversuche.
 *
 * HCI-Entscheidung:
 * - große Zeit-Anzeige
 * - klarer Start/Pause-Button
 * - sichtbarer Fortschrittsring
 * - roter Zustand, wenn Zeit abgelaufen ist
 */
export default function ScreenTimer({ onNavigate }: ScreenTimerProps) {
  /**
   * totalSeconds:
   * Die ursprünglich gewählte Dauer.
   *
   * remainingSeconds:
   * Die aktuell verbleibende Zeit.
   *
   * running:
   * Ob der Timer gerade läuft.
   *
   * finished:
   * Ob die Zeit abgelaufen ist.
   */
  const [totalSeconds, setTotalSeconds] = useState(5 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  /**
   * Timer-Logik.
   *
   * Wenn running === true ist, läuft jede Sekunde ein setInterval.
   * Jede Sekunde wird remainingSeconds um 1 reduziert.
   *
   * Wichtig:
   * return () => clearInterval(interval)
   * stoppt den Timer sauber, wenn der Screen neu rendert oder verlassen wird.
   */
  useEffect(() => {
    if (!running) return;

    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setRunning(false);
          setFinished(true);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [running]);

  /**
   * Prozentwert für den Ring.
   *
   * Beispiel:
   * remaining = 150, total = 300
   * progress = 0.5
   */
  const progress = useMemo(() => {
    if (totalSeconds === 0) return 0;
    return remainingSeconds / totalSeconds;
  }, [remainingSeconds, totalSeconds]);

  /**
   * SVG-Kreiswerte.
   *
   * radius:
   * Größe vom Kreis.
   *
   * circumference:
   * Umfang des Kreises.
   *
   * strokeDashoffset:
   * Damit wird der Fortschrittsring animiert.
   */
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  /**
   * Zeit formatieren.
   *
   * Aus 300 wird "05:00"
   * Aus 75 wird "01:15"
   */
  const formattedTime = formatTime(remainingSeconds);

  /**
   * Preset auswählen.
   *
   * Wenn Nutzer 10 Min auswählt:
   * - totalSeconds = 600
   * - remainingSeconds = 600
   * - Timer stoppt
   * - finished wird zurückgesetzt
   */
  function selectPreset(seconds: number) {
    setTotalSeconds(seconds);
    setRemainingSeconds(seconds);
    setRunning(false);
    setFinished(false);
  }

  /**
   * Start/Pause.
   */
  function toggleTimer() {
    if (finished) {
      setRemainingSeconds(totalSeconds);
      setFinished(false);
      setRunning(true);
      return;
    }

    setRunning((current) => !current);
  }

  /**
   * Reset.
   */
  function resetTimer() {
    setRemainingSeconds(totalSeconds);
    setRunning(false);
    setFinished(false);
  }

  return (
    <section className="min-h-[932px] bg-[#F7F9FC] px-6 py-10">
      {/* Header */}
      <header className="flex items-start gap-4">
        <button
          onClick={() => onNavigate("01")}
          aria-label="Zurück zum Startscreen"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EAECF0] bg-white text-[#344054] shadow-sm transition hover:bg-[#F9FAFB] active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>

        <div>
          <h1 className="text-[22px] font-bold leading-tight text-[#101828]">
            Timer
          </h1>

          <p className="mt-2 text-[15px] leading-[22px] text-[#475467]">
            Starte einen Labor-Timer ohne klassische Touch-Bedienung.
          </p>
        </div>
      </header>

      <InteractionModeBanner mode="timer" />

      {/* Preset-Auswahl */}
      <div className="mt-8 grid grid-cols-4 gap-2">
        {presets.map((preset) => {
          const active = preset.seconds === totalSeconds;

          return (
            <button
              key={preset.seconds}
              onClick={() => selectPreset(preset.seconds)}
              className={[
                "h-11 rounded-2xl text-[13px] font-bold transition active:scale-[0.98]",
                active
                  ? "bg-[#1D4ED8] text-white"
                  : "bg-[#EEF4FF] text-[#1D4ED8]",
              ].join(" ")}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Timer-Kreis */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-12 rounded-3xl border border-[#EAECF0] bg-white p-6 text-center shadow-sm"
      >
        <div className="relative mx-auto flex h-[240px] w-[240px] items-center justify-center">
          <svg width="240" height="240" viewBox="0 0 240 240">
            {/* Hintergrundring */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="#EAECF0"
              strokeWidth="14"
            />

            {/* Fortschrittsring */}
            <motion.circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke={finished ? "#EF4444" : "#1D4ED8"}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.4 }}
              transform="rotate(-90 120 120)"
            />
          </svg>

          {/* Zeit in der Mitte */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Timer
              size={28}
              className={finished ? "text-[#EF4444]" : "text-[#1D4ED8]"}
            />

            <p
              className={[
                "mt-3 text-[44px] font-bold tabular-nums",
                finished ? "text-[#EF4444]" : "text-[#101828]",
              ].join(" ")}
            >
              {formattedTime}
            </p>

            <p className="mt-1 text-[13px] font-semibold text-[#667085]">
              {finished ? "Zeit abgelaufen" : running ? "läuft..." : "bereit"}
            </p>
          </div>
        </div>

        {/* Fertig-Warnung */}
        {finished && (
          <div className="mt-5 rounded-2xl border border-[#FECACA] bg-[#FEE2E2] p-4">
            <p className="text-[14px] font-bold text-[#EF4444]">
              Timer beendet. Bitte Laborreaktion prüfen.
            </p>
          </div>
        )}
      </motion.div>

      {/* Steuerung */}
      <div className="mt-8 grid grid-cols-[64px_1fr] gap-3">
        <button
          onClick={resetTimer}
          aria-label="Timer zurücksetzen"
          className="flex h-14 items-center justify-center rounded-2xl bg-[#F2F4F7] text-[#344054] transition hover:bg-[#EAECF0] active:scale-[0.99]"
        >
          <RotateCcw size={22} />
        </button>

        <button
          onClick={toggleTimer}
          className={[
            "flex h-14 items-center justify-center gap-2 rounded-2xl text-[16px] font-bold shadow-sm transition active:scale-[0.99]",
            running
              ? "bg-[#FEE2E2] text-[#EF4444]"
              : "bg-[#1D4ED8] text-white",
          ].join(" ")}
        >
          {running ? <Pause size={20} /> : <Play size={20} />}
          {running ? "Pause" : finished ? "Neu starten" : "Starten"}
        </button>
      </div>

      {/* Touchfrei-Hinweis */}
      <div className="mt-6 rounded-2xl border border-[#EAECF0] bg-white p-4">
        <p className="text-[13px] font-bold text-[#101828]">
          Touchfreie Bedienung im Prototyp
        </p>

        <p className="mt-2 text-[13px] leading-5 text-[#667085]">
          Später kann der Timer per Sprachbefehl gestartet werden, z. B.
          „Timer fünf Minuten starten“.
        </p>
      </div>
    </section>
  );
}

/**
 * Hilfsfunktion zum Formatieren der Zeit.
 *
 * seconds = 75
 * minutes = 1
 * restSeconds = 15
 * Ergebnis = "01:15"
 */
function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(restSeconds).padStart(
    2,
    "0"
  )}`;
}