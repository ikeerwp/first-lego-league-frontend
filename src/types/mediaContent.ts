import { Resource } from "halfred";

export interface MediaContentEntity {
    uri?: string;
    /** The resource identifier, which also serves as the media URL in this API. */
    id?: string;
    type?: string;
    /** Separate URL field — may be absent; fall back to `id` which doubles as the URL. */
    url?: string;
    edition?: string;
}

export type MediaContent = MediaContentEntity & Resource;
