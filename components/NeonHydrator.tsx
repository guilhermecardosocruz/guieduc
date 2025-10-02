"use client";
import { useEffect } from "react";
import { hydrateFromNeonIfEmpty } from "@/lib/replay";

export default function NeonHydrator() {
  useEffect(() => { hydrateFromNeonIfEmpty(); }, []);
  return null;
}
