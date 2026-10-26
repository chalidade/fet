/** Batasi `value` ke rentang [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) throw new RangeError(`min (${min}) lebih besar dari max (${max})`);
  return Math.min(Math.max(value, min), max);
}
