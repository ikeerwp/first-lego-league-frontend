import { Resource } from "halfred";

export interface MediaContentEntity {
    uri?: string;
    id?: string;
    type?: string;
    url?: string;
    edition?: string;
}

export type MediaContent = MediaContentEntity & Resource;
