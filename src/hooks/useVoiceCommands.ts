import { useEffect, useRef, useState } from "react";

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<{
    isFinal: boolean;
    0: {
      transcript: string;
      confidence?: number;
    };
  }>;
};

type SpeechRecognitionErrorEventLike = Event & {
  error: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type VoiceCommand = {
  words: string[];
  action: () => void;
};

type UseVoiceCommandsOptions = {
  commands: VoiceCommand[];
};

export function useVoiceCommands({ commands }: UseVoiceCommandsOptions) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const commandsRef = useRef(commands);
  const shouldRestartRef = useRef(false);

  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastCommand, setLastCommand] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);

  useEffect(() => {
    const speechWindow = window as WindowWithSpeechRecognition;

    const SpeechRecognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      setErrorMessage(
        "Sprachsteuerung wird in diesem Browser nicht unterstützt. Bitte Chrome oder Edge nutzen."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimText = "";
      let finalText = "";

      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];

        if (!result || !result[0]) continue;

        const transcript = result[0].transcript.trim();

        if (result.isFinal) {
          finalText += transcript + " ";
        } else {
          interimText += transcript + " ";
        }
      }

      const cleanInterim = interimText.trim();
      const cleanFinal = finalText.trim();

      if (cleanInterim) {
        setLiveTranscript(cleanInterim);
      }

      if (cleanFinal) {
        const lowerFinal = cleanFinal.toLowerCase();

        setLastTranscript(cleanFinal);
        setLiveTranscript("");

        const matchedCommand = commandsRef.current.find((command) =>
          command.words.some((word) =>
            lowerFinal.includes(word.toLowerCase())
          )
        );

        if (matchedCommand) {
          setLastCommand(cleanFinal);
          matchedCommand.action();
        }
      }
    };

    recognition.onerror = (event) => {
      setListening(false);

      if (event.error === "not-allowed") {
        setErrorMessage(
          "Mikrofon wurde blockiert. Bitte Mikrofon im Browser erlauben."
        );
      } else if (event.error === "no-speech") {
        setErrorMessage("Keine Sprache erkannt. Bitte nochmal sprechen.");
      } else {
        setErrorMessage(`Sprachfehler: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setListening(false);

      if (shouldRestartRef.current) {
        try {
          recognition.start();
          setListening(true);
        } catch {
          setListening(false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldRestartRef.current = false;

      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;

      try {
        recognition.stop();
      } catch {
        // Recognition war eventuell schon gestoppt.
      }

      recognitionRef.current = null;
    };
  }, []);

  function startListening() {
    if (!recognitionRef.current) return;

    setErrorMessage("");
    setLiveTranscript("");
    shouldRestartRef.current = true;

    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      setListening(true);
    }
  }

  function stopListening() {
    if (!recognitionRef.current) return;

    shouldRestartRef.current = false;

    try {
      recognitionRef.current.stop();
    } catch {
      // Recognition war eventuell schon gestoppt.
    }

    setListening(false);
  }

  return {
    listening,
    supported,
    liveTranscript,
    lastTranscript,
    lastCommand,
    errorMessage,
    startListening,
    stopListening,
  };
}