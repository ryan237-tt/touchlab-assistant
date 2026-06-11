import type { ReactNode } from "react";
import InteractionModeBanner from "./InteractionModeBanner";

import {
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageCircle,
  MoveRight,
  ShieldAlert,
} from "lucide-react";
import { motion } from "motion/react";

type Screen03AnleitungProps = {
  onNavigate: (screen: string) => void;
};

const currentStep = {
  experiment: "Titration",
  stepNumber: 1,
  totalSteps: 5,
  badge: "Schritt 1",
  title: "Probe vorbereiten",
  instruction:
    "Schutzbrille tragen. Probe in das Becherglas geben und 10 ml Lösung A hinzufügen. Rührstab einsetzen und Magnetrührer auf niedrige Stufe stellen.",
  warning:
    "Lösung A ist ätzend. Immer Schutzhandschuhe und Brille tragen.",
};

export default function Screen03Anleitung({
  onNavigate,
}: Screen03AnleitungProps) {
  const progressPercent =
    (currentStep.stepNumber / currentStep.totalSteps) * 100;

  return (
    <section className="min-h-[932px] bg-[#F7F9FC] px-6 py-10 pb-36">
      {/* Header */}
      <header className="flex items-start gap-4">
        <button
          onClick={() => onNavigate("02")}
          aria-label="Zurück zur Versuchsauswahl"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EAECF0] bg-white text-[#344054] shadow-sm transition hover:bg-[#F9FAFB] active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>

        <div>
          <h1 className="text-[22px] font-bold leading-tight text-[#101828]">
            {currentStep.experiment}
          </h1>

          <p className="mt-2 text-[15px] leading-[22px] text-[#475467]">
            Schritt {currentStep.stepNumber} von {currentStep.totalSteps}
          </p>
        </div>
      </header>

      <InteractionModeBanner mode="navigation" />

      {/* Fortschrittsbalken */}
      <div className="mt-8">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#EAECF0]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
            className="h-full rounded-full bg-[#1D4ED8]"
          />
        </div>

        <div className="mt-3 flex justify-between text-[12px] font-semibold">
          {[1, 2, 3, 4, 5].map((step) => (
            <span
              key={step}
              className={
                step === currentStep.stepNumber
                  ? "text-[#1D4ED8]"
                  : "text-[#98A2B3]"
              }
            >
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Hauptkarte mit Anleitung */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-8 rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm"
      >
        <span className="inline-flex rounded-full bg-[#EEF4FF] px-3 py-1 text-[12px] font-bold text-[#1D4ED8]">
          {currentStep.badge}
        </span>

        <h2 className="mt-4 text-[20px] font-bold text-[#101828]">
          {currentStep.title}
        </h2>

        <p className="mt-3 text-[15px] leading-6 text-[#344054]">
          {currentStep.instruction}
        </p>

        <div className="mt-5 flex gap-3 rounded-2xl border border-[#FEC84B] bg-[#FFFAEB] p-4">
          <ShieldAlert size={22} className="shrink-0 text-[#DC6803]" />

          <p className="text-[14px] font-semibold leading-5 text-[#B54708]">
            {currentStep.warning}
          </p>
        </div>
      </motion.div>

      {/* Touchfreie Steuerung */}
      <div className="mt-7">
        <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#667085]">
          Touchfreie Steuerung
        </h3>

        <div className="mt-4 space-y-3">
          <GestureHint
            icon={<MoveRight size={18} />}
            title="Kopf rechts"
            description="Weiter zum nächsten Schritt"
          />

          <GestureHint
            icon={<ChevronLeft size={18} />}
            title="Kopf links"
            description="Zurück zum vorherigen Schritt"
          />

          <GestureHint
            icon={<MessageCircle size={18} />}
            title="„Notiz“ sagen"
            description="Sprachnotiz für Beobachtungen öffnen"
          />
        </div>
      </div>

      {/* Fallback-Buttons */}
      <div className="mt-8 grid grid-cols-[52px_1fr_1fr] gap-3">
        <button
          onClick={() => onNavigate("02")}
          aria-label="Zurück"
          className="flex h-[52px] items-center justify-center rounded-2xl bg-[#F2F4F7] text-[#344054] transition hover:bg-[#EAECF0] active:scale-[0.99]"
        >
          <ChevronLeft size={22} />
        </button>

        <button
          onClick={() => onNavigate("05")}
          className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#E8F0FE] text-[14px] font-bold text-[#1D4ED8] transition hover:bg-[#DCEBFF] active:scale-[0.99]"
        >
          <FileText size={18} />
          Notiz
        </button>

        <button
          onClick={() => onNavigate("04")}
          className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#1D4ED8] text-[14px] font-bold text-white shadow-sm transition hover:brightness-95 active:scale-[0.99]"
        >
          Weiter
          <ChevronRight size={18} />
        </button>
      </div>

      <p className="mt-6 text-center text-[12px] leading-5 text-[#667085]">
        Status: touchfreie Navigation über Kopfbewegung oder globale
        Sprachbefehle.
      </p>
    </section>
  );
}

function GestureHint({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#F2F4F7] bg-[#F9FAFB] p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FF] text-[#1D4ED8]">
        {icon}
      </div>

      <div>
        <p className="text-[13px] font-bold text-[#101828]">{title}</p>
        <p className="text-[12px] leading-4 text-[#667085]">
          {description}
        </p>
      </div>
    </div>
  );
}