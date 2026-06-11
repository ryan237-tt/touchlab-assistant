import InteractionModeBanner from "./InteractionModeBanner";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  Edit3,
  Mic,
  MicOff,
  RefreshCcw,
  Save,
  Square,
  X,
} from "lucide-react";
import { motion } from "motion/react";

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

type Screen05SprachnotizProps = {
  onNavigate: (screen: string) => void;
};

type RecordingState = "idle" | "recording" | "done" | "unsupported";

export default function Screen05Sprachnotiz({
  onNavigate,
}: Screen05SprachnotizProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [noteText, setNoteText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [transcriptStatus, setTranscriptStatus] = useState(
    "Live-Transkript noch nicht gestartet."
  );
  const [audioUrl, setAudioUrl] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setTranscriptStatus(
        "Live-Transkript wird in diesem Browser nicht unterstützt. Audioaufnahme funktioniert trotzdem."
      );
    } else {
      const recognition = new SpeechRecognition();

      recognition.lang = "de-DE";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = 0; i < event.results.length; i += 1) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript + " ";
          }
        }

        if (finalTranscript.trim()) {
          setNoteText((previous) =>
            `${previous} ${finalTranscript}`.trim()
          );

          setTranscriptStatus("Text erkannt und übernommen.");
        }

        if (interimTranscript.trim()) {
          setTranscriptStatus("Live-Text wird erkannt...");
        }

        setInterimText(interimTranscript.trim());
      };

      recognition.onerror = (event) => {
        setErrorMessage(
          `Live-Transkript nicht zuverlässig: ${event.error}. Audioaufnahme läuft trotzdem.`
        );

        setTranscriptStatus(
          "Live-Transkript hatte ein Problem. Audioaufnahme läuft trotzdem."
        );
      };

      recognition.onend = () => {
        setInterimText("");

        if (state === "recording") {
          setTranscriptStatus(
            "Live-Transkript wurde beendet. Audioaufnahme läuft eventuell weiter."
          );
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      stopTimer();

      try {
        recognitionRef.current?.abort();
      } catch {
        // Speech Recognition war eventuell schon gestoppt.
      }

      stopMediaStream();

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startRecording() {
    setErrorMessage("");
    setInterimText("");
    setState("recording");
    setRecordingSeconds(0);
    setTranscriptStatus("Live-Transkript wird gestartet...");
    audioChunksRef.current = [];

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl("");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        stopMediaStream();
        stopTimer();

        setState("done");

        if (!noteText.trim()) {
          setTranscriptStatus(
            "Audio wurde aufgenommen. Kein Text erkannt — du kannst den Text manuell eintragen."
          );
        }
      };

      mediaRecorder.start();
      startTimer();

      try {
        recognitionRef.current?.start();
        setTranscriptStatus(
          "Live-Transkript aktiv. Sprich langsam und deutlich."
        );
      } catch {
        setTranscriptStatus(
          "Live-Transkript konnte nicht gestartet werden. Audioaufnahme läuft trotzdem."
        );
      }
    } catch {
      setState("idle");
      setTranscriptStatus("Live-Transkript noch nicht gestartet.");
      setErrorMessage(
        "Mikrofon konnte nicht gestartet werden. Bitte Mikrofon im Browser erlauben."
      );
    }
  }

  function stopRecording() {
    if (interimText.trim()) {
      setNoteText((previous) =>
        `${previous} ${interimText}`.trim()
      );
      setInterimText("");
      setTranscriptStatus("Zwischentext wurde beim Stoppen übernommen.");
    }

    try {
      recognitionRef.current?.stop();
    } catch {
      // Recognition war eventuell schon gestoppt.
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    } else {
      stopMediaStream();
      stopTimer();
      setState(noteText.trim() ? "done" : "idle");
    }
  }

  function resetRecording() {
    try {
      recognitionRef.current?.abort();
    } catch {
      // Recognition war eventuell schon gestoppt.
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    stopMediaStream();
    stopTimer();

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    audioChunksRef.current = [];
    mediaRecorderRef.current = null;

    setAudioUrl("");
    setNoteText("");
    setInterimText("");
    setErrorMessage("");
    setRecordingSeconds(0);
    setTranscriptStatus("Live-Transkript noch nicht gestartet.");
    setState("idle");
  }

  function saveNote() {
    if (!noteText.trim() && !audioUrl) {
      setErrorMessage(
        "Bitte erst eine Audioaufnahme erstellen oder einen Notiztext eingeben."
      );
      return;
    }

    onNavigate("07");
  }

  function startTimer() {
    stopTimer();

    timerRef.current = window.setInterval(() => {
      setRecordingSeconds((seconds) => seconds + 1);
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopMediaStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  return (
    <section className="min-h-[932px] bg-[#F7F9FC] px-6 py-10">
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
            Audio wird zuverlässig aufgenommen. Das Live-Transkript ist ein
            zusätzlicher Komfort.
          </p>
        </div>
      </header>

      <InteractionModeBanner mode="voice" />

      <div className="mt-10 flex flex-col items-center text-center">
        <MicrophoneCircle state={state} />

        <h2 className="mt-7 text-[22px] font-bold text-[#101828]">
          {state === "recording"
            ? "Audioaufnahme läuft..."
            : state === "done"
              ? "Notiz bereit"
              : state === "unsupported"
                ? "Browser nicht unterstützt"
                : "Sprachnotiz"}
        </h2>

        <p className="mt-3 max-w-[320px] text-[15px] leading-[22px] text-[#475467]">
          {state === "recording"
            ? `Sprich jetzt. Aufnahmezeit: ${formatTime(recordingSeconds)}`
            : state === "done"
              ? "Prüfe Text und Audio, bevor du speicherst."
              : "Starte die Aufnahme. Auch wenn das Transkript nicht perfekt ist, bleibt die Audioaufnahme erhalten."}
        </p>
      </div>

      {state === "recording" && <AudioBars />}

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
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#667085]">
            Notiztext
          </p>

          <div className="flex items-center gap-1 text-[12px] font-bold text-[#667085]">
            <Edit3 size={14} />
            editierbar
          </div>
        </div>

        <p className="mt-3 rounded-2xl bg-[#F7F9FC] px-3 py-2 text-[12px] font-semibold text-[#667085]">
          {transcriptStatus}
        </p>

        <textarea
          value={noteText}
          onChange={(event) => setNoteText(event.target.value)}
          placeholder="Noch kein Text erkannt. Du kannst hier auch manuell schreiben."
          className="mt-3 min-h-[120px] w-full resize-none rounded-2xl border border-[#EAECF0] bg-white px-4 py-3 text-[15px] leading-6 text-[#344054] outline-none focus:border-[#1D4ED8]"
        />

        {interimText && (
          <p className="mt-3 rounded-2xl bg-[#EEF4FF] px-3 py-2 text-[13px] font-semibold text-[#1D4ED8]">
            Live: „{interimText}“
          </p>
        )}
      </motion.div>

      {audioUrl && (
        <div className="mt-5 rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#667085]">
            Audioaufnahme
          </p>

          <audio controls src={audioUrl} className="mt-4 w-full" />

          <p className="mt-3 text-[12px] leading-5 text-[#667085]">
            Die Audioaufnahme bleibt als verlässliche Notiz erhalten, auch wenn
            das automatische Transkript unvollständig ist.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="mt-5 rounded-2xl border border-[#FEC84B] bg-[#FFFAEB] p-4">
          <p className="text-[14px] font-semibold leading-5 text-[#B54708]">
            {errorMessage}
          </p>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-[#FEC84B] bg-[#FFFAEB] p-4">
        <p className="text-[14px] font-semibold leading-5 text-[#B54708]">
          Wichtig: Speichern erfordert eine zusätzliche Bestätigung, um
          Fehlbedienung zu vermeiden.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        {state !== "recording" && (
          <button
            onClick={startRecording}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1D4ED8] text-[16px] font-bold text-white shadow-sm transition hover:brightness-95 active:scale-[0.99]"
          >
            <Mic size={20} />
            {state === "done" ? "Neue Aufnahme starten" : "Aufnahme starten"}
          </button>
        )}

        {state === "recording" && (
          <button
            onClick={stopRecording}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#EF4444] text-[16px] font-bold text-white shadow-sm transition hover:brightness-95 active:scale-[0.99]"
          >
            <Square size={20} />
            Aufnahme stoppen
          </button>
        )}

        {state !== "recording" && (
          <button
            onClick={saveNote}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1D4ED8] text-[16px] font-bold text-white shadow-sm transition hover:brightness-95 active:scale-[0.99]"
          >
            <Save size={20} />
            Speichern
          </button>
        )}

        {(state === "done" || noteText || audioUrl) && (
          <button
            onClick={resetRecording}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#E8F0FE] text-[15px] font-bold text-[#1D4ED8] transition hover:bg-[#DCEBFF] active:scale-[0.99]"
          >
            <RefreshCcw size={18} />
            Zurücksetzen
          </button>
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
      icon: <MicOff size={52} />,
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

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}