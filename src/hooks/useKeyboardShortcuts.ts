import { useEffect } from "react";

type Screen = "01" | "02" | "03" | "04" | "05" | "06" | "07" | "timer";

type UseKeyboardShortcutsOptions = {
  current: Screen;
  onNavigate: (screen: string) => void;
};

/**
 * Globale Demo-Shortcuts für den HCI-Prototyp.
 *
 * Ziel:
 * Die App bleibt auch dann zuverlässig steuerbar,
 * wenn Browser-Spracherkennung langsam oder ungenau ist.
 *
 * Shortcuts:
 * H = Home / Start
 * V = Versuchsauswahl
 * A = Anleitung
 * W = Weiter
 * N = Notiz
 * S = Sicherheit
 * T = Timer
 * Escape = Zurück
 */
export function useKeyboardShortcuts({
  current,
  onNavigate,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      /**
       * Wichtig:
       * Wenn Nutzer gerade in einem Input oder Textfeld schreibt,
       * sollen Shortcuts NICHT auslösen.
       */
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName.toLowerCase();

      const isTyping =
        tagName === "input" ||
        tagName === "textarea" ||
        target?.isContentEditable;

      if (isTyping) return;

      const key = event.key.toLowerCase();

      if (key === "h") {
        event.preventDefault();
        onNavigate("01");
        return;
      }

      if (key === "v") {
        event.preventDefault();
        onNavigate("02");
        return;
      }

      if (key === "a") {
        event.preventDefault();
        onNavigate("03");
        return;
      }

      if (key === "n") {
        event.preventDefault();
        onNavigate("05");
        return;
      }

      if (key === "s") {
        event.preventDefault();
        onNavigate("06");
        return;
      }

      if (key === "t") {
        event.preventDefault();
        onNavigate("timer");
        return;
      }

      if (key === "w") {
        event.preventDefault();

        const next = getNextScreen(current);

        if (next) {
          onNavigate(next);
        }

        return;
      }

      if (key === "escape") {
        event.preventDefault();

        const previous = getPreviousScreen(current);

        if (previous) {
          onNavigate(previous);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [current, onNavigate]);
}

function getNextScreen(current: Screen): Screen | null {
  if (current === "01") return "02";
  if (current === "02") return "03";
  if (current === "03") return "04";
  if (current === "04") return "03";
  if (current === "06") return "01";
  if (current === "timer") return "01";

  return null;
}

function getPreviousScreen(current: Screen): Screen | null {
  if (current === "02") return "01";
  if (current === "03") return "02";
  if (current === "04") return "03";
  if (current === "05") return "03";
  if (current === "06") return "01";
  if (current === "07") return "05";
  if (current === "timer") return "01";

  return null;
}