import { useState } from "react";
import { Download, Play, RotateCcw } from "lucide-react";
import { downloadMidi } from "../../shared/midi";
import type { MidiNote } from "../../shared/types";

const defaultPattern = [
  true,
  false,
  false,
  false,
  true,
  false,
  true,
  false,
  true,
  false,
  false,
  true,
  false,
  false,
  true,
  false,
];
export function BeatsTool() {
  const [pattern, setPattern] = useState(defaultPattern);
  const [bpm, setBpm] = useState(98);
  const toggle = (index: number) =>
    setPattern((current) =>
      current.map((value, item) => (item === index ? !value : value)),
    );
  const notes: MidiNote[] = pattern.flatMap((active, index) =>
    active
      ? [
          {
            pitch: index % 4 === 0 ? 36 : 42,
            start: index / 2,
            duration: 0.35,
            velocity: index % 4 === 0 ? 115 : 80,
          },
        ]
      : [],
  );
  return (
    <div className="studio-grid">
      <div className="controls-panel">
        <div className="control-block">
          <label>
            Tempo <span>{bpm} bpm</span>
          </label>
          <input
            type="range"
            min="70"
            max="160"
            value={bpm}
            onChange={(event) => setBpm(Number(event.target.value))}
          />
        </div>
        <div className="control-block">
          <label>Pattern</label>
          <div className="pattern-label">
            <span>kick + hat</span>
            <span>16 steps</span>
          </div>
          <div className="step-grid">
            {pattern.map((active, index) => (
              <button
                key={index}
                className={`${active ? "active" : ""} ${index % 4 === 0 ? "bar-start" : ""}`}
                onClick={() => toggle(index)}
                aria-label={`Step ${index + 1}`}
              />
            ))}
          </div>
        </div>
        <button
          className="secondary-button"
          onClick={() => setPattern(defaultPattern)}
        >
          <RotateCcw size={16} /> reset pattern
        </button>
      </div>
      <div className="visual-panel beat-panel">
        <div className="panel-caption">
          <span>loop preview</span>
          <button className="play-button">
            <Play size={16} fill="currentColor" /> play
          </button>
        </div>
        <div className="waveform">
          {Array.from({ length: 34 }, (_, index) => (
            <i
              key={index}
              style={{
                height: `${18 + Math.abs(Math.sin(index * 2.8)) * 65}%`,
              }}
            />
          ))}
        </div>
        <div className="beat-readout">
          <strong>{bpm}</strong>
          <span>
            BPM
            <br />4 / 4 time
          </span>
        </div>
        <div className="panel-footer">
          <span>1 bar / GM drums</span>
          <button
            className="download-button"
            onClick={() => downloadMidi("virtual-composer-beat.mid", notes)}
          >
            <Download size={17} /> Download MIDI
          </button>
        </div>
      </div>
      <div className="prompt-strip">
        Start with the kick. Then remove one thing. The pocket usually lives in
        the negative space.
      </div>
    </div>
  );
}
