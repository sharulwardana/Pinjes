import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton loading placeholder dengan kilau shimmer wave yang halus.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative isolate overflow-hidden rounded-2xl bg-line/60",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-linear-to-r after:from-transparent after:via-surface/60 after:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
