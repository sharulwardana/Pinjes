"use client";

import { useConfirmPayment } from "@/features/booking/hooks";
import { Button } from "@/components/ui/button";

export function ConfirmPaymentBtn({ bookingId }: { bookingId: string }) {
  const confirm = useConfirmPayment();

  return (
    <Button 
      className="bg-green-600 hover:bg-green-700 text-white w-full"
      onClick={() => confirm.mutate(bookingId)}
      disabled={confirm.isPending}
    >
      {confirm.isPending ? "Memproses..." : "Konfirmasi"}
    </Button>
  );
}
