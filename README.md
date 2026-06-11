# TouchLab Assistant

TouchLab Assistant ist ein HCI-/MMI-Prototyp für eine touchfreie Labor-App.  
Die App unterstützt Studierende während eines Laborversuchs durch Anleitung, Notizen, Timer und Sicherheitsinformationen.

Der Fokus liegt auf der Interaktion in Situationen, in denen ein Smartphone nicht direkt berührt werden sollte, zum Beispiel wegen Handschuhen, Chemikalien oder Kontamination.

## Projektkontext

Dieses Projekt entstand im Rahmen des Moduls Mensch-Maschine-Interaktion.

Ziel war es, eine interaktive Anwendung zu entwickeln, die ein reales Nutzungsproblem adressiert:

> Wie können Studierende im Labor digitale Informationen nutzen, ohne ihr Smartphone mit kontaminierten Handschuhen berühren zu müssen?

## Kernidee

TouchLab Assistant kombiniert mehrere Interaktionsformen:

- Kopfbewegung zur Navigation
- Sprach-/Audioaufnahme für Beobachtungsnotizen
- Timer für zeitkritische Laborschritte
- Sicherheitsinformationen zu Stoffen
- Bestätigungsschutz für kritische Aktionen
- Tastatur-Shortcuts als stabiler Demo- und Fallback-Modus

Die App ist als funktionaler Prototyp umgesetzt und demonstriert die wichtigsten HCI-Interaktionen.

## Funktionen

### Laboranleitung

Die App führt Nutzer durch einzelne Versuchsschritte.  
Die Darstellung ist bewusst reduziert gestaltet, damit Informationen im Labor schnell erfassbar bleiben.

### Kopfsteuerung

Die App enthält eine kamerabasierte Kopfbewegungserkennung mit MediaPipe.

Beispiele:

- Kopf nach rechts: weiter
- Kopf nach links: zurück
- Kalibrierung der neutralen Kopfposition
- visuelles Feedback zur erkannten Richtung

Die Kopfsteuerung zeigt, wie eine touchfreie Navigation im Labor umgesetzt werden kann.

### Sprachnotiz / Audioaufnahme

Studierende können Beobachtungen als Audio aufnehmen.  
Zusätzlich gibt es ein optionales Live-Transkript, falls der Browser dies unterstützt.

Da Browser-Spracherkennung je nach Gerät, Netzwerk und Browser unzuverlässig sein kann, ist die Audioaufnahme der zuverlässige Primärkanal. Das Textfeld dient als Korrektur- und Fallback-Möglichkeit.

### Sicherheitsinformationen

Die App stellt wichtige Sicherheitsinformationen zu Laborstoffen bereit, zum Beispiel:

- Ethanol
- Salzsäure
- Natronlauge

Die Informationen sind prototypisch integriert und dienen der Demonstration des Interaktionskonzepts.

### Timer

Ein integrierter Timer unterstützt zeitkritische Laboraufgaben.  
Der Timer kann gestartet, pausiert und zurückgesetzt werden.

### Bestätigungsschutz

Kritische Aktionen, zum Beispiel das Speichern einer Notiz, werden nicht sofort ausgeführt.  
Stattdessen gibt es eine zusätzliche Bestätigung, um Fehlbedienungen zu vermeiden.

## Demo-Shortcuts

Für eine stabile Präsentation enthält der Prototyp Tastatur-Shortcuts.  
Diese dienen als Demo- und Fallback-Steuerung, insbesondere weil Browser-Spracherkennung nicht immer zuverlässig ist.

| Taste | Aktion |
|---|---|
| H | Startseite |
| V | Versuchsauswahl |
| A | Anleitung |
| W | Weiter |
| N | Notiz |
| S | Sicherheitsinfos |
| T | Timer |
| Escape | Zurück |

Diese Shortcuts können als Wizard-of-Oz- bzw. Fallback-Mechanismus verstanden werden. Die HCI-Interaktionslogik bleibt dabei erhalten.

## HCI-Designentscheidungen

### Touchfreie Interaktion als Primärkonzept

Die App ist für Situationen gedacht, in denen Touch-Eingaben problematisch sind.  
Buttons bleiben sichtbar, dienen aber als Fallback für Prototyping, Sicherheit und Testbarkeit.

### Feedback und Fehlertoleranz

Jede alternative Eingabeform benötigt klares Feedback.  
Deshalb zeigt die App an, ob Kopfbewegung, Audioaufnahme oder Demo-Steuerung aktiv sind.

### Kalibrierung

Da Nutzer unterschiedlich vor der Kamera sitzen, wird eine neutrale Kopfposition kalibriert.  
Dadurch wird die Erkennung robuster und persönlicher.

### Fallback statt Abbruch

Wenn automatische Transkription nicht verfügbar ist, bleibt die Audioaufnahme erhalten.  
Wenn Sprache nicht zuverlässig erkannt wird, können Shortcuts oder Buttons genutzt werden.

### Privatsphäre

Der Prototyp enthält einen Avatar-Modus für die Kopfsteuerung.  
Die Kamera kann im Hintergrund zur Bewegungserkennung genutzt werden, ohne dauerhaft das echte Gesicht im Interface zu zeigen.

## Technologie

- React
- TypeScript
- Vite
- Tailwind CSS
- Motion
- Lucide React
- MediaPipe Tasks Vision
- Web APIs:
  - MediaDevices
  - MediaRecorder
  - Web Speech API, optional

## Installation

```bash
npm install
