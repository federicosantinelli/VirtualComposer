import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Shuffle, Volume2 } from "lucide-react";
import { DownloadButton } from "../../App";
import { downloadMidi } from "../../shared/midi";
import type { MidiNote } from "../../shared/types";

type TransitionId =
  | "bright-peace"
  | "exploration"
  | "drama"
  | "mystery"
  | "loneliness"
  | "redemption"
  | "release"
  | "clarification";

type Transition = {
  id: TransitionId;
  label: string;
  shortLabel: string;
  description: string;
  delta: number;
  symbol: string;
  accent: string;
};

const transitions: Transition[] = [
  {
    id: "bright-peace",
    label: "Bright peace",
    shortLabel: "bright peace",
    description: "opens into something safe",
    delta: 7,
    symbol: "↗",
    accent: "coral",
  },
  {
    id: "exploration",
    label: "Exploration / warmth",
    shortLabel: "exploration",
    description: "wanders somewhere curious",
    delta: 4,
    symbol: "✦",
    accent: "lime",
  },
  {
    id: "drama",
    label: "Drama / tension",
    shortLabel: "tension",
    description: "raises the stakes",
    delta: 5,
    symbol: "↯",
    accent: "blue",
  },
  {
    id: "mystery",
    label: "Mystery / magic",
    shortLabel: "mystery",
    description: "leaves a question hanging",
    delta: 2,
    symbol: "✧",
    accent: "yellow",
  },
  {
    id: "loneliness",
    label: "Loneliness",
    shortLabel: "loneliness",
    description: "pulls inward",
    delta: 9,
    symbol: "·",
    accent: "coral",
  },
  {
    id: "redemption",
    label: "Redemption / support",
    shortLabel: "support",
    description: "finds something to lean on",
    delta: 5,
    symbol: "♡",
    accent: "lime",
  },
  {
    id: "release",
    label: "Release",
    shortLabel: "release",
    description: "lets the pressure go",
    delta: 7,
    symbol: "↓",
    accent: "blue",
  },
  {
    id: "clarification",
    label: "Happy clarification",
    shortLabel: "clarity",
    description: "makes the answer glow",
    delta: 0,
    symbol: "!",
    accent: "yellow",
  },
];

const keyOptions = [
  { label: "C major", root: 60 },
  { label: "D major", root: 62 },
  { label: "E♭ major", root: 63 },
  { label: "A minor", root: 57 },
];

const noteNames = [
  "C",
  "C♯",
  "D",
  "E♭",
  "E",
  "F",
  "F♯",
  "G",
  "A♭",
  "A",
  "B♭",
  "B",
];

