import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Pause, Play, Plus, Minus, Volume2 } from "lucide-react";
import { DownloadButton } from "../../App";
import { downloadMidi } from "../../shared/midi";
import type { MidiNote } from "../../shared/types";

type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type KeyOption = { label: string; root: number; minor: boolean };
type Emotion = { from: Degree; to: Degree; label: string };

const roman: Record<Degree, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
};
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
const majorKeys = [
  ["C", 0],
  ["D♭", 1],
  ["D", 2],
  ["E♭", 3],
  ["E", 4],
  ["F", 5],
  ["F♯", 6],
  ["G", 7],
  ["A♭", 8],
  ["A", 9],
  ["B♭", 10],
  ["B", 11],
] as const;
const keyOptions: KeyOption[] = majorKeys.flatMap(([label, root]) => [
  { label: `${label} major`, root: 60 + root, minor: false },
  { label: `${label} minor`, root: 57 + root, minor: true },
]);

const emotionRows = [
  ["I", "II", "resignation"],
  ["I", "III", "loneliness"],
  ["I", "IV", "exploration, warmth"],
  ["I", "V", "optimism energy"],
  ["I", "VI", "pure negative"],
  ["I", "VII", "destabilisation"],
  ["II", "I", "clouded peace"],
  ["II", "III", "heightened dramatic intensity"],
  ["II", "IV", "help, sweetness, magnificence"],
  ["II", "V", "happy clarification"],
  ["II", "VI", "closedness, shyness"],
  ["II", "VII", "uncertainty"],
  ["III", "I", "soft return"],
  ["III", "II", "faltering"],
  ["III", "IV", "overcoming solace"],
  ["III", "V", "strength, happy surprise"],
  ["III", "VI", "sad resolution, acceptance"],
  ["III", "VII", "unknown, complexity"],
  ["IV", "I", "bright peace"],
  ["IV", "II", "darkening"],
  ["IV", "III", "loss, fragility"],
  ["IV", "V", "heightened joy"],
  ["IV", "VI", "hardship"],
  ["IV", "VII", "drama, tension, alarm"],
  ["V", "I", "bright resolution"],
  ["V", "II", "setback"],
  ["V", "III", "bad news, left hanging"],
  ["V", "IV", "calm"],
  ["V", "VI", "disappointment"],
  ["V", "VII", "thickening, added tension"],
  ["VI", "I", "pure positive"],
  ["VI", "II", "hope, opening up"],
  ["VI", "III", "gravitas, epicness"],
  ["VI", "IV", "redemption, support"],
  ["VI", "V", "positive transformation"],
  ["VI", "VII", "pain, confusion"],
  ["VII", "I", "bright resolution"],
  ["VII", "II", "negative surprise"],
  ["VII", "III", "despair, anger"],
  ["VII", "IV", "mystery, magic"],
  ["VII", "V", "release"],
  ["VII", "VI", "dark resolution"],
] as const;
const emotions: Emotion[] = emotionRows.map(([from, to, label]) => ({
  from: romanToDegree(from),
  to: romanToDegree(to),
  label,
}));

function romanToDegree(value: string): Degree {
  return (["I", "II", "III", "IV", "V", "VI", "VII"].indexOf(value) +
    1) as Degree;
}

function emotionFor(from: Degree, to: Degree) {
  return emotions.find((emotion) => emotion.from === from && emotion.to === to);
}

function chordName(degree: Degree, key: KeyOption) {
  const majorIntervals = [0, 2, 4, 5, 7, 9, 11];
  const minorIntervals = [0, 2, 3, 5, 7, 8, 10];
  const pitch =
    key.root + (key.minor ? minorIntervals : majorIntervals)[degree - 1];
  return noteNames[pitch % 12];
}

function chordQuality(degree: Degree, key: KeyOption) {
  const quality = key.minor
    ? ["minor", "diminished", "major", "minor", "minor", "major", "major"][
        degree - 1
      ]
    : ["major", "minor", "minor", "major", "major", "minor", "diminished"][
        degree - 1
      ];
  return quality === "diminished" ? "dim" : quality === "major" ? "maj" : "min";
}

function chordNotes(degree: Degree, key: KeyOption, start: number): MidiNote[] {
  const root =
    key.root +
    (key.minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11])[degree - 1];
  const quality = key.minor
    ? ["minor", "diminished", "major", "minor", "minor", "major", "major"][
        degree - 1
      ]
    : ["major", "minor", "minor", "major", "major", "minor", "diminished"][
        degree - 1
      ];
  const intervals =
    quality === "major"
      ? [0, 4, 7]
      : quality === "diminished"
        ? [0, 3, 6]
        : [0, 3, 7];
  return intervals.map((interval) => ({
    pitch: root + interval,
    start,
    duration: 8,
    velocity: 82,
  }));
}

