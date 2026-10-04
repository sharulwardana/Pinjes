"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReviewSchema, CreateReviewInput } from "@/features/reviews/schemas";
import { useSubmitReview } from "@/features/reviews/hooks";
import { Button } from "@/components/ui/button";

export function ReviewForm({ bookingId, productId }: { bookingId: string, productId: string }) {
  const submitMut = useSubmitReview();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createReviewSchema),
    defaultValues: { bookingId, productId, rating: 5, comment: "" }
  });

  const onSubmit = (data: any) => {
    submitMut.mutate(data as CreateReviewInput);
  };

  if (submitMut.isSuccess) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800 text-sm">
        <p className="font-medium">Ulasan terkirim!</p>
        <p>Terima kasih telah menyewa dan memberikan ulasan.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="font-semibold text-zinc-900 mb-4">Beri Ulasan</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Rating (1-5)</label>
          <input
            type="number"
            min="1"
            max="5"
            {...register("rating")}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
          />
          {errors.rating && <p className="mt-1 text-xs text-red-600">{errors.rating.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Komentar</label>
          <textarea
            {...register("comment")}
            rows={3}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            placeholder="Bagaimana pengalaman Anda menyewa barang ini?"
          ></textarea>
          {errors.comment && <p className="mt-1 text-xs text-red-600">{errors.comment.message as string}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting || submitMut.isPending} className="w-full">
          {isSubmitting || submitMut.isPending ? "Mengirim..." : "Kirim Ulasan"}
        </Button>
      </form>
    </div>
  );
}
