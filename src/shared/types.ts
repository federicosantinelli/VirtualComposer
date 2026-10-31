export type ToolId = "melodies" | "chords" | "tonal-map" | "beats" | "ideas";

export type MidiNote = {
  pitch: number;
  start: number;
  duration: number;
  velocity?: number;
};