export function TonalMapTool() {
  const [keyIndex, setKeyIndex] = useState(0);
  const [steps, setSteps] = useState(5);
  const [degrees, setDegrees] = useState<Degree[]>([1, 4, 5, 6, 1]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState("");
  const audioContext = useRef<AudioContext | null>(null);
  const stopTimer = useRef<number>();
  const key = keyOptions[keyIndex];
  const activeDegrees = degrees.slice(0, steps);
  const notes = useMemo(
    () =>
      activeDegrees.flatMap((degree, index) =>
        chordNotes(degree, key, index * 8),
      ),
    [activeDegrees, key],
  );

  useEffect(
    () => () => {
      if (stopTimer.current) window.clearTimeout(stopTimer.current);
      void audioContext.current?.close();
    },
    [],
  );

  const updateSteps = (next: number) => {
    const count = Math.max(2, Math.min(8, next));
    setSteps(count);
    setDegrees((current) =>
      [...current, ...Array.from({ length: 8 }, () => 1 as Degree)].slice(
        0,
        count,
      ),
    );
  };
  const updateDegree = (index: number, value: Degree) =>
    setDegrees((current) =>
      current.map((degree, itemIndex) =>
        itemIndex === index ? value : degree,
      ),
    );

  const playProgression = async () => {
    try {
      const context = audioContext.current ?? new AudioContext();
      audioContext.current = context;
      await context.resume();
      const now = context.currentTime + 0.05;
      const secondsPerChord = (60 / 104) * 4;
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
        secondsPerChord * activeDegrees.length * 1000,
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

  return (
    <div className="tonal-map">
      <div className="tonal-map-toolbar">
        <label>
          key
          <select
            value={keyIndex}
            onChange={(event) => setKeyIndex(Number(event.target.value))}
          >
            {keyOptions.map((option, index) => (
              <option value={index} key={option.label}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="step-control">
          <span>steps</span>
          <button
            aria-label="Remove a step"
            disabled={steps === 2}
            onClick={() => updateSteps(steps - 1)}
          >
            <Minus size={15} />
          </button>
          <strong>{steps}</strong>
          <button
            aria-label="Add a step"
            disabled={steps === 8}
            onClick={() => updateSteps(steps + 1)}
          >
            <Plus size={15} />
          </button>
        </div>
        <span className="tonal-map-note">
          Choose a chord or emotion. The map responds instantly.
        </span>
      </div>
      <div className="tonal-map-board">
        <div className="tonal-map-line" />
        {activeDegrees.map((degree, index) => (
          <div className="tonal-map-step" key={index}>
            <div
              className={`tonal-chord-card ${index === 0 ? "is-start" : ""}`}
            >
              <div className="degree-picker">
                <button
                  className="degree-picker-trigger"
                  aria-label={`Change chord, currently ${roman[degree]}`}
                >
                  <strong>{roman[degree]}</strong>
                </button>
                <div
                  className="degree-picker-menu"
                  role="menu"
                  aria-label="Choose chord"
                >
                  {([1, 2, 3, 4, 5, 6, 7] as Degree[]).map((option) => (
                    <button
                      key={option}
                      role="menuitem"
                      className={degree === option ? "selected" : ""}
                      onClick={() => updateDegree(index, option)}
                    >
                      {roman[option]}
                    </button>
                  ))}
                </div>
              </div>
              <span className="tonal-chord-name">
                {chordName(degree, key)} {chordQuality(degree, key)}
              </span>
            </div>
            {index < activeDegrees.length - 1 && (
              <div
                className={`tonal-emotion ${index % 2 === 0 ? "emotion-top" : "emotion-bottom"}`}
              >
                <div className="emotion-picker">
                  <button
                    className="emotion-picker-trigger"
                    aria-label="Change emotion"
                  >
                    {emotionFor(degree, activeDegrees[index + 1])?.label ??
                      "choose a feeling"}
                  </button>
                  <div
                    className="emotion-picker-menu"
                    role="menu"
                    aria-label="Choose emotion"
                  >
                    {emotions
                      .filter((emotion) => emotion.from === degree)
                      .map((emotion, optionIndex) => (
                        <button
                          key={`${emotion.from}-${emotion.to}`}
                          role="menuitem"
                          className={
                            emotion.to === activeDegrees[index + 1]
                              ? "selected"
                              : ""
                          }
                          style={
                            {
                              "--emotion-hue": `${optionIndex * 53 + 12}`,
                            } as CSSProperties
                          }
                          onClick={() => updateDegree(index + 1, emotion.to)}
                        >
                          {emotion.label}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="tonal-map-actions">
        <button
          className={`play-progression ${isPlaying ? "playing" : ""}`}
          onClick={isPlaying ? stopPlayback : playProgression}
        >
          {isPlaying ? (
            <Pause size={17} fill="currentColor" />
          ) : (
            <Play size={17} fill="currentColor" />
          )}{" "}
          {isPlaying ? "stop sequence" : "play sequence"} <Volume2 size={16} />
        </button>
        <DownloadButton
          onClick={() => downloadMidi("virtual-composer-tonal-map.mid", notes)}
          label="Download MIDI"
        />
      </div>
      {audioError && (
        <p className="audio-error" role="alert">
          {audioError}
        </p>
      )}
    </div>
  );
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
