// Code 128 (subset B) barcode generator, readable by standard retail/USB barcode scanners.
// Each pattern lists bar/space widths in modules, starting with a bar.
const PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];
const START_B = 104;
const STOP = 106;

/** Returns bar/space module widths for `text` (printable ASCII 32–126). */
export function encodeCode128B(text: string): number[] {
  const codes = [START_B];
  for (const ch of text) {
    const value = ch.charCodeAt(0) - 32;
    if (value < 0 || value > 94) throw new Error(`Code 128B cannot encode "${ch}"`);
    codes.push(value);
  }
  const checksum = codes.reduce((sum, code, i) => sum + code * (i === 0 ? 1 : i), 0) % 103;
  codes.push(checksum, STOP);
  return codes.flatMap(code => PATTERNS[code].split('').map(Number));
}

/** Builds an SVG string of the barcode with the required 10-module quiet zones. */
export function code128Svg(text: string, { height = 50, moduleWidth = 2 } = {}): string {
  const widths = encodeCode128B(text);
  const quiet = 10;
  const totalModules = widths.reduce((a, b) => a + b, 0) + quiet * 2;
  let x = quiet;
  let bars = '';
  widths.forEach((w, i) => {
    if (i % 2 === 0) bars += `<rect x="${x}" y="0" width="${w}" height="${height}"/>`;
    x += w;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${height}" width="${totalModules * moduleWidth}" height="${height}" preserveAspectRatio="none" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><g fill="#000">${bars}</g></svg>`;
}
