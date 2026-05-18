// Zero-dependency PWA icon generator. Emits two solid-background PNGs with
// a centered monoline "drawer" mark, matching the design tokens. Run:
//   node scripts/gen-icons.ts
// Re-run only if you change the brand mark; the PNGs are committed.

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const BG = [0xf4, 0xf2, 0xec]; // #F4F2EC
const INK = [0x2a, 0x2a, 0x28]; // near-black
const ACCENT = [0xb8, 0x46, 0x3a]; // #B8463A

function crc32(buf: Buffer): number {
  let c = ~0;
  for (let n = 0; n < buf.length; n++) {
    c ^= buf[n];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function png(size: number): Buffer {
  const px = (x: number, y: number): number[] => {
    const m = size * 0.2;
    const inBox =
      x > m && x < size - m && y > m && y < size - m;
    const border = 0.045 * size;
    const onFrame =
      inBox &&
      (x < m + border ||
        x > size - m - border ||
        y < m + border ||
        y > size - m - border);
    const onDivider = inBox && Math.abs(y - size / 2) < border / 2;
    if (onFrame || onDivider) return INK;
    // two drawer "knobs"
    const knob = (cy: number) =>
      (x - size / 2) ** 2 + (y - cy) ** 2 < (0.035 * size) ** 2;
    if (knob(size * 0.36)) return INK;
    if (knob(size * 0.64)) return ACCENT;
    return BG;
  };

  const raw = Buffer.alloc((size * 3 + 1) * size);
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = px(x, y);
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public', { recursive: true });
writeFileSync('public/icon-192.png', png(192));
writeFileSync('public/icon-512.png', png(512));
console.log('Wrote public/icon-192.png and public/icon-512.png');
