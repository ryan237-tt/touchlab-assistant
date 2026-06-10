import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  Mic,
  MicOff,
  RefreshCcw,
  Save,
  X,
} from "lucide-react";
import { motion } from "motion/react";

/**
 * TypeScript kennt die Web Speech API nicht immer vollständig.
 * Deshalb definieren wir hier kleine eigene Typen,
 * damit unser Code sauber und verständlich bleibt.
 */
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((event: {
        results: {
          length: number;
          [index: number]: {
            isFinal: boolean;
            [index: number]: {
              transcript: string;
            };
          };
        };
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

/**
 * Props für Screen 05.
 *
 * onNavigate kommt aus App.tsx.
 * Damit kann Screen 05:
 * - zurück zur Anleitung gehen
 * - nach "Speichern" zur Bestätigung wechseln
 */
type Screen05SprachnotizProps = {
  onNavigate: (screen: string) => void;
};

/**
 * Zustand der Aufnahme.
 *
 * idle:
 *   Noch keine Aufnahme aktiv.
 *
 * recording:
 *   Mikrofon/Speech Recognition läuft.
 *
 * done:
 *   Es wurde Text erkannt.
 *
 * unsupported:
 *   Browser unterstützt Speech Recognition nicht.
 */
type RecordingState = "idle" | "recording" | "done" | "unsupported";

/**
 * Screen 05: Sprachnotiz
 *
 * HCI-Ziel:
 * Im Labor soll der Nutzer Beobachtungen dokumentieren können,
 * ohne das Gerät mit Handschuhen zu berühren.
 *
 * Sicherheits-/Fehlerschutz:
 * Die App speichert nicht automatisch.
 * Erst wird der erkannte Text angezeigt, danach muss der Nutzer speichern
 * und anschließend in Screen 07 bestätigen.
 */
export default function Screen05Sprachnotiz({
  onNavigate,
}: Screen05SprachnotizProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [recognizedText, setRecognizedText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * recognitionRef speichert die SpeechRecognition-Instanz.
   *
   * Warum useRef?
   * Wir wollen die Instanz zwischen Funktionsaufrufen behalten,
   * aber nicht bei jeder Änderung neu rendern.
   */
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  /**
   * Beim Laden des Screens prüfen wir:
   * Unterstützt der Browser die Web Speech API?
   *
   * Chrome/Edge unterstützen meist webkitSpeechRecognition.
   */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setState("unsupported");
      setErrorMessage(
        "Dein Browser unterstützt die Web Speech API nicht. Bitte nutze Chrome oder Edge."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = true;

    /**
     * onresult wird immer aufgerufen, wenn Sprache erkannt wurde.
     *
     * finalTranscript:
     *   sicher erkannter Text
     *
     * interimTranscript:
     *   vorläufiger Text während des Sprechens
     */
    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      setRecognizedText((previous) =>
        (previous + " " + finalTranscript).trim()
      );
      setInterimText(interimTranscript);
    };

    /**
     * Wenn die Aufnahme endet, wechseln wir in "done",
     * falls Text erkannt wurde.
     */
    recognition.onend = () => {
      setInterimText("");

      setRecognizedText((currentText) => {
        if (currentText.trim().length > 0) {
          setState("done");
        } else {
          setState("idle");
        }

        return currentText;
      });
    };

    recognition.onerror = (event) => {
      setErrorMessage(`Fehler bei der Spracherkennung: ${event.error}`);
      setState("idle");
    };

    recognitionRef.current = recognition;

    /**
     * Cleanup:
     * Wenn der Screen verlassen wird, stoppen wir die Aufnahme.
     */
    return () => {
      recognition.abort();
    };
  }, []);

  /**
   * Aufnahme starten.
   */
  function startRecording() {
    if (!recognitionRef.current) return;

    setErrorMessage("");
    setInterimText("");
    setState("recording");

    try {
      recognitionRef.current.start();
    } catch {
      /**
       * start() kann fehlschlagen, wenn die Aufnahme bereits läuft.
       */
      setErrorMessage("Aufnahme konnte nicht gestartet werden.");
      setState("idle");
    }
  }

  /**
   * Aufnahme stoppen.
   */
  function stopRecording() {
    recognitionRef.current?.stop();
  }

  /**
   * Text löschen und neu diktieren.
   */
  function resetRecording() {
    recognitionRef.current?.abort();
    setRecognizedText("");
    setInterimText("");
    setErrorMessage("");
    setState("idle");
  }

  /**
   * Speichern führt nicht direkt zur Speicherung.
   * Stattdessen kommt Screen 07 als Bestätigungsschutz.
   */
  function saveNote() {
    onNavigate("07");
  }

  const displayText =
    recognizedText || interimText || "Noch kein Text erkannt.";

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
            Notiz hinzufügen
          </h1>

          <p className="mt-2 text-[15px] leading-[22px] text-[#475467]">
            Diktiere eine Beobachtung, ohne das Smartphone im Labor berühren zu
            müssen.
          </p>
        </div>
      </header>

      {/* Hauptbereich Mikrofon */}
      <div className="mt-12 flex flex-col items-center text-center">
        <MicrophoneCircle state={state} />

        <h2 className="mt-8 text-[22px] font-bold text-[#101828]">
          {state === "recording"
            ? "Aufnahme läuft..."
            : state === "done"
              ? "Text erkannt"
              : state === "unsupported"
                ? "Browser nicht unterstützt"
                : "Sprachaufnahme"}
        </h2>

        <p className="mt-3 max-w-[320px] text-[15px] leading-[22px] text-[#475467]">
          {state === "recording"
            ? "Sprich deutlich ins Mikrofon. Die App erkennt deine Beobachtung."
            : state === "done"
              ? "Prüfe den erkannten Text, bevor du ihn speicherst."
              : state === "unsupported"
                ? errorMessage
                : "Tippe auf Aufnahme starten oder sage später „Notiz starten“."}
        </p>
      </div>

      {/* Simulierte Lautstärke-Balken */}
      {state === "recording" && <AudioBars />}

      {/* Erkannter Text */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={[
          "mt-8 rounded-3xl border p-5 shadow-sm",
          state === "done"
            ? "border-[#A7F3D0] bg-[#ECFDF5]"
            : "border-[#EAECF0] bg-white",
        ].join(" ")}
      >
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#667085]">
          Erkannter Text
        </p>

        <p className="mt-3 text-[16px] leading-6 text-[#344054]">
          “{displayText}”
        </p>

        {interimText && (
          <p className="mt-2 text-[12px] text-[#98A2B3]">
            Vorläufiger Text wird noch aktualisiert...
          </p>
        )}
      </motion.div>

      {/* Hinweis Fehlerschutz */}
      <div className="mt-5 rounded-2xl border border-[#FEC84B] bg-[#FFFAEB] p-4">
        <p className="text-[14px] font-semibold leading-5 text-[#B54708]">
          Wichtig: Speichern erfordert eine zusätzliche Bestätigung, um
          Fehlbedienung zu vermeiden.
        </p>
      </div>

      {/* Buttons je nach Zustand */}
      <div className="mt-8 space-y-3">
        {state === "idle" && (
          <button
            onClick={startRecording}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1D4ED8] text-[16px] font-bold text-white shadow-sm transition hover:brightness-95 active:scale-[0.99]"
          >
            <Mic size={20} />
            Aufnahme starten
          </button>
        )}

        {state === "recording" && (
          <button
            onClick={stopRecording}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#EF4444] text-[16px] font-bold text-white shadow-sm transition hover:brightness-95 active:scale-[0.99]"
          >
            <MicOff size={20} />
            Aufnahme stoppen
          </button>
        )}

        {state === "done" && (
          <>
            <button
              onClick={saveNote}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1D4ED8] text-[16px] font-bold text-white shadow-sm transition hover:brightness-95 active:scale-[0.99]"
            >
              <Save size={20} />
              Speichern
            </button>

            <button
              onClick={resetRecording}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#E8F0FE] text-[15px] font-bold text-[#1D4ED8] transition hover:bg-[#DCEBFF] active:scale-[0.99]"
            >
              <RefreshCcw size={18} />
              Erneut diktieren
            </button>
          </>
        )}

        <button
          onClick={() => onNavigate("03")}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#F2F4F7] text-[15px] font-bold text-[#667085] transition hover:bg-[#EAECF0] active:scale-[0.99]"
        >
          <X size={18} />
          Abbrechen
        </button>
      </div>
    </section>
  );
}

