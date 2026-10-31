export type ToolId = "melodies" | "chords" | "beats" | "ideas";

export type MidiNote = {
  pitch: number;
  start: number;
  duration: number;
  velocity?: number;
};
