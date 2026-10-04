"use client";

import { Button } from "./ui/button";
import { useUpdateBookingStatus } from "@/features/booking/hooks";

export function StatusTransitionBtn({ bookingId, nextStatus, label, variant = "default" }: { bookingId: string, nextStatus: string, label: string, variant?: "default" | "outline" }) {
  const mut = useUpdateBookingStatus();

  return (
    <Button
      variant={variant}
      className="w-full"
      onClick={() => mut.mutate({ bookingId, status: nextStatus })}
      disabled={mut.isPending}
    >
      {mut.isPending ? "Memproses..." : label}
    </Button>
  );
}
