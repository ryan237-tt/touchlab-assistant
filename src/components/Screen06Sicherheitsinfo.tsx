import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  FileSearch,
  Search,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";

/**
 * Props für Screen 06.
 *
 * onNavigate kommt aus App.tsx.
 * Damit kann dieser Screen zurück zum Startscreen oder zur Anleitung.
 */
type Screen06SicherheitsinfoProps = {
  onNavigate: (screen: string) => void;
};

/**
 * Gefahren-Level.
 *
 * high:
 *   hohe Gefahr, z. B. ätzend
 *
 * medium:
 *   mittlere Gefahr, z. B. leicht entzündlich
 *
 * low:
 *   geringe Gefahr
 */
type HazardLevel = "high" | "medium" | "low";

/**
 * Datenstruktur für eine Chemikalie.
 *
 * Diese Struktur ist unsere kleine lokale Gefahrstoff-Datenbank.
 */
type Chemical = {
  id: string;
  name: string;
  hazard: string;
  level: HazardLevel;
  warnings: string[];
};

/**
 * Kleine lokale Datenbank.
 *
 * Für den Prototyp brauchen wir kein echtes SDS-System.
 * Wir zeigen nur beispielhaft, wie die Sicherheitsinfos aussehen könnten.
 */
const chemicals: Chemical[] = [
  {
    id: "ethanol",
    name: "Ethanol",
    hazard: "Leicht entzündlich",
    level: "medium",
    warnings: [
      "Schutzbrille tragen",
      "Von Zündquellen fernhalten",
      "Nur in gut belüfteten Räumen verwenden",
    ],
  },
  {
    id: "hcl",
    name: "Salzsäure (HCl)",
    hazard: "Ätzend",
    level: "high",
    warnings: [
      "Schutzhandschuhe Pflicht",
      "Dämpfe nicht einatmen",
      "Neutralisationsmittel bereithalten",
    ],
  },
  {
    id: "naoh",
    name: "Natronlauge (NaOH)",
    hazard: "Ätzend",
    level: "high",
    warnings: [
      "Vollkörperschutz empfohlen",
      "Bei Hautkontakt sofort abspülen",
      "Nicht mit Säuren mischen",
    ],
  },
];

/**
 * Screen 06: Sicherheitsinfo
 *
 * HCI-Ziel:
 * Sicherheitsinformationen müssen im Labor schnell,
 * klar und ohne unnötige Suche erreichbar sein.
 *
 * Deshalb:
 * - Suchfeld oben
 * - kurze Ergebnisliste
 * - klare Warnkarte
 * - einfache Bulletpoints
 * - farbliche Hervorhebung nach Gefahr
 */
