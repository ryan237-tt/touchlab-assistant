import { Mic, MicOff, Volume2 } from "lucide-react";
import { useVoiceCommands } from "../hooks/useVoiceCommands";

type GlobalVoiceControlProps = {
  onNavigate: (screen: string) => void;
};

export default function GlobalVoiceControl({
  onNavigate,
}: GlobalVoiceControlProps) {
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
        action: () => onNavigate("01"),
      },
      {
        words: ["versuch", "experiment"],
        action: () => onNavigate("02"),
      },
      {
        words: ["anleitung", "schritt"],
        action: () => onNavigate("03"),
      },
      {
        words: ["weiter", "nächster", "rechts"],
        action: () => onNavigate("04"),
      },
      {
        words: ["notiz", "aufnahme", "dokumentation"],
        action: () => onNavigate("05"),
      },
      {
        words: ["sicherheit", "gefahr", "stoff"],
        action: () => onNavigate("06"),
      },
      {
        words: ["timer", "zeit", "stoppuhr"],
        action: () => onNavigate("timer"),
      },
      {
        words: ["zurück", "links"],
        action: () => onNavigate("03"),
      },
    ],
  });

  return (
    <div className="absolute bottom-4 left-1/2 z-50 w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2 rounded-3xl border border-[#D0D5DD] bg-white/95 p-3 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          onClick={listening ? stopListening : startListening}
          disabled={!supported}
          className={[
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition active:scale-95",
            listening
              ? "bg-[#D1FAE5] text-[#059669]"
              : "bg-[#EEF4FF] text-[#1D4ED8]",
            !supported ? "opacity-50" : "",
          ].join(" ")}
          aria-label="Touchfreie Sprachsteuerung starten oder stoppen"
        >
          {listening ? <Mic size={22} /> : <MicOff size={22} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Volume2 size={14} className="text-[#667085]" />

            <p className="truncate text-[12px] font-bold uppercase tracking-[0.1em] text-[#667085]">
              Globaler Touchfrei-Modus
            </p>
          </div>

          <p className="mt-1 text-[13px] font-bold text-[#101828]">
            {!supported
              ? "Nicht unterstützt"
              : listening
                ? "Hört aktiv zu"
                : "Einmal starten"}
          </p>

          {liveTranscript && (
            <p className="mt-1 truncate rounded-xl bg-[#EEF4FF] px-2 py-1 text-[12px] font-semibold text-[#1D4ED8]">
              Du sagst: „{liveTranscript}“
            </p>
          )}

          {!liveTranscript && lastTranscript && (
            <p className="mt-1 truncate text-[12px] text-[#667085]">
              Erkannt: „{lastTranscript}“
            </p>
          )}

          {lastCommand && (
            <p className="mt-1 truncate text-[12px] font-bold text-[#059669]">
              Befehl: „{lastCommand}“
            </p>
          )}

          {errorMessage && (
            <p className="mt-1 text-[12px] font-semibold text-[#D92D20]">
              {errorMessage}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[11px] font-bold text-[#344054]">
        <span className="rounded-xl bg-[#F7F9FC] px-2 py-1">Notiz</span>
        <span className="rounded-xl bg-[#F7F9FC] px-2 py-1">Weiter</span>
        <span className="rounded-xl bg-[#F7F9FC] px-2 py-1">Timer</span>
        <span className="rounded-xl bg-[#F7F9FC] px-2 py-1">Sicherheit</span>
      </div>
    </div>
  );
}