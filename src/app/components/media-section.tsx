"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Images } from "lucide-react";
import { MediaGallery, MediaItem } from "@/app/components/media-gallery";

interface MediaSectionProps {
    readonly mediaContents: MediaItem[];
}

export function MediaSection({ mediaContents }: MediaSectionProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="mt-10">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-secondary/40 px-5 py-3.5 text-left transition-colors hover:bg-secondary/70"
            >
                <div className="flex items-center gap-2.5">
                    <Images className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold text-foreground">
                        Media
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                            {mediaContents.length} {mediaContents.length === 1 ? "item" : "items"}
                        </span>
                    </span>
                </div>
                {open
                    ? <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    : <ChevronDown className="h-5 w-5 text-muted-foreground" />
                }
            </button>

            {open && (
                <div className="mt-4">
                    <MediaGallery mediaContents={mediaContents} />
                </div>
            )}
        </div>
    );
}
