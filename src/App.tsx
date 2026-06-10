import { useState } from "react";
import Screen01Startscreen from "./components/Screen01Startscreen";
import Screen02VersuchAuswaehlen from "./components/Screen02VersuchAuswaehlen";
import Screen03Anleitung from "./components/Screen03Anleitung";

/**
 * Alle möglichen Screens unserer App.
 *
 * Warum ein Type?
 * TypeScript schützt uns davor, falsche Screen-Namen zu benutzen.
 * Beispiel: "start" wäre falsch, "01" ist erlaubt.
 */
type Screen = "01" | "02" | "03" | "04" | "05" | "06" | "07" | "timer";

/**
 * Hauptkomponente der App.
 *
 * Aufgabe:
 * - Speichert, welcher Screen gerade aktiv ist.
 * - Gibt eine navigate()-Funktion an die Screens weiter.
 * - Zeigt je nach aktuellem Zustand den passenden Screen.
 */
function App() {
  /**
   * current speichert den aktuell sichtbaren Screen.
   * Am Anfang starten wir immer auf Screen 01.
   */
  const [current, setCurrent] = useState<Screen>("01");

  /**
   * Navigation zwischen Screens.
   *
   * Die Funktion bekommt eine Screen-ID als string.
   * Danach wird sie in unseren Screen-Type umgewandelt.
   *
   * Beispiel:
   * navigate("02") zeigt später die Versuchsauswahl.
   */
  function navigate(screen: string) {
    setCurrent(screen as Screen);
  }

  /**
   * Hier entscheiden wir, welcher Screen angezeigt wird.
   *
   * Aktuell haben wir nur Screen 01 gebaut.
   * Die anderen Screens kommen Schritt für Schritt dazu.
   */
  return (
    <main className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
      <div className="w-full max-w-[430px] min-h-[932px] overflow-hidden rounded-[32px] bg-[#F7F9FC] shadow-2xl">
        {current === "01" && <Screen01Startscreen onNavigate={navigate} />}
        {current === "02" && <Screen02VersuchAuswaehlen onNavigate={navigate} />}
        {current === "03" && <Screen03Anleitung onNavigate={navigate} />}

        {current !== "01" && current !== "02" && current !== "03" && (
          <div className="flex min-h-[932px] items-center justify-center p-6 text-center">
            <div>
              <p className="text-sm text-[#667085]">Screen {current}</p>
              <h1 className="mt-2 text-2xl font-bold text-[#101828]">
                Dieser Screen kommt als Nächstes.
              </h1>

              <button
                onClick={() => navigate("01")}
                className="mt-6 h-12 rounded-2xl bg-[#1D4ED8] px-6 font-semibold text-white"
              >
                Zurück zum Start
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default App;