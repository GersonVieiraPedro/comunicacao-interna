"use client";

import { useEffect } from "react";
import { ensureServiceWorker } from "@/lib/push-client";

export function PwaRegister() {
  useEffect(() => {
    void ensureServiceWorker().catch(() => undefined);
  }, []);
  return null;
}
