/* Tạo icon PNG cho HM Lane bằng Node thuần (zlib). Chạy: node tools/generate-icons.js */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'icons');
fs.mkdirSync(OUT, { recursive: true });

function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
const RUST_TOP = hex('#E9642F'), RUST_BOT = hex('#A83A13'), CHALK = hex('#F2ECE0'), MINT = hex('#6FE0C0');
const lerp = (a, b, t) => a + (b - a) * t;

function distToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx, cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function draw(N, pad) {
  // pad = tỉ lệ lề an toàn (maskable). Nội dung nằm trong [inset, N-inset].
  const inset = Math.round(N * pad);
  const S = N - inset * 2;                  // kích thước "thẻ" bo góc
  const r = S * 0.235;                       // bán kính bo góc
  const buf = Buffer.alloc(N * N * 4, 0);    // RGBA, mặc định trong suốt

  function set(x, y, rgb, a) {
    const i = (y * N + x) * 4;
    const na = a, ia = 1 - a;
    buf[i]   = Math.round(rgb[0] * na + buf[i] * ia);
    buf[i+1] = Math.round(rgb[1] * na + buf[i+1] * ia);
    buf[i+2] = Math.round(rgb[2] * na + buf[i+2] * ia);
    buf[i+3] = Math.round(255 * na + buf[i+3] * ia);
  }

  const x0 = inset, y0 = inset, x1 = inset + S, y1 = inset + S;
  // lane lines dọc (3 lane)
  const laneXs = [0.34, 0.5, 0.66].map(f => x0 + f * S);
  const laneW = Math.max(1.5, S * 0.016);
  // chevron mint (^) — biểu tượng tiến lên
  const cThick = S * 0.085;
  const ax = x0 + 0.30 * S, ay = y0 + 0.64 * S;
  const bx = x0 + 0.50 * S, by = y0 + 0.40 * S;
  const cx = x0 + 0.70 * S, cy = y0 + 0.64 * S;

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      // trong thẻ bo góc?
      let inside = false;
      if (x >= x0 && x < x1 && y >= y0 && y < y1) {
        const lx = x - x0, ly = y - y0;
        const rx = Math.min(lx, S - 1 - lx), ry = Math.min(ly, S - 1 - ly);
        if (rx >= r || ry >= r) inside = true;
        else { const dx = r - rx, dy = r - ry; inside = (dx * dx + dy * dy) <= r * r; }
      }
      if (!inside) continue;

      // nền gradient rust theo chiều dọc
      const t = (y - y0) / S;
      set(x, y, [lerp(RUST_TOP[0], RUST_BOT[0], t), lerp(RUST_TOP[1], RUST_BOT[1], t), lerp(RUST_TOP[2], RUST_BOT[2], t)], 1);

      // lane lines chalk mờ
      for (const lxp of laneXs) {
        const d = Math.abs(x - lxp);
        if (d < laneW) set(x, y, CHALK, 0.28 * (1 - d / laneW));
      }

      // chevron mint
      const d1 = distToSeg(x, y, ax, ay, bx, by);
      const d2 = distToSeg(x, y, bx, by, cx, cy);
      const d = Math.min(d1, d2);
      if (d < cThick) {
        const edge = Math.min(1, (cThick - d) / 2);
        set(x, y, MINT, edge);
      }
    }
  }
  return buf;
}

// ---- PNG encode ----
function crc32(buf) {
  let c, table = crc32.t || (crc32.t = (() => {
    const t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t;
  })());
  c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(N, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit, RGBA
  const raw = Buffer.alloc((N * 4 + 1) * N);
  for (let y = 0; y < N; y++) {
    raw[y * (N * 4 + 1)] = 0; // filter none
    rgba.copy(raw, y * (N * 4 + 1) + 1, y * N * 4, (y + 1) * N * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const targets = [
  { name: 'icon-192.png', N: 192, pad: 0 },
  { name: 'icon-512.png', N: 512, pad: 0 },
  { name: 'icon-180.png', N: 180, pad: 0 },
  { name: 'icon-maskable-512.png', N: 512, pad: 0.12 },
];
targets.forEach(t => {
  fs.writeFileSync(path.join(OUT, t.name), encodePNG(t.N, draw(t.N, t.pad)));
  console.log('wrote', t.name);
});
