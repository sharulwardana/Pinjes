"use client";

import { useSyncExternalStore } from "react";

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** true di layar >= 1024px (breakpoint `lg`). Server dianggap desktop supaya HTML awal tidak tersembunyi. */
export function useIsDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  );
}
