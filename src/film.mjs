export const DURATION = 40;
export const WIDTH = 1920,
  HEIGHT = 1080;
const W = 1280,
  H = 720;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};
const mix = (a, b, t) => a + (b - a) * t;
function rand(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const r = rand(42026);
const rain = Array.from({ length: 230 }, () => ({
  x: r() * 1600,
  y: r() * 950,
  len: 8 + r() * 22,
  speed: 240 + r() * 200,
  a: 0.1 + r() * 0.18,
}));
const buildings = Array.from({ length: 31 }, (_, i) => ({
  x: i * 48 - 65,
  w: 34 + r() * 49,
  h: 60 + r() * 175,
  seed: i + 16,
}));
const specks = Array.from({ length: 1800 }, () => ({
  x: r() * W,
  y: r() * H,
  a: r() * 0.07,
}));
let ctx;
function grad(x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [p, c] of stops) g.addColorStop(p, c);
  return g;
}
function rect(x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}
function ellipse(x, y, rx, ry, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
function path(points, c, close = true) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (close) ctx.closePath();
  ctx.fillStyle = c;
  ctx.fill();
}
function line(x1, y1, x2, y2, c, width = 1) {
  ctx.strokeStyle = c;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function glow(x, y, size, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(x, y, 0, x, y, size);
  g.addColorStop(0, color);
  g.addColorStop(0.35, color);
  g.addColorStop(1, "transparent");
  ellipse(x, y, size, size, g);
  ctx.restore();
}
function rounded(x, y, w, h, radius, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}
function text(
  text,
  x,
  y,
  size,
  color,
  align = "left",
  family = '"KaiTi", "STKaiti", "Microsoft YaHei", serif',
  spacing = 0,
) {
  ctx.save();
  ctx.font = `${size}px ${family}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  if (!spacing) ctx.fillText(text, x, y);
  else {
    let len = ctx.measureText(text).width + (text.length - 1) * spacing;
    let px = align === "center" ? x - len / 2 : x;
    ctx.textAlign = "left";
    for (const c of text) {
      ctx.fillText(c, px, y);
      px += ctx.measureText(c).width + spacing;
    }
  }
  ctx.restore();
}
function drizzle(t, alpha = 1, area) {
  ctx.save();
  if (area) {
    ctx.beginPath();
    ctx.rect(...area);
    ctx.clip();
  }
  ctx.lineCap = "round";
  for (const p of rain) {
    const yy = ((p.y + t * p.speed) % 950) - 110;
    const xx = p.x - 120 - ((t * 46) % 170);
    line(xx, yy, xx - 5, yy + p.len, `rgba(164,202,209,${p.a * alpha})`, 0.8);
  }
  ctx.restore();
}
function stars(t) {
  for (let i = 0; i < 18; i++) {
    const x = (i * 137 + 67) % 1280,
      y = 90 + ((i * 59) % 140);
    ellipse(
      x,
      y,
      0.8,
      0.8,
      `rgba(222,231,224,${0.12 + 0.08 * Math.sin(t * 0.6 + i)})`,
    );
  }
}
function cityBackdrop(t, base = 510, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (const b of buildings) {
    rect(b.x, base - b.h, b.w, b.h, "#152d3b");
    rect(b.x + 7, base - b.h - 8, b.w - 14, 8, "#173544");
    const q = rand(b.seed);
    for (let x = b.x + 7; x < b.x + b.w - 5; x += 10)
      for (let y = base - b.h + 13; y < base - 8; y += 20) {
        if (q() > 0.63) {
          rect(x, y, 3, 6, q() > 0.6 ? "#8d87715c" : "#45657575");
        }
      }
  }
  ctx.restore();
}
function plant(x, y, scale = 1, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const sway = Math.sin(t * 0.7) * 2;
  for (let i = 0; i < 7; i++) {
    const a = -2.5 + i * 0.33,
      ex = Math.cos(a) * 44 + sway,
      ey = Math.sin(a) * 65;
    line(0, 0, ex, ey, "#587463", 2);
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(a);
    ellipse(0, 0, 18, 7, i % 2 ? "#3e675a" : "#648570");
    ctx.restore();
  }
  path(
    [
      [-20, 0],
      [20, 0],
      [14, 29],
      [-14, 29],
    ],
    "#af8067",
  );
  line(-19, 2, 19, 2, "#dab294", 3);
  ctx.restore();
}
function cat(x, y, s, t, curled = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (curled) {
    ellipse(3, 0, 37, 21, "#273136");
    ellipse(26, -9, 17, 14, "#283438");
    path(
      [
        [14, -16],
        [13, -33],
        [24, -24],
        [35, -30],
        [36, -14],
      ],
      "#283438",
    );
    ctx.strokeStyle = "#435052";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-24, 9);
    ctx.bezierCurveTo(-44, -20, -5, -29, 7, -2);
    ctx.stroke();
    line(23, -11, 28, -11, "#beaa86", 1.5);
    ellipse(33, -4, 2, 1, "#ac8778");
  } else {
    ellipse(0, -5, 25, 40, "#243037");
    ellipse(0, -43, 24, 22, "#29373d");
    path(
      [
        [-21, -53],
        [-21, -77],
        [-7, -62],
        [10, -62],
        [24, -77],
        [22, -52],
      ],
      "#29373d",
    );
    path(
      [
        [-18, -61],
        [-17, -71],
        [-10, -62],
      ],
      "#846962",
    );
    path(
      [
        [13, -62],
        [20, -70],
        [20, -59],
      ],
      "#846962",
    );
    const blink = Math.cos(t * 1.6) > 0.988;
    for (const ex of [-9, 9]) {
      if (blink) line(ex - 4, -43, ex + 4, -43, "#e0c698", 1.3);
      else {
        ellipse(ex, -43, 4, 2.8, "#ccb778");
        ellipse(ex, -43, 0.7, 2.3, "#273238");
      }
    }
    ellipse(0, -34, 2.2, 1.3, "#b9897d");
    ctx.strokeStyle = "#29353a";
    ctx.lineWidth = 11;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(13, 25);
    ctx.bezierCurveTo(
      48,
      38,
      64,
      4 + Math.sin(t) * 5,
      50,
      -7 + Math.sin(t) * 8,
    );
    ctx.stroke();
    for (let k = -1; k <= 1; k++) {
      line(-7, -32, -32, -35 + k * 5, "#829a9560", 0.7);
      line(7, -32, 32, -35 + k * 5, "#829a9560", 0.7);
    }
  }
  ctx.restore();
}
function lamp(x, y, s, t, on = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  glow(0, -105, 160, "#edb96b2b", on);
  ellipse(0, 0, 35, 8, "#343a34");
  rounded(-4, -113, 8, 111, 2, "#898061");
  path(
    [
      [-30, -157],
      [29, -157],
      [57, -97],
      [-57, -97],
    ],
    grad(0, -157, 0, -95, [
      [0, "#d8b785"],
      [1, "#f5d9a0"],
    ]),
  );
  line(-57, -97, 57, -97, "#f8dfac", 3);
  glow(0, -93, 36, "#ffe1a35e", on);
  line(35, -91, 35, -65, "#6a6854", 1);
  ellipse(35, -63, 2, 3, "#c6a87a");
  ctx.restore();
}
function mug(x, y, s, t, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ellipse(0, 26, 56, 10, "#161d2055");
  ellipse(0, 24, 47, 7, "#b09677");
  ellipse(0, 22, 42, 5, "#d0b193");
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(31, 0, 17, 16, -0.3, 0, Math.PI * 2);
  ctx.stroke();
  path(
    [
      [-30, -19],
      [31, -19],
      [27, 19],
      [-24, 19],
    ],
    color,
  );
  ellipse(0, 19, 26, 6, color);
  ellipse(0, -19, 31, 9, "#f1e0c5");
  ellipse(0, -19, 26, 6, "#583b25");
  ellipse(-4, -21, 17, 2, "#ba844c");
  line(-23, -8, -21, 13, "#fff6dd55", 3);
  for (let j = 0; j < 3; j++) {
    ctx.strokeStyle = `rgba(243,234,212,${0.17 - j * 0.025})`;
    ctx.lineWidth = 2.1 - j * 0.4;
    ctx.beginPath();
    const yy = -29 - j * 5;
    ctx.moveTo(-13 + j * 13, yy);
    ctx.bezierCurveTo(
      -25 + j * 14 + Math.sin(t * 1.8 + j) * 10,
      yy - 25,
      -3 + j * 10 + Math.sin(t * 1.4 + j) * 12,
      yy - 43,
      -14 + j * 14,
      yy - 65,
    );
    ctx.stroke();
  }
  ctx.restore();
}
function windowView(t, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  rect(
    x,
    y,
    w,
    h,
    grad(0, y, 0, y + h, [
      [0, "#0c2335"],
      [1, "#385669"],
    ]),
  );
  glow(x + w * 0.76, y + 50, 65, "#70919830");
  ellipse(x + w * 0.76, y + 50, 17, 17, "#a1bab960");
  ctx.save();
  ctx.translate(x - 80, y - 85);
  ctx.scale(0.75, 0.75);
  cityBackdrop(t, 600, 0.7);
  ctx.restore();
  drizzle(t, 0.8, [x, y, w, h]);
  for (let i = 0; i < 9; i++) {
    const dx = x + 15 + (i * w) / 10,
      dy = y + 20 + ((t * 18 + i * 47) % (h - 30));
    line(dx, dy, dx - 1, dy + 18, "#c7d4d12a", 1.5);
  }
  ctx.restore();
}
function street(t) {
  const p = ease(t / 12);
  ctx.save();
  ctx.translate(-25 * p, 3 * p);
  ctx.scale(1 + p * 0.06, 1 + p * 0.06);
  rect(
    -100,
    0,
    1500,
    720,
    grad(0, 0, 0, 720, [
      [0, "#081b2c"],
      [0.6, "#1b3547"],
      [1, "#091d2a"],
    ]),
  );
  stars(t);
  glow(975, 175, 160, "#91b1b522");
  ellipse(975, 175, 34, 34, "#aac3bc46");
  path(
    [
      [825, 158],
      [903, 148],
      [957, 166],
      [1076, 151],
      [1160, 175],
      [1070, 193],
      [890, 185],
    ],
    "#0b24305c",
  );
  cityBackdrop(t, 500, 0.9);
  rect(
    0,
    500,
    1280,
    220,
    grad(0, 500, 0, 720, [
      [0, "#172e38"],
      [1, "#0b1a23"],
    ]),
  );
  const rr = rand(4);
  for (let i = 0; i < 90; i++) {
    const x = rr() * 1280,
      y = 510 + rr() * 195;
    line(x, y, x + 10 + rr() * 35, y, "#91a5a710", 1);
  }
  // The quiet house, with an unusually warm upstairs window.
  path(
    [
      [748, 351],
      [884, 268],
      [1063, 299],
      [1140, 357],
    ],
    "#0b1b28",
  );
  rect(
    762,
    349,
    359,
    240,
    grad(762, 349, 1121, 600, [
      [0, "#294353"],
      [1, "#203643"],
    ]),
  );
  line(755, 353, 1138, 358, "#445463", 5);
  for (let y = 373; y < 577; y += 17) line(762, y, 1120, y, "#95b0b408", 1);
  rect(785, 402, 64, 113, "#152c3a");
  rect(794, 411, 46, 94, "#294450");
  line(819, 412, 819, 505, "#101f2b", 4);
  line(794, 458, 840, 458, "#101f2b", 4);
  const on = 0.2 + 0.8 * ease((t - 5.5) / 2.5);
  glow(996, 432, 155, "#ffc27536", on);
  rect(929, 374, 151, 127, "#112331");
  rect(
    936,
    380,
    137,
    113,
    grad(0, 380, 0, 493, [
      [0, `rgba(239,183,99,${on})`],
      [1, `rgba(248,214,153,${on})`],
    ]),
  );
  path(
    [
      [938, 381],
      [963, 383],
      [957, 490],
      [938, 489],
    ],
    "#957560",
  );
  path(
    [
      [1048, 381],
      [1071, 381],
      [1071, 492],
      [1057, 490],
    ],
    "#ac8461",
  );
  lamp(1016, 483, 0.42, t, on);
  cat(975, 489, 0.36, t);
  line(1003, 379, 1003, 492, "#29333a", 5);
  line(933, 440, 1075, 440, "#31393c", 5);
  rect(921, 494, 168, 8, "#a18b6c");
  rect(897, 530, 81, 61, "#132430");
  rect(986, 534, 98, 58, "#2b3940");
  line(1009, 534, 1009, 589, "#0e2029", 4);
  ellipse(943, 566, 2, 3, "#a99167");
  // Tiny street lamp and its wavering reflection.
  line(442, 340, 442, 597, "#0d2029", 5);
  path(
    [
      [421, 340],
      [442, 315],
      [464, 340],
    ],
    "#162b36",
  );
  glow(442, 348, 64, "#f6c58320");
  ellipse(442, 348, 13, 4, "#d7b583");
  for (let i = 0; i < 32; i++) {
    let yy = 598 + i * 3.2,
      xx = 936 + Math.sin(i * 0.78 + t * 0.8) * 9;
    line(
      xx,
      yy,
      xx + 78 - i * 1.2,
      yy,
      `rgba(218,166,92,${0.16 * (1 - i / 35) * on})`,
      1.5,
    );
    let lx = 426 + Math.sin(i * 0.65 + t) * 6;
    line(lx, yy, lx + 30 - i * 0.4, yy, "#d3bc8320", 1);
  }
  // Foreground silhouettes and a cable, gentle parallax.
  ctx.strokeStyle = "#0b1d2b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, 233);
  ctx.quadraticCurveTo(640, 385, 1300, 195);
  ctx.stroke();
  rect(-10, 470, 173, 195, "#0b1b27");
  path(
    [
      [-10, 470],
      [69, 404],
      [174, 473],
    ],
    "#0b1b27",
  );
  plant(128, 471, 1.4, t);
  drizzle(t, 0.95);
  for (let k = 0; k < 8; k++) {
    const yy = 535 + k * 19;
    ellipse(150 + k * 121, yy, 12 + Math.sin(t * 2 + k) * 3, 2, "#c1d2ca14");
  }
  ctx.restore();
}
function windowClose(t) {
  const p = ease((t - 11) / 12);
  ctx.save();
  ctx.translate(-p * 15, -p * 10);
  ctx.scale(1 + p * 0.035, 1 + p * 0.035);
  rect(
    0,
    0,
    W,
    H,
    grad(0, 0, W, H, [
      [0, "#162a3a"],
      [1, "#2c4147"],
    ]),
  );
  for (let y = 64; y < 640; y += 29) {
    line(0, y, W, y, "#8fa2970c", 1);
    for (let x = ((y / 29) % 2) * 55; x < 1280; x += 110)
      line(x, y, x, y + 28, "#a6b7a407", 1);
  }
  glow(654, 369, 540, "#e7b7781c");
  rect(323, 113, 647, 442, "#0d222f");
  rect(
    340,
    128,
    612,
    410,
    grad(0, 128, 0, 538, [
      [0, "#bc915f"],
      [0.6, "#ddae74"],
      [1, "#9d7752"],
    ]),
  );
  rect(
    352,
    139,
    588,
    384,
    grad(0, 140, 0, 525, [
      [0, "#634f41"],
      [1, "#ad8459"],
    ]),
  );
  glow(748, 314, 239, "#ffdda249");
  rect(398, 328, 374, 15, "#886b47");
  rect(411, 283, 27, 45, "#394c48");
  rect(445, 272, 19, 56, "#947058");
  rect(469, 281, 31, 47, "#c1ad83");
  rect(506, 287, 17, 41, "#3f6262");
  line(416, 285, 431, 285, "#a3b4a085", 1);
  // Soft curtain folds, unlike the hard architecture outside.
  path(
    [
      [350, 137],
      [477, 137],
      [459, 190],
      [452, 280],
      [428, 440],
      [441, 523],
      [354, 523],
    ],
    grad(350, 0, 477, 0, [
      [0, "#c49b72"],
      [0.5, "#ead0a1"],
      [1, "#af865f"],
    ]),
  );
  path(
    [
      [820, 137],
      [938, 137],
      [938, 523],
      [840, 523],
      [857, 439],
      [836, 300],
      [828, 208],
    ],
    grad(818, 0, 944, 0, [
      [0, "#a87c57"],
      [0.4, "#e0b786"],
      [1, "#c09265"],
    ]),
  );
  for (let i = 0; i < 5; i++) {
    line(364 + i * 18, 148, 364 + i * 13, 510, "#fce4b620", 2);
    line(846 + i * 16, 148, 850 + i * 17, 510, "#754e3830", 1);
  }
  lamp(765, 508, 1.35, t, 1);
  cat(569, 519, 1.55, t);
  plant(861, 517, 0.75, t);
  rect(330, 523, 631, 12, "#343940");
  line(331, 533, 960, 533, "#c2a785", 3);
  line(651, 127, 651, 527, "#334049", 13);
  line(338, 322, 953, 322, "#334049", 10);
  rect(309, 536, 674, 21, "#767166");
  rect(309, 557, 674, 11, "#112834");
  // Moving raindrops on the glass, separate from the rain in the street.
  ctx.save();
  ctx.beginPath();
  ctx.rect(339, 129, 613, 397);
  ctx.clip();
  for (let i = 0; i < 33; i++) {
    const q = rand(i * 239 + 8),
      x = 343 + q() * 601,
      yy = 127 + ((q() * 430 + t * (10 + q() * 17)) % 407);
    line(x, yy, x - 1, yy + 12 + q() * 22, "#dbe7d639", 1);
    ellipse(x - 1, yy + 15, 1.2, 2.1, "#dceee62d");
  }
  ctx.restore();
  drizzle(t, 0.75);
  ctx.restore();
}
function interior(t) {
  const p = ease((t - 23) / 16);
  ctx.save();
  ctx.translate(-p * 12, -p * 8);
  ctx.scale(1 + p * 0.025, 1 + p * 0.025);
  rect(
    -30,
    0,
    1340,
    720,
    grad(0, 0, W, H, [
      [0, "#2e3c39"],
      [0.6, "#655344"],
      [1, "#382f2d"],
    ]),
  );
  glow(958, 390, 410, "#f4ca8b24");
  rect(0, 446, 1280, 126, "#323834");
  line(0, 445, 1280, 445, "#87908240", 2);
  for (let x = 0; x < 1280; x += 90) line(x, 448, x, 570, "#1c2e2e50", 1);
  // Outside is still raining; inside everything moves slowly.
  rect(113, 103, 501, 351, "#1d302f");
  windowView(t, 127, 116, 474, 323);
  rect(119, 112, 12, 333, "#94755a");
  rect(597, 112, 11, 333, "#795e46");
  line(361, 117, 361, 440, "#ae8763", 9);
  line(128, 272, 600, 272, "#967757", 8);
  rect(103, 441, 521, 15, "#ad8460");
  rect(96, 456, 535, 13, "#564739");
  path(
    [
      [113, 98],
      [184, 98],
      [178, 176],
      [155, 294],
      [162, 441],
      [105, 441],
    ],
    grad(100, 0, 190, 0, [
      [0, "#777e69"],
      [0.5, "#a4ad92"],
      [1, "#5e7168"],
    ]),
  );
  path(
    [
      [533, 98],
      [613, 98],
      [622, 441],
      [558, 441],
      [568, 289],
      [544, 174],
    ],
    grad(530, 0, 630, 0, [
      [0, "#6c7a69"],
      [0.55, "#a9ad89"],
      [1, "#687364"],
    ]),
  );
  cat(469, 438, 0.96, t, true);
  plant(226, 447, 0.83, t);
  // The lamp carries the visual center into the tea on the table.
  lamp(981, 493, 1.42, t, 1);
  rounded(695, 117, 112, 129, 3, "#a99170");
  rect(705, 127, 92, 109, "#d7c8a8");
  path(
    [
      [714, 205],
      [743, 158],
      [777, 199],
      [788, 217],
      [714, 217],
    ],
    "#78958a",
  );
  ellipse(768, 154, 11, 11, "#d9ae74");
  line(751, 134, 751, 207, "#c5b899", 1);
  // Table with a hand-drawn edge and walnut grain.
  ellipse(830, 603, 449, 85, "#171c2166");
  path(
    [
      [347, 508],
      [1191, 508],
      [1277, 618],
      [249, 618],
    ],
    grad(0, 508, 0, 618, [
      [0, "#a07b55"],
      [0.55, "#bf9464"],
      [1, "#806047"],
    ]),
  );
  path(
    [
      [249, 618],
      [1277, 618],
      [1277, 638],
      [249, 638],
    ],
    "#624a3c",
  );
  for (let i = 0; i < 16; i++) {
    const y = 516 + i * 6;
    ctx.strokeStyle = "#593f2b22";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(350 - i * 6, y);
    ctx.bezierCurveTo(540, y + 4, 845, y - 4, 1210 + i * 3, y);
    ctx.stroke();
  }
  rect(304, 638, 18, 82, "#3d3631");
  rect(1174, 638, 19, 82, "#40352b");
  // The second cup is deliberately close, waiting rather than abandoned.
  rounded(610, 535, 360, 51, 5, "#6d675650");
  mug(706, 546, 1.23, t, "#81998c");
  mug(894, 544, 1.17, t + 0.7, "#d8b89a");
  ctx.save();
  ctx.translate(520, 565);
  ctx.rotate(-0.075);
  rounded(-75, -23, 134, 66, 3, "#1a292c50");
  rounded(-78, -27, 134, 66, 3, "#e6d4b4");
  line(-66, -17, 43, -17, "#b59a7429", 1);
  text("慢慢回来", -63, 2, 17, "#78664e");
  text("茶还热。", -63, 22, 12, "#a38564");
  ctx.restore();
  plant(1112, 531, 0.61, t);
  ellipse(690, 663, 242, 44, "#e8b96b08");
  ctx.restore();
}
function dissolve(t, start, length) {
  return ease((t - start) / length);
}
function subtitle(t, start, end, words) {
  const a = ease((t - start) / 0.8) * (1 - ease((t - end + 0.8) / 0.8));
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.shadowColor = "#06111f";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  text(words, 640, 646, 24, "#f1e4cd", "center", undefined, 2);
  ctx.restore();
}
function title(t) {
  const intro = ease((t - 0.7) / 1) * (1 - ease((t - 4.9) / 1));
  const ending = ease((t - 33.8) / 1.4) * (1 - ease((t - 39.1) / 0.9));
  if (intro > 0) {
    ctx.save();
    ctx.globalAlpha = intro;
    text("把夜晚", 95, 174, 49, "#efe1c6", undefined, undefined, 5);
    text("留一盏灯", 95, 237, 49, "#efe1c6", undefined, undefined, 5);
    text("LEAVE A LIGHT ON", 99, 301, 12, "#a6bbbd", "left", "system-ui", 3);
    line(99, 326, 150, 326, "#d5b47c", 1);
    ctx.restore();
  }
  if (ending > 0) {
    ctx.save();
    ctx.globalAlpha = ending;
    rect(
      0,
      48,
      W,
      580,
      grad(0, 48, 0, 628, [
        [0, "#0e1b23b5"],
        [0.7, "#0d1d2530"],
        [1, "transparent"],
      ]),
    );
    text("把夜晚留一盏灯", 640, 180, 51, "#f0dfbc", "center", undefined, 5);
    line(594, 230, 685, 230, "#d8b585", 1);
    text("老公，灯给你留着。", 640, 274, 24, "#e9d8bd", "center", undefined, 3);
    text(
      "A LITTLE FILM, FOR YOU",
      640,
      319,
      11,
      "#a5b7b5",
      "center",
      "system-ui",
      3,
    );
    ctx.restore();
  }
}

export function drawFilm(canvas, time) {
  ctx = canvas.getContext("2d");
  const t = clamp(time, 0, DURATION);
  ctx.save();
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  rect(0, 0, W, H, "#061521");
  street(t);
  const a = dissolve(t, 10.8, 2.4),
    b = dissolve(t, 21.7, 2.7);
  if (a > 0) {
    ctx.save();
    ctx.globalAlpha = a;
    windowClose(t);
    ctx.restore();
  }
  if (b > 0) {
    ctx.save();
    ctx.globalAlpha = b;
    interior(t);
    ctx.restore();
  }
  // A soft, stable paper grain. It never flashes between frames.
  for (const p of specks) rect(p.x, p.y, 1.1, 1.1, `rgba(225,212,178,${p.a})`);
  const vignette = ctx.createRadialGradient(640, 350, 150, 640, 350, 760);
  vignette.addColorStop(0, "transparent");
  vignette.addColorStop(1, "#020c175c");
  rect(0, 0, W, H, vignette);
  subtitle(t, 5, 10.5, "城市把夜晚拉得很长。");
  subtitle(t, 14, 20.8, "总有一扇窗，替你亮着。");
  subtitle(t, 25.2, 31.8, "茶还热。慢慢回来就好。");
  title(t);
  rect(0, 0, W, 48, "#07121b");
  rect(0, 672, W, 48, "#07121b");
  const fade = 1 - ease(t / 1.1) + ease((t - 39) / 1);
  if (fade > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(fade);
    rect(0, 0, W, H, "#07121b");
    ctx.restore();
  }
  ctx.restore();
}
