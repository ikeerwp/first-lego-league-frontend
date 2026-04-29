import type { AuthStrategy } from "@/lib/authProvider";
import { MediaContent } from "@/types/mediaContent";
import { createHalResource, fetchHalCollection } from "./halClient";

export class MediaService {
    constructor(private readonly authStrategy: AuthStrategy) {}

    async getMediaByEdition(editionUri: string): Promise<MediaContent[]> {
        const encodedEditionUri = encodeURIComponent(editionUri);
        return fetchHalCollection<MediaContent>(
            `/mediaContents/search/findByEdition?edition=${encodedEditionUri}`,
            this.authStrategy,
            "mediaContents"
        );
    }

    async createMedia(payload: { url: string; type: string; edition: string }): Promise<MediaContent> {
        return createHalResource<MediaContent>(
            '/mediaContents',
            { url: payload.url, type: payload.type, edition: payload.edition },
            this.authStrategy,
            'mediaContent'
        );
    }
}
