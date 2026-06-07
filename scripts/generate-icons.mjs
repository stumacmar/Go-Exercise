// Generates PWA PNG icons with no external dependencies (uses Node zlib).
// Draws a calm dark tile with an accent "reset" ring + dot.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

const BG = [22, 33, 30]; // #16211e
const ACCENT = [95, 214, 166]; // #5fd6a6
const ACCENT2 = [127, 184, 255]; // #7fb8ff

function lerp(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function makeIcon(size) {
  const data = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const ringR = size * 0.3;
  const ringW = size * 0.085;
  const dotR = size * 0.07;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx); // -PI..PI

      let col = BG;
      let a = 255;

      // Open ring with a ~40° gap at the top (the "reset" notch).
      const inRing = Math.abs(dist - ringR) < ringW / 2;
      const gap = angle > -Math.PI / 2 - 0.35 && angle < -Math.PI / 2 + 0.35;
      if (inRing && !gap) {
        const t = (angle + Math.PI) / (2 * Math.PI);
        col = lerp(ACCENT, ACCENT2, t);
      }

      // Center dot.
      if (dist < dotR) col = ACCENT;

      data[i] = col[0];
      data[i + 1] = col[1];
      data[i + 2] = col[2];
      data[i + 3] = a;
    }
  }
  return encodePNG(size, size, data);
}

// ---- minimal PNG encoder --------------------------------------------------
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // Filtered scanlines (filter byte 0 per row).
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ 0xffffffff;
}

// ---- write files ----------------------------------------------------------
for (const size of [192, 512]) {
  writeFileSync(join(OUT, `icon-${size}.png`), makeIcon(size));
  console.log(`wrote icon-${size}.png`);
}

// SVG favicon (crisp at any size).
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#16211e"/>
  <path d="M32 14a18 18 0 1 1-12.7 5.3" fill="none" stroke="#5fd6a6" stroke-width="5.4" stroke-linecap="round"/>
  <circle cx="32" cy="32" r="4.5" fill="#5fd6a6"/>
</svg>`;
writeFileSync(join(OUT, 'icon.svg'), svg);
console.log('wrote icon.svg');
