import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clamp, cx, debounce, throttle } from "./index";

describe("clamp", () => {
  it("membatasi nilai ke rentang", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it("menolak rentang terbalik", () => {
    expect(() => clamp(1, 10, 0)).toThrow(RangeError);
  });
});

describe("cx", () => {
  it("menggabungkan string, object, dan array", () => {
    expect(cx("a", false, null, { b: true, c: false }, ["d", ["e"]], 0)).toBe("a b d e");
  });
});

describe("timers", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("debounce hanya memanggil sekali dengan argumen terakhir", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d(1);
    d(2);
    d(3);
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith(3);
  });

  it("debounce mendukung cancel dan flush", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d(1);
    d.cancel();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
    d(2);
    d.flush();
    expect(fn).toHaveBeenCalledWith(2);
  });

  it("throttle memanggil di awal dan di akhir jendela", () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    t(1);
    t(2);
    t(3);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(1);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(3);
  });
});
