"use client";

import { useState } from "react";
import { useCreateBooking } from "@/features/booking/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/hooks";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { localDateToKey } from "@/lib/dates";

interface BookingFormProps {
  productId: string;
  pricePerDay: number;
  securityDeposit: number;
}

export function BookingForm({ productId, pricePerDay, securityDeposit }: BookingFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const createBooking = useCreateBooking();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleBooking = () => {
    if (!user) {
      toast.error("Silakan masuk terlebih dahulu");
      router.push("/login");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Pilih tanggal sewa terlebih dahulu");
      return;
    }

    createBooking.mutate({
      productId,
      startDate,
      endDate,
    });
  };

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  let days = 0;
  if (start && end && end >= start) {
    days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
  const lineTotal = days * pricePerDay;
  const total = lineTotal > 0 ? lineTotal + securityDeposit : 0;

  // Tomorrow as minimum start date
  const today = new Date();
  today.setDate(today.getDate() + 1);
  const minDate = localDateToKey(today);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="start">Mulai Sewa</Label>
            <Input
              id="start"
              type="date"
              min={minDate}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate && new Date(e.target.value) > new Date(endDate)) {
                  setEndDate("");
                }
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end">Selesai Sewa</Label>
            <Input
              id="end"
              type="date"
              min={startDate || minDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        
        {days > 0 && (
          <div className="pt-4 border-t border-zinc-200 space-y-2 text-sm text-zinc-600">
            <div className="flex justify-between">
              <span>Rp {pricePerDay.toLocaleString("id-ID")} x {days} hari</span>
              <span>Rp {lineTotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span>Deposit Jaminan</span>
              <span>Rp {securityDeposit.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between font-bold text-zinc-900 text-lg pt-2 border-t border-zinc-100">
              <span>Total Bayar</span>
              <span>Rp {total.toLocaleString("id-ID")}</span>
            </div>
          </div>
        )}
      </div>

      <Button
        size="lg"
        className="w-full text-base font-semibold mt-6"
        onClick={handleBooking}
        disabled={createBooking.isPending || !startDate || !endDate || days <= 0}
      >
        {createBooking.isPending ? "Memproses..." : "Sewa Sekarang"}
      </Button>
    </div>
  );
}
