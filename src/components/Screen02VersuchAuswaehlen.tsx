import type { ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  FlaskConical,
  Microscope,
  ShieldAlert,
} from "lucide-react";
import { motion } from "motion/react";

/**
 * Props für Screen 02.
 *
 * onNavigate kommt aus App.tsx.
 * Damit kann dieser Screen sagen:
 * - zurück zum Startscreen: onNavigate("01")
 * - weiter zur Anleitung: onNavigate("03")
 */
type Screen02VersuchAuswaehlenProps = {
  onNavigate: (screen: string) => void;
};

/**
 * Datenstruktur für einen Laborversuch.
 *
 * Warum machen wir ein Array?
 * Damit wir die Cards nicht viermal manuell schreiben müssen.
 * Das ist sauberer und professioneller.
 */
type LabExperiment = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  highlighted?: boolean;
};

/**
 * Liste der Laborversuche.
 *
 * Für den Prototyp ist "Titration" unser Hauptversuch.
 * Deshalb bekommt Titration highlighted: true.
 */
const experiments: LabExperiment[] = [
  {
    id: "titration",
    title: "Titration",
    description: "Konzentrationsbestimmung per Säure-Base-Reaktion",
    icon: <FlaskConical size={22} />,
    highlighted: true,
  },
  {
    id: "microscopy",
    title: "Mikroskopie",
    description: "Probenanalyse unter dem Lichtmikroskop",
    icon: <Microscope size={22} />,
  },
  {
    id: "ph",
    title: "pH-Messung",
    description: "Elektrochemische pH-Wert-Bestimmung",
    icon: <Droplets size={22} />,
  },
  {
    id: "safety",
    title: "Sicherheitsübung",
    description: "Notfallprozeduren und Schutzmaßnahmen",
    icon: <ShieldAlert size={22} />,
  },
];

/**
 * Screen 02: Versuch auswählen
 *
 * Ziel:
 * Der Nutzer wählt den Laborversuch aus.
 *
 * HCI-Entscheidung:
 * Wir nutzen große Cards, weil sie auf Smartphone
 * und im Labor-Kontext leichter erkennbar sind.
 */
export default function Screen02VersuchAuswaehlen({
  onNavigate,
}: Screen02VersuchAuswaehlenProps) {
  return (
    <section className="min-h-[932px] bg-[#F7F9FC] px-6 py-10">
      {/* Kopfbereich mit Zurück-Button */}
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
            Versuch auswählen
          </h1>

          <p className="mt-2 text-[15px] leading-[22px] text-[#475467]">
            Wähle den Laborversuch, den du touchfrei begleiten möchtest.
          </p>
        </div>
      </header>

      {/* Liste der Versuch-Cards */}
      <div className="mt-9 space-y-4">
        {experiments.map((experiment, index) => (
          <ExperimentCard
            key={experiment.id}
            experiment={experiment}
            index={index}
            onClick={() => {
              /**
               * Im MVP führt jede Card erstmal zur Titrations-Anleitung.
               * Später könnten wir je nach experiment.id unterschiedliche
               * Versuchsanleitungen anzeigen.
               */
              onNavigate("03");
            }}
          />
        ))}
      </div>

      {/* Hauptbutton unten */}
      <motion.button
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.35 }}
        onClick={() => onNavigate("03")}
        className="mt-10 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1D4ED8] text-[16px] font-bold text-white shadow-sm transition hover:brightness-95 active:scale-[0.99]"
      >
        <FlaskConical size={20} />
        Titration starten
      </motion.button>

      <p className="mt-8 text-center text-[12px] leading-5 text-[#667085]">
        Tipp: Auswahl kann später per Blick-Fokus oder Sprachbefehl erfolgen.
      </p>
    </section>
  );
}

/**
 * Einzelne Versuch-Card.
 *
 * Diese Komponente macht den Code übersichtlicher.
 * Jede Card bekommt:
 * - Icon
 * - Titel
 * - Beschreibung
 * - Pfeil nach rechts
 */
function ExperimentCard({
  experiment,
  index,
  onClick,
}: {
  experiment: LabExperiment;
  index: number;
  onClick: () => void;
}) {
  const isHighlighted = experiment.highlighted === true;

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      onClick={onClick}
      className={[
        "flex min-h-[74px] w-full items-center gap-4 rounded-2xl border p-3 text-left shadow-sm transition active:scale-[0.99]",
        isHighlighted
          ? "border-[#1D4ED8] bg-[#EEF4FF]"
          : "border-[#D0D5DD] bg-white hover:bg-[#F9FAFB]",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          isHighlighted
            ? "bg-[#DBEAFE] text-[#1D4ED8]"
            : "bg-[#F2F4F7] text-[#1D4ED8]",
        ].join(" ")}
      >
        {experiment.icon}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="text-[16px] font-bold text-[#101828]">
          {experiment.title}
        </h2>

        <p className="mt-1 text-[13px] leading-[18px] text-[#667085]">
          {experiment.description}
        </p>
      </div>

      <ChevronRight size={20} className="shrink-0 text-[#98A2B3]" />
    </motion.button>
  );
}