import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { serve } from "./serve.mjs";
const root = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const preview = process.argv.includes("--preview"),
  fps = 30,
  duration = 40;
const scratch = process.env.RENDER_WORK || path.join(root, "work");
await fs.mkdir(scratch, { recursive: true });
await fs.mkdir(path.join(root, "film"), { recursive: true });
const server = await serve(root),
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {}),
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(`http://127.0.0.1:${server.address().port}`, {
  waitUntil: "networkidle",
});
await page.evaluate(() => document.fonts.ready);
async function frame(t, kind = "png") {
  return Buffer.from(
    await page.evaluate(
      ({ t, kind }) => {
        window.renderAt(t);
        return document
          .querySelector("canvas")
          .toDataURL(kind === "jpg" ? "image/jpeg" : "image/png", 0.98)
          .split(",")[1];
      },
      { t, kind },
    ),
    "base64",
  );
}
try {
  for (const t of [2.8, 7.8, 12.7, 16.5, 22.8, 26.5, 30.5, 36.6])
    await fs.writeFile(
      path.join(scratch, `shot-${String(t).replace(".", "-")}.png`),
      await frame(t),
    );
  await fs.writeFile(path.join(root, "film", "poster.png"), await frame(27.5));
  if (!preview) {
    const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg",
      wav = process.env.AUDIO_OUT || path.join(scratch, "soundtrack.wav");
    const out = path.join(root, "film", "leave-a-light-on.mp4");
    const args = [
      "-hide_banner",
      "-loglevel",
      "warning",
      "-y",
      "-f",
      "image2pipe",
      "-framerate",
      String(fps),
      "-vcodec",
      "mjpeg",
      "-i",
      "pipe:0",
      "-i",
      wav,
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "19",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-ar",
      "48000",
      "-t",
      String(duration),
      "-movflags",
      "+faststart",
      "-metadata",
      "title=把夜晚留一盏灯 | Leave a light on",
      "-metadata",
      "comment=Original procedural illustration, animation and synthesized music.",
      out,
    ];
    const encoder = spawn(ffmpeg, args, { stdio: ["pipe", "ignore", "pipe"] });
    let stderr = "";
    encoder.stderr.on("data", (x) => {
      stderr += x.toString();
    });
    encoder.stdin.on("error", () => {});
    const done = once(encoder, "close");
    for (let i = 0; i < fps * duration; i++) {
      if (encoder.exitCode !== null)
        throw new Error(`Encoder stopped: ${stderr}`);
      const data = await frame(i / fps, "jpg");
      if (!encoder.stdin.write(data)) await once(encoder.stdin, "drain");
      if (i % 120 === 0) console.log(`Rendered ${i}/${fps * duration} frames`);
    }
    encoder.stdin.end();
    const [code] = await done;
    if (code !== 0) throw new Error(stderr);
    const music = spawn(
      ffmpeg,
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        wav,
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        path.join(root, "film", "soundtrack.m4a"),
      ],
      { stdio: "inherit" },
    );
    if ((await once(music, "close"))[0] !== 0)
      throw new Error("Soundtrack encoding failed");
    await fs.writeFile(path.join(scratch, "render-log.txt"), stderr);
  }
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(preview ? "Keyframes prepared." : "Film rendered.");
} finally {
  await browser.close();
  server.close();
}
