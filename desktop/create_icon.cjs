const fs = require('fs');
const zlib = require('zlib');
const width = 512;
const height = 512;
const data = Buffer.alloc(width * height * 4, 255);
// Make a red circle
const cx = width / 2;
const cy = height / 2;
const r = 240;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy <= r * r) {
      data[i] = 239; data[i+1] = 68; data[i+2] = 68; data[i+3] = 255; // Red
    } else {
      data[i] = 255; data[i+1] = 255; data[i+2] = 255; data[i+3] = 0; // Transparent
    }
  }
}
const IHDR = Buffer.alloc(13);
IHDR.writeUInt32BE(width, 0); IHDR.writeUInt32BE(height, 4);
IHDR[8] = 8; IHDR[9] = 6; IHDR[10] = 0; IHDR[11] = 0; IHDR[12] = 0;

// simple CRC32 implementation since zlib.crc32 might not be standard in all Node versions
function crc32(buffer) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ (-1)) >>> 0;
}

const chunk = (type, dataBuf) => {
  const length = Buffer.alloc(4); length.writeUInt32BE(dataBuf.length, 0);
  const typeBuf = Buffer.from(type);
  const combined = Buffer.concat([typeBuf, dataBuf]);
  const crc = crc32(combined);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([length, combined, crcBuf]);
};
const uncompressed = Buffer.alloc(height * (width * 4 + 1));
for(let y=0; y<height; y++) {
  uncompressed[y * (width * 4 + 1)] = 0; // Filter type 0
  data.copy(uncompressed, y * (width * 4 + 1) + 1, y * width * 4, (y+1) * width * 4);
}
const IDAT = zlib.deflateSync(uncompressed);
const png = Buffer.concat([
  Buffer.from('89504e470d0a1a0a', 'hex'),
  chunk('IHDR', IHDR),
  chunk('IDAT', IDAT),
  chunk('IEND', Buffer.alloc(0))
]);
fs.writeFileSync('assets/icon.png', png);
