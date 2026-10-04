"use client";

import { useState } from "react";
import { useUploadPayment } from "@/features/booking/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PaymentUploader({ bookingId }: { bookingId: string }) {
  const upload = useUploadPayment();
  const [file, setFile] = useState<File | null>(null);
  const [senderName, setSenderName] = useState("");

  const handleUpload = () => {
    if (!file || !senderName) return;
    upload.mutate({ bookingId, file, senderName });
  };

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6 mt-6">
      <h3 className="font-semibold text-zinc-900">Unggah Bukti Transfer</h3>
      <div className="space-y-2">
        <Label htmlFor="sender">Nama Pengirim (Sesuai Rekening)</Label>
        <Input 
          id="sender" 
          placeholder="Budi Santoso" 
          value={senderName} 
          onChange={e => setSenderName(e.target.value)} 
          disabled={upload.isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="file">Foto Struk / Screenshot</Label>
        <Input 
          id="file" 
          type="file" 
          accept="image/*" 
          onChange={e => setFile(e.target.files?.[0] || null)}
          disabled={upload.isPending}
        />
      </div>
      <Button 
        className="w-full" 
        onClick={handleUpload} 
        disabled={upload.isPending || !file || !senderName}
      >
        {upload.isPending ? "Mengunggah..." : "Kirim Bukti Pembayaran"}
      </Button>
    </div>
  );
}
