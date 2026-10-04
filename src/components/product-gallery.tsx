"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

export function ProductGallery({ photos, alt }: { photos: string[]; alt: string }) {
    const [index, setIndex] = useState(0);
    const current = photos[index];

    return (
        <div className="space-y-3">
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                {current ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/files/${current}`} alt={alt} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
                        <ImageOff className="h-10 w-10" aria-hidden />
                        <span className="text-sm">Belum ada foto</span>
                    </div>
                )}
            </div>

            {photos.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                    {photos.map((photo, i) => (
                        <button
                            key={photo}
                            type="button"
                            onClick={() => setIndex(i)}
                            aria-label={`Lihat foto ${i + 1} dari ${photos.length}`}
                            aria-current={i === index ? "true" : undefined}
                            className={`relative aspect-4/3 w-24 shrink-0 overflow-hidden rounded-xl border-2 bg-slate-100 ${i === index ? "border-slate-900" : "border-transparent hover:border-slate-300"
                                }`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`/api/files/${photo}`} alt="" className="h-full w-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}