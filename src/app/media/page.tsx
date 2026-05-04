import { EditionsService } from "@/api/editionApi";
import { MediaService } from "@/api/mediaApi";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { MediaViewer, MediaViewerItem } from "@/app/media/media-viewer";
import { serverAuthProvider } from "@/lib/authProvider";
import { getEncodedResourceId } from "@/lib/halRoute";
import { Edition } from "@/types/edition";
import { NotFoundError, parseErrorMessage } from "@/types/errors";
import { MediaContent } from "@/types/mediaContent";

interface MediaPageProps {
    readonly searchParams: Promise<{ url?: string | string[] }>;
}

interface MediaResult {
    readonly media: MediaContent | null;
    readonly error: string | null;
}

interface EditionContext {
    readonly edition: Edition | null;
    readonly mediaItems: MediaContent[];
    readonly warning: string | null;
}

function firstParam(value: string | string[] | undefined): string | null {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }

    return value ?? null;
}

function getMediaUrl(content: MediaContent): string {
    return content.url ?? content.id ?? "";
}

function toMediaViewerItem(content: MediaContent): MediaViewerItem {
    const mediaUrl = getMediaUrl(content);

    return {
        id: mediaUrl,
        type: content.type,
        url: mediaUrl,
    };
}

function getEditionUri(content: MediaContent): string | null {
    const linkedEdition = content.link?.("edition")?.href;
    if (linkedEdition) {
        return linkedEdition;
    }

    if (typeof content.edition === "string" && content.edition.length > 0) {
        return content.edition;
    }

    return null;
}

function getMediaTitle(media: MediaContent | null): string {
    if (!media) {
        return "Media";
    }

    return media.type ? `Media ${media.type}` : "Media";
}

async function getMedia(mediaUrl: string, mediaService: MediaService): Promise<MediaResult> {
    try {
        return {
            media: await mediaService.getMediaById(mediaUrl),
            error: null,
        };
    } catch (e) {
        console.error("Failed to fetch media:", e);
        return {
            media: null,
            error: e instanceof NotFoundError
                ? "This media does not exist."
                : parseErrorMessage(e),
        };
    }
}

async function getEditionContext(
    media: MediaContent,
    mediaService: MediaService,
    editionService: EditionsService
): Promise<EditionContext> {
    const editionUri = getEditionUri(media);

    if (!editionUri) {
        return { edition: null, mediaItems: [media], warning: null };
    }

    try {
        const editionPromise = editionService.getEditionByUri(editionUri);
        const mediaItemsPromise = mediaService.getMediaByEdition(editionUri);
        const [edition, mediaItems] = await Promise.all([editionPromise, mediaItemsPromise]);

        return {
            edition,
            mediaItems,
            warning: null,
        };
    } catch (e) {
        console.error("Failed to fetch media edition data:", e);
        return {
            edition: null,
            mediaItems: [media],
            warning: parseErrorMessage(e),
        };
    }
}

function renderMediaError(message: string) {
    return (
        <PageShell
            eyebrow="Media"
            title="Media not found"
            description="The requested media could not be loaded."
        >
            <ErrorAlert message={message} />
        </PageShell>
    );
}

export default async function MediaPage({ searchParams }: MediaPageProps) {
    const mediaUrl = firstParam((await searchParams).url);

    if (!mediaUrl) {
        return renderMediaError("No media URL was provided.");
    }

    const mediaService = new MediaService(serverAuthProvider);
    const editionService = new EditionsService(serverAuthProvider);
    const { media, error } = await getMedia(mediaUrl, mediaService);

    if (error || !media) {
        return renderMediaError(error ?? "This media does not exist.");
    }

    const { edition, mediaItems, warning } = await getEditionContext(media, mediaService, editionService);
    const normalizedMediaItems = mediaItems.length > 0 ? mediaItems : [media];
    const activeIndex = Math.max(
        normalizedMediaItems.findIndex((item) => getMediaUrl(item) === getMediaUrl(media)),
        0
    );
    const editionId = getEncodedResourceId(edition?.uri);

    return (
        <PageShell
            eyebrow="Media"
            title={getMediaTitle(media)}
            description="View this media item and move through the other media from the same edition."
        >
            {warning && (
                <div className="mb-4">
                    <ErrorAlert message={warning} />
                </div>
            )}
            <MediaViewer
                media={toMediaViewerItem(media)}
                mediaItems={normalizedMediaItems.map(toMediaViewerItem)}
                activeIndex={activeIndex}
                edition={edition
                    ? {
                        id: editionId,
                        year: edition.year,
                        venueName: edition.venueName,
                        description: edition.description,
                    }
                    : null}
            />
        </PageShell>
    );
}