export function ChordsTool() {
  const [transitionIds, setTransitionIds] = useState<TransitionId[]>([
    "bright-peace",
    "drama",
    "release",
  ]);
  const [key, setKey] = useState(0);
  const [voicing, setVoicing] = useState<"open" | "tight">("open");
  const [intensity, setIntensity] = useState(55);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState("");
  const audioContext = useRef<AudioContext | null>(null);
  const stopTimer = useRef<number | undefined>(undefined);

  const selectedTransitions = transitionIds.map(
    (id) => transitions.find((item) => item.id === id) ?? transitions[0],
  );
  const chords = useMemo(
    () => makeChordRoute(selectedTransitions, keyOptions[key].root),
    [selectedTransitions, key],
  );
  const notes = useMemo(
    () =>
      chords.flatMap((chord, index) =>
        makeChordNotes(chord.root, index * 8, voicing, intensity),
      ),
    [chords, voicing, intensity],
  );

  useEffect(
    () => () => {
      if (stopTimer.current) window.clearTimeout(stopTimer.current);
      void audioContext.current?.close();
    },
    [],
  );

  const setTransition = (index: number, id: TransitionId) => {
    setTransitionIds((current) =>
      current.map((value, itemIndex) => (itemIndex === index ? id : value)),
    );
  };

  const playProgression = async () => {
    try {
      const context = audioContext.current ?? new AudioContext();
      audioContext.current = context;
      await context.resume();
      const now = context.currentTime + 0.05;
      const secondsPerChord = (60 / 110) * 4;
      notes.forEach((note) =>
        playNote(
          context,
          note.pitch,
          now + (note.start / 8) * secondsPerChord,
          (note.duration / 8) * secondsPerChord,
          (note.velocity ?? 70) / 127,
        ),
      );
      setIsPlaying(true);
      if (stopTimer.current) window.clearTimeout(stopTimer.current);
      stopTimer.current = window.setTimeout(
        () => setIsPlaying(false),
        secondsPerChord * 4 * 1000,
      );
    } catch {
      setAudioError("Audio playback is not available in this browser.");
    }
  };

  const stopPlayback = () => {
    if (stopTimer.current) window.clearTimeout(stopTimer.current);
    void audioContext.current?.close();
    audioContext.current = null;
    setIsPlaying(false);
  };

  const randomize = () =>
    setTransitionIds(
      [0, 0, 0].map(
        () => transitions[Math.floor(Math.random() * transitions.length)].id,
      ),
    );

  return (
    <div className="emotion-studio">
     

      <div className="emotion-result">
        <div className="result-heading">
          <div>
            <span className="control-kicker">Your emotional route</span>
            <h2>One chord at a time.</h2>
            <p>Start with {keyOptions[key].label}, then direct every turn.</p>
          </div>
          <div className="emotion-glyph">✦</div>
        </div>
        <div className="chord-settings">
          <label>
            Key
            <select
              value={key}
              onChange={(event) => setKey(Number(event.target.value))}
            >
              {keyOptions.map((option, index) => (
                <option value={index} key={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Voicing
            <div className="segmented">
              <button
                className={voicing === "open" ? "selected" : ""}
                onClick={() => setVoicing("open")}
              >
                open
              </button>
              <button
                className={voicing === "tight" ? "selected" : ""}
                onClick={() => setVoicing("tight")}
              >
                tight
              </button>
            </div>
          </label>
          <label>
            Intensity <span className="setting-value">{intensity}%</span>
            <input
              type="range"
              min="15"
              max="100"
              value={intensity}
              onChange={(event) => setIntensity(Number(event.target.value))}
            />
          </label>
        </div>
        <div className="chord-route">
          {chords.map((chord, index) => (
            <div className="route-step" key={`${chord.root}-${index}`}>
              <div
                className={`emotion-chord-card accent-${index === 0 ? "yellow" : selectedTransitions[index - 1].accent}`}
              >
                <span>
                  0{index + 1} / {index === 0 ? "start" : "arrive"}
                </span>
                <strong>{noteNames[chord.root % 12]}</strong>
                <small>{chord.roman}</small>
              </div>
              {index < selectedTransitions.length && (
                <TransitionControl
                  transition={selectedTransitions[index]}
                  onChange={(id) => setTransition(index, id)}
                />
              )}
            </div>
          ))}
        </div>
        <div className="emotion-actions">
          <button
            className={`play-progression ${isPlaying ? "playing" : ""}`}
            onClick={isPlaying ? stopPlayback : playProgression}
          >
            {isPlaying ? (
              <Pause size={17} fill="currentColor" />
            ) : (
              <Play size={17} fill="currentColor" />
            )}{" "}
            {isPlaying ? "stop progression" : "play progression"}{" "}
            <Volume2 size={16} />
          </button>
          <DownloadButton
            onClick={() =>
              downloadMidi("virtual-composer-emotional-route.mid", notes)
            }
          />
        </div>
        {audioError && (
          <p className="audio-error" role="alert">
            {audioError}
          </p>
        )}
        <div className="prompt-strip">
          Listen to the space between the cards. That emotional move is the most
          important chord in the progression.
        </div>
      </div>
    </div>
  );
}

function TransitionControl({
  transition,
  onChange,
}: {
  transition: Transition;
  onChange: (id: TransitionId) => void;
}) {
  return (
    <div className={`transition-control accent-${transition.accent}`}>
      <span className="transition-arrow">{transition.symbol}</span>
      <label>
        move into
        <select
          value={transition.id}
          onChange={(event) => onChange(event.target.value as TransitionId)}
        >
          {transitions.map((item) => (
            <option value={item.id} key={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <small>{transition.description}</small>
    </div>
  );
}

function makeChordRoute(selected: Transition[], root: number) {
  let currentRoot = root;
  return [
    { root: currentRoot, roman: "I" },
    ...selected.map((transition) => {
      currentRoot += transition.delta;
      return { root: currentRoot, roman: transition.label };
    }),
  ];
}

function makeChordNotes(
  root: number,
  start: number,
  voicing: "open" | "tight",
  intensity: number,
): MidiNote[] {
  const intervals = voicing === "open" ? [0, 4, 7, 12] : [0, 4, 7];
  return intervals.map((interval) => ({
    pitch: root + interval,
    start,
    duration: 8,
    velocity: 56 + Math.round(intensity * 0.42),
  }));
}

function playNote(
  context: AudioContext,
  pitch: number,
  start: number,
  duration: number,
  velocity: number,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = 440 * Math.pow(2, (pitch - 69) / 12);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(
    Math.max(0.01, velocity * 0.12),
    start + 0.025,
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}
