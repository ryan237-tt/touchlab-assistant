import { FileText, FlaskConical, Shield, Timer } from "lucide-react";
import { motion } from "motion/react";

/**
 * Props für den Startscreen.
 *
 * onNavigate ist eine Funktion aus App.tsx.
 * Damit kann der Startscreen sagen:
 * "Bitte gehe zu Screen 02" oder "Bitte gehe zum Timer".
 */
type Screen01StartscreenProps = {
  onNavigate: (screen: string) => void;
};

/**
 * Screen 01: Startscreen
 *
 * Ziel:
 * Der Nutzer soll sofort verstehen:
 * - Was ist TouchLab Assistant?
 * - Wofür ist die App gedacht?
 * - Welche Hauptfunktionen gibt es?
 *
 * HCI-Idee:
 * Wenig Text, klare Aktionen, große Buttons.
 * Das ist wichtig, weil Nutzer im Labor wenig Zeit und Aufmerksamkeit haben.
 */
export default function Screen01Startscreen({
  onNavigate,
}: Screen01StartscreenProps) {
  return (
    <section className="min-h-[932px] bg-[#F7F9FC] px-6 py-10">
      {/* Status-/Projektbereich oben */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">
          Gruppe 8 · HCI Prototype
        </p>

        <h1 className="mt-4 text-[28px] font-bold leading-tight text-[#101828]">
          TouchLab Assistant
        </h1>

        <p className="mt-2 text-[16px] text-[#667085]">
          Laborarbeit ohne Touch-Bedienung
        </p>

        <p className="mt-8 text-[15px] leading-[22px] text-[#475467]">
          Steuere Anleitung, Timer, Notizen und Sicherheitsinfos per Stimme,
          Kopfbewegung oder Blick-Fokus.
        </p>
      </motion.div>

      {/* Info-Karte: erklärt den Nutzen der App */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="mt-10 rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm"
      >
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#1D4ED8]">
            <FlaskConical size={26} />
          </div>

          <div>
            <h2 className="text-[18px] font-bold text-[#101828]">
              Labor-Modus aktiv
            </h2>

            <p className="mt-2 text-[14px] leading-5 text-[#667085]">
              Touchfreie Steuerung für Situationen mit Handschuhen,
              kontaminierten Händen oder laufenden Experimenten.
            </p>
          </div>
        </div>

        {/* Kleine Pills zeigen die Eingabearten */}
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-[11px] font-semibold text-[#1D4ED8]">
            Stimme
          </span>
          <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-[11px] font-semibold text-[#1D4ED8]">
            Kopfbewegung
          </span>
          <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-[11px] font-semibold text-[#1D4ED8]">
            Blick-Fokus
          </span>
        </div>
      </motion.div>

      {/* Hauptaktionen */}
      <div className="mt-9 space-y-3">
        <PrimaryButton
          label="Versuch starten"
          icon={<FlaskConical size={20} />}
          onClick={() => onNavigate("02")}
        />

        <SecondaryButton
          label="Sicherheitsinfos"
          icon={<Shield size={20} />}
          onClick={() => onNavigate("06")}
        />

        <SecondaryButton
          label="Notiz erstellen"
          icon={<FileText size={20} />}
          onClick={() => onNavigate("05")}
        />

        <SecondaryButton
          label="Timer starten"
          icon={<Timer size={20} />}
          onClick={() => onNavigate("timer")}
        />
      </div>

      {/* Fußzeile */}
      <p className="mt-14 text-center text-[12px] leading-5 text-[#667085]">
        Mögliche Eingaben:
        <br />
        Stimme · Kopfbewegung · Blick-Fokus
      </p>
    </section>
  );
}

/**
 * Wiederverwendbarer Hauptbutton.
 *
 * Warum eigene Komponente?
 * Wenn wir später das Button-Design ändern,
 * müssen wir es nur an einer Stelle ändern.
 */
function PrimaryButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1D4ED8] text-[16px] font-bold text-white shadow-sm transition hover:brightness-95 active:scale-[0.99]"
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * Wiederverwendbarer sekundärer Button.
 *
 * Diese Buttons sind weniger dominant als der Hauptbutton,
 * aber trotzdem groß genug für Touch und Labor-Kontext.
 */
function SecondaryButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#E8F0FE] text-[15px] font-bold text-[#1D4ED8] transition hover:bg-[#DCEBFF] active:scale-[0.99]"
    >
      {icon}
      {label}
    </button>
  );
}