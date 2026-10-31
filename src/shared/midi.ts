import type { MidiNote } from "./types";

// Tiny Standard MIDI File writer. Keeping this local makes every tool downloadable
// without a server or a heavy music library.
export function downloadMidi(filename: string, notes: MidiNote[], bpm = 110) {
  const ppq = 480;
  const events: number[] = [];
  const tempo = Math.round(60000000 / bpm);
  events.push(
    0,
    0xff,
    0x51,
    0x03,
    (tempo >> 16) & 255,
    (tempo >> 8) & 255,
    tempo & 255,
  );
  const sorted = notes
    .flatMap((note) => [
      {
        tick: Math.max(0, Math.round(note.start * ppq)),
        bytes: [0x90, note.pitch, note.velocity ?? 100],
      },
      {
        tick: Math.max(0, Math.round((note.start + note.duration) * ppq)),
        bytes: [0x80, note.pitch, 0],
      },
    ])
    .sort((a, b) => a.tick - b.tick);
  let previousTick = 0;
  sorted.forEach((event) => {
    events.push(...variableLength(event.tick - previousTick), ...event.bytes);
    previousTick = event.tick;
  });
  events.push(0, 0xff, 0x2f, 0);
  const track = [...ascii("MTrk"), ...u32(events.length), ...events];
  const file = [
    ...ascii("MThd"),
    ...u32(6),
    0,
    0,
    0,
    1,
    (ppq >> 8) & 255,
    ppq & 255,
    ...track,
  ];
  const blob = new Blob([new Uint8Array(file)], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function variableLength(value: number) {
  let buffer = value & 0x7f;
  const bytes = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  while (true) {
    bytes.push(buffer & 255);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

function u32(value: number) {
  return [
    (value >> 24) & 255,
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
  ];
}

function ascii(value: string) {
  return [...value].map((character) => character.charCodeAt(0));
}
