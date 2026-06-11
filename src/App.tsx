import { useState } from "react";
import Screen01Startscreen from "./components/Screen01Startscreen";
import Screen02VersuchAuswaehlen from "./components/Screen02VersuchAuswaehlen";
import Screen03Anleitung from "./components/Screen03Anleitung";
import Screen04GesteErkannt from "./components/Screen04GesteErkannt";
import Screen05Sprachnotiz from "./components/Screen05Sprachnotiz";
import Screen07Bestaetigung from "./components/Screen07Bestaetigung";
import Screen06Sicherheitsinfo from "./components/Screen06Sicherheitsinfo";
import ScreenTimer from "./components/ScreenTimer";
import GlobalTouchFreeDock from "./components/GlobalTouchFreeDock";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

type Screen = "01" | "02" | "03" | "04" | "05" | "06" | "07" | "timer";

function App() {
  const [current, setCurrent] = useState<Screen>("01");

  function navigate(screen: string) {
    const validScreens: Screen[] = [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "timer",
    ];

    if (validScreens.includes(screen as Screen)) {
      setCurrent(screen as Screen);
    }
  }

  /**
   * Globale Demo-Shortcuts:
   * H = Home
   * V = Versuch
   * A = Anleitung
   * W = Weiter
   * N = Notiz
   * S = Sicherheit
   * T = Timer
   * Escape = Zurück
   */
  useKeyboardShortcuts({
    current,
    onNavigate: navigate,
  });

  /**
   * Das globale Dock ist auf diesen Screens aus:
   *
   * Screen04:
   * Hat eigene Kamera / MediaPipe für den detaillierten Gestentest.
   *
   * Screen05:
   * Hat eigene Spracherkennung für die Notizaufnahme.
   *
   * Screen07:
   * Kritische Bestätigung, keine globale Navigation.
   */
  const showTouchFreeDock =
    current !== "04" && current !== "05" && current !== "07";

  return (
    <main className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
      <div className="relative w-full max-w-[430px] min-h-[932px] overflow-hidden rounded-[32px] bg-[#F7F9FC] shadow-2xl">
        {current === "01" && <Screen01Startscreen onNavigate={navigate} />}
        {current === "02" && (
          <Screen02VersuchAuswaehlen onNavigate={navigate} />
        )}
        {current === "03" && <Screen03Anleitung onNavigate={navigate} />}
        {current === "04" && <Screen04GesteErkannt onNavigate={navigate} />}
        {current === "05" && <Screen05Sprachnotiz onNavigate={navigate} />}
        {current === "06" && <Screen06Sicherheitsinfo onNavigate={navigate} />}
        {current === "07" && <Screen07Bestaetigung onNavigate={navigate} />}
        {current === "timer" && <ScreenTimer onNavigate={navigate} />}

        {showTouchFreeDock && (
          <GlobalTouchFreeDock current={current} onNavigate={navigate} />
        )}
      </div>
    </main>
  );
}

export default App;