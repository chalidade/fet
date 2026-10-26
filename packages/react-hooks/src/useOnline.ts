import { useSyncExternalStore } from "react";

function subscribe(notify: () => void) {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
}

/**
 * `navigator.onLine` yang ikut berubah saat koneksi putus/tersambung. Ingat: `true` hanya
 * berarti ada jaringan, bukan berarti server bisa dijangkau. Di server mengembalikan `true`.
 */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
