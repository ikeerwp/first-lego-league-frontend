import type { AuthStrategy } from "@/lib/authProvider";
import { MediaContent } from "@/types/mediaContent";
import { fetchHalCollection } from "./halClient";

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
}
