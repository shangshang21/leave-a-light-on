import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const rate = 48000,
  duration = 40,
  n = rate * duration;
const left = new Float64Array(n),
  right = new Float64Array(n);
let seed = 20261004;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
function note(start, midi, length, amp, pan, kind = "bell") {
  const f = hz(midi),
    pL = Math.sqrt((1 - pan) / 2),
    pR = Math.sqrt((1 + pan) / 2);
  for (let j = 0; j < length * rate && Math.floor(start * rate) + j < n; j++) {
    const t = j / rate,
      i = Math.floor(start * rate) + j,
      attack = 1 - Math.exp(-t * 80);
    const tail = Math.min(1, (length - t) * 3),
      env = attack * Math.exp(-t * (kind === "pad" ? 0.55 : 1.35)) * tail;
    const a = Math.sin(2 * Math.PI * f * t);
    const wave =
      kind === "pad"
        ? a +
          0.2 * Math.sin(2 * Math.PI * f * 2 * t) +
          0.08 * Math.sin(2 * Math.PI * f * 3 * t)
        : a +
          0.28 * Math.sin(2 * Math.PI * f * 2.003 * t) * Math.exp(-t * 1.5) +
          0.13 * Math.sin(2 * Math.PI * f * 3.99 * t) * Math.exp(-t * 2);
    left[i] += wave * env * amp * pL;
    right[i] += wave * env * amp * pR;
  }
}
// An original, unhurried phrase over Dmaj7 / Bm7 / Gmaj7 / Aadd9.
const chords = [
  [50, 57, 61, 66],
  [47, 54, 57, 62],
  [43, 50, 54, 59],
  [45, 52, 57, 59],
];
for (let block = 0; block < 10; block++) {
  const start = block * 4,
    chord = chords[block % 4];
  chord.forEach((m, i) =>
    note(start + i * 0.12, m, 6, 0.028, -0.35 + i * 0.23, "pad"),
  );
  chord.forEach((m, i) =>
    note(start + 0.35 + i * 0.62, m + 12, 3.5, 0.043, Math.sin(i * 1.7) * 0.5),
  );
}
const melody = [
  [2.6, 74],
  [3.4, 73],
  [5.1, 69],
  [6.7, 66],
  [8.6, 69],
  [10.2, 71],
  [12.7, 74],
  [14.0, 78],
  [16.6, 76],
  [18.1, 73],
  [20.5, 71],
  [22.1, 69],
  [24.7, 66],
  [26.0, 69],
  [28.6, 74],
  [30.2, 73],
  [32.7, 71],
  [34.1, 69],
  [36.8, 66],
];
melody.forEach(([t, m], i) => note(t, m, 3.8, 0.072, Math.sin(i * 0.9) * 0.3));
note(12.3, 86, 2.5, 0.024, 0.45);
note(23.4, 81, 3.0, 0.032, -0.3);
// Soft filtered rain, becoming distant once the camera enters the room.
let filtered = 0,
  other = 0;
for (let i = 0; i < n; i++) {
  const t = i / rate;
  filtered = 0.82 * filtered + 0.18 * (random() * 2 - 1);
  other = 0.84 * other + 0.16 * (random() * 2 - 1);
  const inside = Math.max(0, Math.min(1, (t - 22) / 3));
  const rain = 0.033 * (1 - inside) + 0.013 * inside;
  left[i] += filtered * rain;
  right[i] += other * rain;
}
// Short room reflection, then a clean fade at both ends.
const delay = Math.round(rate * 0.19);
for (let i = n - 1; i >= delay; i--) {
  left[i] += right[i - delay] * 0.14;
  right[i] += left[i - delay] * 0.13;
}
let peak = 0,
  sum = 0;
for (let i = 0; i < n; i++) {
  const t = i / rate,
    fade = Math.min(1, t / 1.4, (duration - t) / 2.6);
  left[i] *= Math.max(0, fade);
  right[i] *= Math.max(0, fade);
  peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  sum += left[i] ** 2 + right[i] ** 2;
}
const gain = 0.72 / peak,
  pcm = Buffer.alloc(n * 4),
  header = Buffer.alloc(44);
for (let i = 0; i < n; i++) {
  pcm.writeInt16LE(
    Math.round(Math.max(-1, Math.min(1, left[i] * gain)) * 32767),
    i * 4,
  );
  pcm.writeInt16LE(
    Math.round(Math.max(-1, Math.min(1, right[i] * gain)) * 32767),
    i * 4 + 2,
  );
}
header.write("RIFF");
header.writeUInt32LE(36 + pcm.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(rate, 24);
header.writeUInt32LE(rate * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(pcm.length, 40);
const out = process.env.AUDIO_OUT || path.join(root, "work", "soundtrack.wav");
await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, Buffer.concat([header, pcm]));
console.log(
  JSON.stringify(
    {
      output: path.basename(out),
      duration,
      sampleRate: rate,
      channels: 2,
      peakAfterGain: 0.72,
      rms: Math.sqrt(sum / (2 * n)) * gain,
      originalComposition: true,
    },
    null,
    2,
  ),
);
