import { notFound } from "next/navigation";
import { MediaGallery } from "@/app/components/media-gallery";
import { DEMO_MEDIA } from "@/lib/demo-media";

export default function MediaPreviewPage() {
    if (process.env.NODE_ENV === "production") {
        notFound();
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-3xl px-4 py-10">
                <div className="w-full rounded-lg border border-border bg-card p-6 shadow-sm">
                    <h1 className="mb-2 text-2xl font-semibold text-foreground">Edition 2025</h1>
                    <p className="mb-8 text-sm text-muted-foreground">Preview page — not available in production</p>

                    <h2 className="mb-4 text-xl font-semibold text-foreground">Media</h2>
                    <MediaGallery mediaContents={DEMO_MEDIA} />
                </div>
            </div>
        </div>
    );
}
