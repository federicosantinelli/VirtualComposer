import { useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { DownloadButton } from "../../App";
import { downloadMidi } from "../../shared/midi";
import type { MidiNote } from "../../shared/types";

const ideas = [["play it backwards", "minor 7ths", "110 bpm"], ["one note only", "swing it", "72 bpm"], ["too many drums", "bright voicing", "140 bpm"], ["leave a gap", "odd accents", "98 bpm"]];
export function IdeasTool() {
  const [seed, setSeed] = useState(0);
  const current = ideas[seed % ideas.length];
  const notes: MidiNote[] = [60, 64, 67, 71, 74, 71, 67, 64].map((pitch, index) => ({ pitch, start: index * 2, duration: 1.5, velocity: 80 }));
  return <div className="idea-layout"><div className="idea-card"><div className="idea-label">three little rules</div><div className="idea-words">{current.map((idea, index) => <div className="idea-word" key={idea}><span>0{index + 1}</span><strong>{idea}</strong>{index < 2 && <ArrowRight size={22} />}</div>)}</div><button className="roll-button" onClick={() => setSeed(seed + 1)}><RefreshCw size={17} /> roll a new set</button></div><div className="idea-side"><p>Sometimes the fastest way through the blank page is to make the page smaller.</p><DownloadButton onClick={() => downloadMidi("virtual-composer-idea.mid", notes)} label="Make this MIDI" /><span className="tiny-note">The rules are yours to bend.</span></div></div>;
}
