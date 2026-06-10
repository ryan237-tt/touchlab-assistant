import { AlertCircle, Check, Eye, Mic, X } from "lucide-react";
import { motion } from "motion/react";

/**
 * Props für Screen 07.
 *
 * onNavigate kommt aus App.tsx.
 * Damit kann der Bestätigungsdialog:
 * - nach Bestätigung zurück zur Anleitung gehen
 * - bei Abbrechen zurück zur Sprachnotiz gehen
 */
type Screen07BestaetigungProps = {
  onNavigate: (screen: string) => void;
};

/**
 * Screen 07: Bestätigung
 *
 * HCI-Ziel:
 * Kritische Aktionen sollen nicht versehentlich ausgeführt werden.
 *
 * In unserem Fall:
 * Eine Labor-Notiz wird nicht sofort gespeichert.
 * Erst muss der Nutzer bewusst bestätigen.
 *
 * Das ist besonders wichtig im Labor,
 * weil falsche oder versehentliche Dokumentation problematisch sein kann.
 */
export default function Screen07Bestaetigung({
  onNavigate,
}: Screen07BestaetigungProps) {
  return (
    <section className="flex min-h-[932px] items-center justify-center bg-[#F7F9FC] px-6 py-10">
      {/* Abdunkelung / Dialog-Hintergrund */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-[#101828]/40 backdrop-blur-sm"
      />

      {/* Weißes Modal */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-[370px] rounded-[28px] bg-white p-6 shadow-2xl"
      >
        {/* Warn-Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FEF3F2] text-[#D92D20]">
          <AlertCircle size={34} />
        </div>

        {/* Textbereich */}
        <div className="mt-6 text-center">
          <h1 className="text-[22px] font-bold text-[#101828]">
            Aktion bestätigen
          </h1>

          <p className="mt-3 text-[15px] leading-[22px] text-[#475467]">
            Möchtest du diese Notiz wirklich speichern?
          </p>
        </div>

        {/* Warnhinweis */}
        <div className="mt-6 rounded-2xl border border-[#FECDCA] bg-[#FEF3F2] p-4">
          <p className="text-[14px] font-semibold leading-5 text-[#D92D20]">
            Bestätigung erforderlich, um Fehlbedienung und versehentliche
            Dokumentation zu vermeiden.
          </p>
        </div>

        {/* Touchfreie Bestätigungsmethoden */}
        <div className="mt-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#667085]">
            Touchfreie Bestätigung
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <ConfirmationMethod
              icon={<Eye size={18} />}
              title="Zwinkern"
              text="bewusst bestätigen"
            />

            <ConfirmationMethod
              icon={<Mic size={18} />}
              title="„Bestätigen“"
              text="per Sprachbefehl"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 space-y-3">
          <button
            onClick={() => onNavigate("03")}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#1D4ED8] text-[15px] font-bold text-white shadow-sm transition hover:brightness-95 active:scale-[0.99]"
          >
            <Check size={18} />
            Bestätigen
          </button>

          <button
            onClick={() => onNavigate("05")}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#F2F4F7] text-[15px] font-bold text-[#667085] transition hover:bg-[#EAECF0] active:scale-[0.99]"
          >
            <X size={18} />
            Abbrechen
          </button>
        </div>
      </motion.div>
    </section>
  );
}

/**
 * Kleine Karte für eine Bestätigungsmethode.
 *
 * Warum eigene Komponente?
 * Beide Methoden haben dasselbe Layout.
 * Wiederverwendbare Komponenten machen den Code sauberer.
 */
function ConfirmationMethod({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-[#C7D7FD] bg-[#EEF4FF] p-3 text-center">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#1D4ED8]">
        {icon}
      </div>

      <p className="mt-2 text-[13px] font-bold text-[#101828]">{title}</p>
      <p className="mt-1 text-[11px] leading-4 text-[#667085]">{text}</p>
    </div>
  );
}