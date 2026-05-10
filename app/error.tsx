"use client";
// Phase 10 / Section 13 — Root App Router error boundary.
// Must be a client component per Next.js convention.
import { SysError } from "@/components/system/SysError";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="main">
      <SysError error={error} reset={reset} />
    </main>
  );
}
