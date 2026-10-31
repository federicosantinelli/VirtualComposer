import { useState } from "react";
import { Dices, RefreshCw } from "lucide-react";
import { DownloadButton } from "../../App";
import { downloadMidi } from "../../shared/midi";
import type { MidiNote } from "../../shared/types";

const scales: Record<string, number[]> = {
  "C major": [0, 2, 4, 5, 7, 9, 11],
  "A minor": [0, 2, 3, 5, 7, 8, 10],
  "D dorian": [0, 2, 3, 5, 7, 9, 10],
  "E pentatonic": [0, 3, 5, 7, 10],
};

export function MelodiesTool() {
  const [scale, setScale] = useState("C major");
  const [energy, setEnergy] = useState(55);
  const [seed, setSeed] = useState(0);
  const notes = makeMelody(scales[scale], energy, seed);

  const regenerate = () => setSeed((value) => value + 1);
  return (
    <div className="studio-grid">
      <div className="controls-panel">
        <div className="control-block"><label>Scale</label><select value={scale} onChange={(event) => setScale(event.target.value)}>{Object.keys(scales).map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="control-block"><label>Energy <span>{energy}%</span></label><input type="range" min="10" max="100" value={energy} onChange={(event) => setEnergy(Number(event.target.value))} /></div>
        <div className="control-block"><label>Length <span>8 bars</span></label><div className="segmented"><button className="selected">8</button><button>16</button><button>32</button></div></div>
        <button className="secondary-button" onClick={regenerate}><RefreshCw size={16} /> generate another</button>
      </div>
      <div className="visual-panel">
        <div className="panel-caption"><span>your sketch</span><span className="live-tag">● live</span></div>
        <div className="piano-roll">{notes.map((note, index) => <div key={`${note.pitch}-${index}`} className="note-block" style={{ left: `${note.start / 32 * 100}%`, width: `${note.duration / 32 * 100}%`, bottom: `${(note.pitch - 60) * 7 + 7}%` }} />)}<div className="roll-lines">{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</div></div>
        <div className="panel-footer"><span>8 bars / 110 bpm</span><DownloadButton onClick={() => downloadMidi("virtual-composer-melody.mid", notes)} /></div>
      </div>
      <div className="prompt-strip"><Dices size={17} /> Try changing the energy. Low = long, considered phrases. High = tiny sparks.</div>
    </div>
  );
}

function makeMelody(scale: number[], energy: number, seed: number): MidiNote[] {
  return Array.from({ length: 16 }, (_, index) => {
    const step = (index * 2 + seed * 3 + Math.floor(Math.sin(index + seed) * (energy / 20))) % scale.length;
    return { pitch: 60 + scale[Math.abs(step)] + (index % 7 > 4 ? 12 : 0), start: index * 2, duration: energy > 65 && index % 3 === 0 ? 1 : 2, velocity: 72 + (energy % 28) };
  });
}
