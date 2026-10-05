"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import { createReviewSchema, CreateReviewInput } from "@/features/reviews/schemas";
import { useSubmitReview } from "@/features/reviews/hooks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RATING_LABEL = ["", "Kurang", "Cukup", "Baik", "Sangat baik", "Luar biasa"];

export function ReviewForm({ bookingId, productId }: { bookingId: string, productId: string }) {
  const submitMut = useSubmitReview();
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createReviewSchema),
    defaultValues: { bookingId, productId, rating: 5, comment: "" }
  });

  const watchedRating = useWatch({ control, name: "rating" });
  const rating = Number(watchedRating) || 0;

  const onSubmit = (data: any) => {
    submitMut.mutate(data as CreateReviewInput);
  };

  if (submitMut.isSuccess) {
    return (
      <div className="rounded-3xl bg-green-50 p-5 text-sm text-green-900 ring-1 ring-green-200">
        <p className="font-display text-lg font-semibold tracking-tight">Ulasan terkirim!</p>
        <p className="mt-1">Terima kasih telah menyewa dan memberikan ulasan.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-surface p-5 ring-1 ring-line md:p-6">
      <h3 className="font-display text-xl font-bold tracking-tight text-ink">Beri ulasan</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5">
        <fieldset>
          <legend className="text-sm font-semibold text-ink">Penilaian</legend>
          <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Penilaian bintang">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} bintang`}
                onClick={() => setValue("rating", n, { shouldValidate: true })}
                className="grid size-11 place-items-center rounded-full transition active:scale-90"
              >
                <Star
                  className={cn(
                    "size-8 transition-colors duration-200",
                    n <= rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-line",
                  )}
                  aria-hidden
                />
              </button>
            ))}
            <span className="ml-2 text-sm font-medium text-muted" aria-live="polite">
              {RATING_LABEL[rating]}
            </span>
          </div>
          <input type="hidden" {...register("rating")} />
          {errors.rating && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {errors.rating.message as string}
            </p>
          )}
        </fieldset>

        <div>
          <label htmlFor="comment" className="mb-2 block text-sm font-semibold text-ink">
            Komentar
          </label>
          <textarea
            id="comment"
            {...register("comment")}
            rows={4}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted/70 transition focus:border-ink focus:outline-none focus:ring-4 focus:ring-signal/50"
            placeholder="Bagaimana pengalaman Anda menyewa barang ini?"
          ></textarea>
          {errors.comment && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {errors.comment.message as string}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" disabled={isSubmitting || submitMut.isPending} className="w-full">
          {isSubmitting || submitMut.isPending ? "Mengirim..." : "Kirim ulasan"}
        </Button>
      </form>
    </div>
  );
}
