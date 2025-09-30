"use client";
import { useEffect } from "react";
import { flushQueue } from "@/lib/sync";

export default function SyncProvider() {
  useEffect(() => {
    flushQueue();
    const onOnline = () => flushQueue();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);
  return null;
}
