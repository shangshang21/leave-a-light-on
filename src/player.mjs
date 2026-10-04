import { drawFilm, DURATION } from "./film.mjs";
const canvas = document.querySelector("#film"),
  audio = document.querySelector("#audio");
const start = document.querySelector("#start"),
  play = document.querySelector("#play"),
  seek = document.querySelector("#seek"),
  sound = document.querySelector("#sound");
let playing = false,
  time = 0,
  anchor = 0,
  base = 0;
const stamp = (t) =>
  `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
function paint(t) {
  time = Math.max(0, Math.min(DURATION, t));
  drawFilm(canvas, time);
  seek.value = time;
  document.querySelector("#time").textContent = `${stamp(time)} / 0:40`;
}
async function toggle() {
  if (playing) {
    playing = false;
    audio.pause();
    play.textContent = "播放";
    play.setAttribute("aria-label", "播放");
    return;
  }
  if (time >= DURATION - 0.01) paint(0);
  base = time;
  anchor = performance.now();
  audio.currentTime = time;
  playing = true;
  start.hidden = true;
  start.style.display = "none";
  play.textContent = "暂停";
  play.setAttribute("aria-label", "暂停");
  try {
    await audio.play();
  } catch {
    sound.textContent = "声音 未加载";
  }
}
play.onclick = toggle;
start.onclick = toggle;
canvas.onclick = () => {
  if (start.hidden) toggle();
};
seek.oninput = () => {
  paint(Number(seek.value));
  base = time;
  anchor = performance.now();
  audio.currentTime = time;
  start.hidden = true;
  start.style.display = "none";
};
sound.onclick = async () => {
  audio.muted = !audio.muted;
  sound.textContent = audio.muted ? "声音 关" : "声音 开";
  sound.setAttribute("aria-label", audio.muted ? "开启声音" : "关闭声音");
  if (playing && !audio.muted) await audio.play().catch(() => {});
};
document.querySelector("#full").onclick = () =>
  document.fullscreenElement
    ? document.exitFullscreen()
    : document.querySelector(".cinema").requestFullscreen?.();
function loop(now) {
  if (playing) {
    let t = audio.ended
      ? DURATION
      : !audio.paused && audio.readyState >= 2
        ? audio.currentTime
        : base + (now - anchor) / 1000;
    paint(t);
    if (t >= DURATION) {
      playing = false;
      audio.pause();
      play.textContent = "重播";
      play.setAttribute("aria-label", "重播");
    }
  }
  requestAnimationFrame(loop);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden && playing) {
    playing = false;
    audio.pause();
    play.textContent = "播放";
  }
});
window.renderAt = (t) => paint(t);
window.filmDuration = DURATION;
paint(0);
drawFilm(canvas, 2.5);
requestAnimationFrame(loop);