/**
 * Animierter Mikrofon-Kreis.
 *
 * Dieser Kreis zeigt den Systemstatus sehr deutlich:
 * - blau = bereit
 * - rot = Aufnahme läuft
 * - grün = Text erkannt
 */
function MicrophoneCircle({ state }: { state: RecordingState }) {
  const config = {
    idle: {
      background: "bg-[#EEF4FF]",
      border: "border-[#1D4ED8]",
      text: "text-[#1D4ED8]",
      icon: <Mic size={52} />,
    },
    recording: {
      background: "bg-[#FEE2E2]",
      border: "border-[#EF4444]",
      text: "text-[#EF4444]",
      icon: <Mic size={52} />,
    },
    done: {
      background: "bg-[#D1FAE5]",
      border: "border-[#059669]",
      text: "text-[#059669]",
      icon: <CheckCircle2 size={52} />,
    },
    unsupported: {
      background: "bg-[#FEE2E2]",
      border: "border-[#EF4444]",
      text: "text-[#EF4444]",
      icon: <MicOff size={52} />,
    },
  }[state];

  return (
    <motion.div
      animate={
        state === "recording"
          ? { scale: [1, 1.08, 1] }
          : { scale: 1 }
      }
      transition={
        state === "recording"
          ? { duration: 1.2, repeat: Infinity }
          : { duration: 0.2 }
      }
      className={[
        "flex h-[130px] w-[130px] items-center justify-center rounded-full border-[3px]",
        config.background,
        config.border,
        config.text,
      ].join(" ")}
    >
      {config.icon}
    </motion.div>
  );
}

/**
 * Kleine animierte Audio-Balken.
 *
 * In dieser Version sind sie visuell simuliert.
 * Später können wir echte Lautstärke mit AudioContext verbinden.
 */
function AudioBars() {
  return (
    <div className="mt-8 flex h-12 items-end justify-center gap-1">
      {Array.from({ length: 18 }).map((_, index) => (
        <motion.div
          key={index}
          animate={{
            height: [10, 20 + ((index * 7) % 28), 10],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.04,
          }}
          className="w-1 rounded-full bg-[#1D4ED8]"
        />
      ))}
    </div>
  );
}