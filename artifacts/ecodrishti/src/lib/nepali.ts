const NP_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function toNpDigits(n: number | string): string {
  return String(n).replace(/\d/g, d => NP_DIGITS[parseInt(d)]);
}

export function npNum(n: number | string, lang: string): string {
  if (lang !== 'np') return String(n);
  return toNpDigits(n);
}

export function npFixed(n: number, decimals: number, lang: string): string {
  const s = n.toFixed(decimals);
  return lang === 'np' ? toNpDigits(s) : s;
}