export default function Screen06Sicherheitsinfo({
  onNavigate,
}: Screen06SicherheitsinfoProps) {
  const [query, setQuery] = useState("Ethanol");
  const [selectedChemicalId, setSelectedChemicalId] = useState("ethanol");

  /**
   * Gefilterte Chemikalien.
   *
   * useMemo bedeutet:
   * Diese Liste wird nur neu berechnet,
   * wenn sich query ändert.
   *
   * Für kleine Daten wäre das nicht zwingend nötig,
   * aber es zeigt eine saubere React-Denkweise.
   */
  const filteredChemicals = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) return chemicals;

    return chemicals.filter((chemical) =>
      chemical.name.toLowerCase().includes(normalizedQuery)
    );
  }, [query]);

  /**
   * Die aktuell ausgewählte Chemikalie.
   */
  const selectedChemical =
    chemicals.find((chemical) => chemical.id === selectedChemicalId) ||
    chemicals[0];

  const colors = getHazardColors(selectedChemical.level);

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
            Sicherheitsinfo
          </h1>

          <p className="mt-2 text-[15px] leading-[22px] text-[#475467]">
            Suche Gefahrstoffe und öffne wichtige Laborhinweise touchfrei.
          </p>
        </div>
      </header>

      {/* Suchfeld */}
      <div className="mt-8">
        <label className="mb-2 block text-[13px] font-bold text-[#344054]">
          Chemikalien & Gefahrstoffe
        </label>

        <div className="flex h-12 items-center gap-3 rounded-2xl border border-[#D0D5DD] bg-white px-4 shadow-sm">
          <Search size={18} className="text-[#98A2B3]" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="z. B. Ethanol, HCl, NaOH"
            className="w-full bg-transparent text-[15px] font-medium text-[#101828] outline-none placeholder:text-[#98A2B3]"
          />
        </div>
      </div>

      {/* Ergebnisliste */}
      <div className="mt-5 space-y-3">
        {filteredChemicals.map((chemical, index) => {
          const isActive = chemical.id === selectedChemical.id;

          return (
            <motion.button
              key={chemical.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => {
                setSelectedChemicalId(chemical.id);
                setQuery(chemical.name);
              }}
              className={[
                "flex w-full items-center justify-between rounded-2xl border p-4 text-left shadow-sm transition active:scale-[0.99]",
                isActive
                  ? "border-[#1D4ED8] bg-[#EEF4FF]"
                  : "border-[#EAECF0] bg-white hover:bg-[#F9FAFB]",
              ].join(" ")}
            >
              <div>
                <p className="text-[15px] font-bold text-[#101828]">
                  {chemical.name}
                </p>
                <p className="mt-1 text-[13px] text-[#667085]">
                  {chemical.hazard}
                </p>
              </div>

              <span
                className={[
                  "rounded-full px-3 py-1 text-[11px] font-bold",
                  getHazardPillClass(chemical.level),
                ].join(" ")}
              >
                {chemical.level === "high"
                  ? "hoch"
                  : chemical.level === "medium"
                    ? "mittel"
                    : "niedrig"}
              </span>
            </motion.button>
          );
        })}

        {filteredChemicals.length === 0 && (
          <div className="rounded-2xl border border-[#EAECF0] bg-white p-4 text-center">
            <p className="text-[14px] text-[#667085]">
              Kein Gefahrstoff gefunden.
            </p>
          </div>
        )}
      </div>

      {/* Gefahrstoffkarte */}
      <motion.div
        key={selectedChemical.id}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={[
          "mt-7 rounded-3xl border p-5 shadow-sm",
          colors.background,
          colors.border,
        ].join(" ")}
      >
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white">
            <AlertTriangle size={24} className={colors.text} />
          </div>

          <div>
            <h2 className="text-[20px] font-bold text-[#101828]">
              {selectedChemical.name}
            </h2>

            <p className={["mt-1 text-[14px] font-bold", colors.text].join(" ")}>
              {selectedChemical.hazard}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {selectedChemical.warnings.map((warning) => (
            <div key={warning} className="flex gap-3">
              <ShieldCheck size={18} className={["shrink-0", colors.text].join(" ")} />
              <p className="text-[14px] leading-5 text-[#344054]">{warning}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Aktionsbuttons */}
      <div className="mt-8 space-y-3">
        <button
          onClick={() => alert("SDS-Dokument würde im finalen System geöffnet werden.")}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1D4ED8] text-[16px] font-bold text-white shadow-sm transition hover:brightness-95 active:scale-[0.99]"
        >
          <FileSearch size={20} />
          SDS öffnen
        </button>

        <button
          onClick={() =>
            alert("Kompatibilitätsprüfung wird später als Prototyp-Funktion erweitert.")
          }
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#E8F0FE] text-[15px] font-bold text-[#1D4ED8] transition hover:bg-[#DCEBFF] active:scale-[0.99]"
        >
          <ShieldCheck size={18} />
          Kompatibilität prüfen
        </button>
      </div>
    </section>
  );
}

/**
 * Gibt passende Farben für die Gefahrstoffkarte zurück.
 *
 * Warum Funktion?
 * So ist die Farblogik zentral an einer Stelle.
 * Wenn wir später Farben ändern, müssen wir nur hier ändern.
 */
function getHazardColors(level: HazardLevel) {
  if (level === "high") {
    return {
      text: "text-[#D92D20]",
      background: "bg-[#FEF3F2]",
      border: "border-[#FECDCA]",
    };
  }

  if (level === "medium") {
    return {
      text: "text-[#DC6803]",
      background: "bg-[#FFFAEB]",
      border: "border-[#FEC84B]",
    };
  }

  return {
    text: "text-[#027A48]",
    background: "bg-[#ECFDF3]",
    border: "border-[#6CE9A6]",
  };
}

/**
 * Gibt Farben für das kleine Gefahr-Level-Badge zurück.
 */
function getHazardPillClass(level: HazardLevel) {
  if (level === "high") {
    return "bg-[#FEF3F2] text-[#D92D20]";
  }

  if (level === "medium") {
    return "bg-[#FFFAEB] text-[#DC6803]";
  }

  return "bg-[#ECFDF3] text-[#027A48]";
}