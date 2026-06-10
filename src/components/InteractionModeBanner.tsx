import { Eye, Hand, Headphones, Mic, ShieldCheck } from "lucide-react";

type InteractionModeBannerProps = {
  mode?: "navigation" | "voice" | "safety" | "timer";
};

export default function InteractionModeBanner({
  mode = "navigation",
}: InteractionModeBannerProps) {
  const content = getBannerContent(mode);

  return (
    <div className="mt-6 rounded-3xl border border-[#D0D5DD] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#1D4ED8]">
          {content.icon}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#D1FAE5] px-2.5 py-1 text-[11px] font-bold text-[#059669]">
              Touchfrei-Modus aktiv
            </span>
          </div>

          <h2 className="mt-2 text-[15px] font-bold text-[#101828]">
            {content.title}
          </h2>

          <p className="mt-1 text-[13px] leading-5 text-[#667085]">
            {content.description}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {content.primary.map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-[#F7F9FC] px-3 py-2 text-[12px] font-semibold text-[#344054]"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[#FFFAEB] px-3 py-2 text-[12px] font-semibold text-[#DC6803]">
            <Hand size={14} />
            Touch/Button nur als Fallback
          </div>
        </div>
      </div>
    </div>
  );
}

function getBannerContent(mode: InteractionModeBannerProps["mode"]) {
  if (mode === "voice") {
    return {
      icon: <Mic size={22} />,
      title: "Primäre Eingabe über Sprache",
      description:
        "Notizen werden möglichst ohne Berührung per Sprache erstellt. Buttons dienen nur zur Demonstration und als Rückfallebene.",
      primary: ["Sprache → Notiz", "Stopp → Speichern"],
    };
  }

  if (mode === "safety") {
    return {
      icon: <ShieldCheck size={22} />,
      title: "Sicherheitsinformationen schnell abrufen",
      description:
        "Sicherheitsdaten sollen im Labor schnell erreichbar sein, ohne lange manuell durch Dokumente zu suchen.",
      primary: ["Stimme → Stoff suchen", "Blick/Fokus → Auswahl"],
    };
  }

  if (mode === "timer") {
    return {
      icon: <Headphones size={22} />,
      title: "Timer ohne Berührung steuern",
      description:
        "Zeitkritische Laboraufgaben können per Stimme oder großer Fallback-Fläche gesteuert werden.",
      primary: ["Stimme → Start", "Stimme → Pause"],
    };
  }

  return {
    icon: <Eye size={22} />,
    title: "Primäre Navigation über Kopfbewegung",
    description:
      "Die Laboranleitung ist für touchfreie Bedienung gedacht. Kopfbewegung und Sprache sind primär, Touch ist nur Backup.",
    primary: ["Kopf rechts → Weiter", "Kopf links → Zurück"],
  };
}