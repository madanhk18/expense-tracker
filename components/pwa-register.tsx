"use client";

import { useEffect } from "react";

/** Registers the service worker once on mount. No-ops in dev/unsupported browsers. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
