import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useDebouncedCallback,
  useDebouncedValue,
  useEventListener,
  useIntersectionObserver,
  useLocalStorage,
  useMediaQuery,
  useOnClickOutside,
  usePrevious,
} from "./index";

describe("debounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("useDebouncedValue baru berubah setelah diam", () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 100), { initialProps: { v: "a" } });
    rerender({ v: "ab" });
    rerender({ v: "abc" });
    expect(result.current).toBe("a");
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("abc");
  });

  it("useDebouncedCallback stabil, memakai fn terbaru, dan batal saat unmount", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender, unmount } = renderHook(({ fn }) => useDebouncedCallback(fn, 100), {
      initialProps: { fn: first },
    });
    const stable = result.current;
    result.current(1);
    rerender({ fn: second });
    expect(result.current).toBe(stable);
    act(() => vi.advanceTimersByTime(100));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(1);

    result.current(2);
    unmount();
    vi.advanceTimersByTime(100);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("flush menjalankan panggilan yang menunggu", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 100));
    result.current("x");
    result.current.flush();
    expect(fn).toHaveBeenCalledWith("x");
  });
});

describe("useMediaQuery", () => {
  it("mengikuti perubahan matchMedia", () => {
    let matches = false;
    const listeners = new Set<() => void>();
    vi.stubGlobal("matchMedia", (query: string) => ({
      get matches() {
        return matches;
      },
      media: query,
      addEventListener: (_: string, l: () => void) => listeners.add(l),
      removeEventListener: (_: string, l: () => void) => listeners.delete(l),
    }));
    const { result, unmount } = renderHook(() => useMediaQuery("(max-width: 640px)"));
    expect(result.current).toBe(false);
    act(() => {
      matches = true;
      listeners.forEach((l) => l());
    });
    expect(result.current).toBe(true);
    unmount();
    expect(listeners.size).toBe(0);
    vi.unstubAllGlobals();
  });
});

describe("useLocalStorage", () => {
  beforeEach(() => localStorage.clear());

  it("menyimpan, membaca, dan menghapus", () => {
    const { result } = renderHook(() => useLocalStorage("count", 0));
    expect(result.current[0]).toBe(0);
    act(() => result.current[1]((n) => n + 1));
    expect(result.current[0]).toBe(1);
    expect(localStorage.getItem("count")).toBe("1");
    act(() => result.current[2]());
    expect(result.current[0]).toBe(0);
    expect(localStorage.getItem("count")).toBeNull();
  });

  it("menyinkronkan dua komponen dengan key yang sama", () => {
    const a = renderHook(() => useLocalStorage("name", ""));
    const b = renderHook(() => useLocalStorage("name", ""));
    act(() => a.result.current[1]("fet"));
    expect(b.result.current[0]).toBe("fet");
  });

  it("bereaksi pada event storage dari tab lain dan tahan JSON rusak", () => {
    const { result } = renderHook(() => useLocalStorage("theme", "light"));
    act(() => {
      localStorage.setItem("theme", JSON.stringify("dark"));
      window.dispatchEvent(new StorageEvent("storage", { key: "theme" }));
    });
    expect(result.current[0]).toBe("dark");
    act(() => {
      localStorage.setItem("theme", "{rusak");
      window.dispatchEvent(new StorageEvent("storage", { key: "theme" }));
    });
    expect(result.current[0]).toBe("light");
  });
});

describe("usePrevious", () => {
  it("mengembalikan nilai render sebelumnya", () => {
    const { result, rerender } = renderHook(({ v }) => usePrevious(v), { initialProps: { v: 1 } });
    expect(result.current).toBeUndefined();
    rerender({ v: 2 });
    expect(result.current).toBe(1);
  });
});

describe("useEventListener & useOnClickOutside", () => {
  it("memanggil handler terbaru dan melepas listener saat unmount", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = renderHook(({ fn }) => useEventListener(window, "resize", fn), {
      initialProps: { fn: first },
    });
    rerender({ fn: second });
    window.dispatchEvent(new Event("resize"));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    unmount();
    window.dispatchEvent(new Event("resize"));
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("mendeteksi klik di luar elemen", () => {
    const onOutside = vi.fn();
    function Box() {
      const ref = useRef<HTMLDivElement>(null);
      useOnClickOutside(ref, onOutside);
      return (
        <div>
          <div ref={ref} data-testid="inside" />
          <button>luar</button>
        </div>
      );
    }
    const { getByTestId, getByText } = render(<Box />);
    fireEvent.pointerDown(getByTestId("inside"));
    expect(onOutside).not.toHaveBeenCalled();
    fireEvent.pointerDown(getByText("luar"));
    expect(onOutside).toHaveBeenCalledTimes(1);
  });
});

describe("useIntersectionObserver", () => {
  it("melaporkan isIntersecting dan berhenti mengamati dengan once", () => {
    let callback: IntersectionObserverCallback = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    function Probe() {
      const { ref, isIntersecting } = useIntersectionObserver({ once: true });
      return <div ref={ref}>{isIntersecting ? "terlihat" : "tersembunyi"}</div>;
    }
    const { getByText } = render(<Probe />);
    expect(getByText("tersembunyi")).toBeTruthy();
    act(() => callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(getByText("terlihat")).toBeTruthy();
    expect(disconnect).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
