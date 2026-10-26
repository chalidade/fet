export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, unknown>;

/**
 * Gabungkan className secara kondisional.
 * `cx("btn", { "btn--active": isActive }, size && `btn--${size}`)`
 */
export function cx(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (typeof value === "string" || typeof value === "number") {
      out.push(String(value));
    } else if (Array.isArray(value)) {
      const inner = cx(...value);
      if (inner) out.push(inner);
    } else {
      for (const [key, on] of Object.entries(value)) {
        if (on) out.push(key);
      }
    }
  }
  return out.join(" ");
}
