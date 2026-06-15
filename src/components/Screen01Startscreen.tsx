import {
  ArrowRight,
  FlaskConical,
  Hand,
  Microscope,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";

type Screen01StartscreenProps = {
  onNavigate: (screen: string) => void;
};

export default function Screen01Startscreen({
  onNavigate,
}: Screen01StartscreenProps) {
  return (
    <section className="relative min-h-[932px] overflow-hidden bg-[linear-gradient(180deg,#F9FBFF_0%,#F3F7FD_44%,#F7F9FC_100%)] px-6 pt-8 pb-32 text-center">
      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[#BEE3FF]/35 blur-2xl" />
      <div className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-[#D9F3FF]/55 blur-2xl" />
      <div className="pointer-events-none absolute right-[-90px] top-[-10px] h-[260px] w-[260px] rounded-full border-[24px] border-[#BFDDFE]/25" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10"
      >
        <div className="mx-auto flex h-[126px] w-[126px] items-center justify-center rounded-full bg-white/80 shadow-[0_20px_45px_rgba(11,27,69,0.10)] ring-1 ring-white/70 backdrop-blur">
          <div className="flex h-[96px] w-[96px] items-center justify-center rounded-full bg-[radial-gradient(circle,#F9FCFF_0%,#EFF5FF_70%,#E6F0FF_100%)]">
            <Microscope size={66} strokeWidth={1.8} className="text-[#223B7B]" />
          </div>
        </div>

        <h1 className="mt-7 text-[34px] font-black tracking-[-0.04em] leading-[1.02] sm:text-[38px]">
          <span className="bg-gradient-to-r from-[#2F66FF] to-[#1848E8] bg-clip-text text-transparent">
            TouchLab
          </span>{" "}
          <span className="text-[#081B4B]">Assistant</span>
        </h1>

        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="h-1 w-16 rounded-full bg-gradient-to-r from-[#C9E8FF] to-[#74BDFD]" />
          <div className="h-2 w-2 rounded-full bg-[#7FBFFD]" />
        </div>

        <p className="mt-5 text-[17px] font-medium leading-7 text-[#5E6F91]">
          Wähle einen Modus für deinen nächsten
          <br />
          touchfreien Labor-Workflow.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
        className="relative z-10 mt-8 grid grid-cols-2 gap-4"
      >
        <ModeCard
          icon={
            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-[linear-gradient(180deg,#F7FBFF_0%,#EAF4FF_100%)] shadow-inner">
              <FlaskConical size={56} strokeWidth={1.8} className="text-[#2A63EE]" />
            </div>
          }
          title="Labor Mode"
          description={
            <>
              Notizen • Timer • Sicherheit
              <br />
              Kalibrierungsassistent
            </>
          }
          accentClass="text-[#244FE0]"
          buttonClass="bg-gradient-to-br from-[#3970FF] to-[#2147E8] shadow-[0_14px_24px_rgba(42,99,238,0.28)]"
          cardClass="bg-[linear-gradient(180deg,#F8FBFF_0%,#F3F7FF_100%)]"
          onClick={() => onNavigate("02")}
        />

        <ModeCard
          icon={
            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-[linear-gradient(180deg,#F7FFFE_0%,#EAF9F8_100%)] shadow-inner">
              <Microscope size={56} strokeWidth={1.8} className="text-[#0C8F93]" />
            </div>
          }
          title="Slides Scanner"
          description={
            <>
              Mikroskop, PC oder Laptop
              <br />
              verbinden und Präparate prüfen
            </>
          }
          accentClass="text-[#0E9193]"
          buttonClass="bg-gradient-to-br from-[#27C2BA] to-[#1199A0] shadow-[0_14px_24px_rgba(17,153,160,0.28)]"
          cardClass="bg-[linear-gradient(180deg,#F7FFFF_0%,#F1FBFA_100%)]"
          onClick={() => onNavigate("slides")}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.16 }}
        className="relative z-10 mt-8 rounded-[26px] border border-white/70 bg-white/70 px-5 py-4 text-left shadow-[0_18px_38px_rgba(8,27,75,0.08)] backdrop-blur"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EFF5FF] text-[#3970FF]">
            <Hand size={24} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[18px] font-bold text-[#0B1B45]">Touch-free ready</p>
            <p className="mt-1 text-[15px] leading-6 text-[#7A88A6]">
              Nutze Sprachbefehle und Handgesten für eine berührungsfreie Bedienung.
            </p>
          </div>
          <Sparkles size={22} className="mt-1 shrink-0 text-[#79BFFF]" />
        </div>
      </motion.div>
    </section>
  );
}

function ModeCard({
  icon,
  title,
  description,
  accentClass,
  buttonClass,
  cardClass,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  accentClass: string;
  buttonClass: string;
  cardClass: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={`flex min-h-[430px] flex-col items-center rounded-[32px] border border-white/80 px-4 pt-8 pb-6 text-center shadow-[0_24px_42px_rgba(14,31,81,0.08)] ring-1 ring-[#E7EEF8]/80 ${cardClass}`}
    >
      {icon}
      <h2 className={`mt-6 text-[26px] font-black leading-[1.05] tracking-[-0.03em] ${accentClass}`}>
        {title}
      </h2>
      <div className="mt-4 text-[15px] leading-6 text-[#667085]">{description}</div>

      <div className={`mt-auto flex h-[62px] w-[62px] items-center justify-center rounded-full text-white ${buttonClass}`}>
        <ArrowRight size={31} strokeWidth={2.5} />
      </div>
    </motion.button>
  );
}
