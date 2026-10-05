"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 60;

export function ProductGallery({ photos, alt }: { photos: string[]; alt: string }) {
    const [index, setIndex] = useState(0);
    const count = photos.length;
    const current = photos[index];

    const go = (next: number) => setIndex(((next % count) + count) % count);

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (count < 2) return;
        if (e.key === "ArrowRight") {
            e.preventDefault();
            go(index + 1);
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            go(index - 1);
        }
    };

    return (
        <div className="space-y-3">
            <div
                role="group"
                aria-roledescription="carousel"
                aria-label={`Foto ${alt}`}
                tabIndex={count > 1 ? 0 : undefined}
                onKeyDown={onKeyDown}
                className="relative aspect-[4/3] w-full touch-pan-y overflow-hidden rounded-[1.75rem] bg-line/60 ring-1 ring-line focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand md:rounded-[2.25rem] md:aspect-[5/4] lg:aspect-[4/3]"
            >
                {current ? (
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={current}
                            className="absolute inset-0"
                            initial={{ opacity: 0, scale: 1.04 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            drag={count > 1 ? "x" : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.25}
                            onDragEnd={(_, info) => {
                                if (info.offset.x < -SWIPE_THRESHOLD) go(index + 1);
                                else if (info.offset.x > SWIPE_THRESHOLD) go(index - 1);
                            }}
                        >
                            <ProductImage
                                path={current}
                                alt={index === 0 ? alt : `${alt}, foto ${index + 1}`}
                                priority={index === 0}
                                className="pointer-events-none size-full select-none object-cover"
                            />
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-2 text-muted">
                        <ImageOff className="size-10" aria-hidden />
                        <span className="text-sm">Belum ada foto</span>
                    </div>
                )}

                {count > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={() => go(index - 1)}
                            aria-label="Foto sebelumnya"
                            className="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-surface/85 text-ink shadow-lg backdrop-blur transition hover:bg-surface active:scale-95 md:grid"
                        >
                            <ChevronLeft className="size-5" aria-hidden />
                        </button>
                        <button
                            type="button"
                            onClick={() => go(index + 1)}
                            aria-label="Foto berikutnya"
                            className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-surface/85 text-ink shadow-lg backdrop-blur transition hover:bg-surface active:scale-95 md:grid"
                        >
                            <ChevronRight className="size-5" aria-hidden />
                        </button>

                        <span
                            aria-live="polite"
                            className="absolute bottom-3 right-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-canvas backdrop-blur"
                        >
                            {index + 1} / {count}
                        </span>
                    </>
                )}
            </div>

            {count > 1 && (
                <div className="hide-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
                    {photos.map((photo, i) => (
                        <button
                            key={photo}
                            type="button"
                            onClick={() => setIndex(i)}
                            aria-label={`Lihat foto ${i + 1} dari ${count}`}
                            aria-current={i === index ? "true" : undefined}
                            className={cn(
                                "relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-2xl bg-line/60 ring-2 transition duration-300 ml:w-24 3xl:w-28",
                                i === index ? "ring-ink" : "opacity-70 ring-transparent hover:opacity-100",
                            )}
                        >
                            <ProductImage path={photo} alt="" className="size-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
