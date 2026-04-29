import type { AuthStrategy } from "@/lib/authProvider";
import { Edition } from "@/types/edition";
import type { HalPage } from "@/types/pagination";
import { Team } from "@/types/team";
import {
    createHalResource,
    fetchHalCollection,
    fetchHalPagedCollection,
    fetchHalResource,
    mergeHal,
    patchHal,
    updateHalResource,
} from "./halClient";

export type CreateEditionPayload = {
    year: number;
    venueName: string;
    description: string;
};

export type UpdateEditionPayload = {
    year?: number;
    venueName?: string;
    description?: string;
};

function normalizeResourcePath(resourceUri: string) {
    if (resourceUri.startsWith("/")) {
        return resourceUri;
    }

    try {
        const parsed = new URL(resourceUri);
        return `${parsed.pathname}${parsed.search}`;
    } catch {
        return resourceUri;
    }
}

export class EditionsService {
    constructor(private readonly authStrategy: AuthStrategy) {}

    async getEditions(): Promise<Edition[]> {
        return fetchHalCollection<Edition>("/editions", this.authStrategy, "editions");
    }

    async getEditionsPaged(page: number, size: number): Promise<HalPage<Edition>> {
        return fetchHalPagedCollection<Edition>(
            "/editions",
            this.authStrategy,
            "editions",
            page,
            size
        );
    }

    async getEditionById(id: string): Promise<Edition> {
        const editionId = encodeURIComponent(id);
        return fetchHalResource<Edition>(`/editions/${editionId}`, this.authStrategy);
    }

    async getEditionByUri(resourceUri: string): Promise<Edition> {
        return fetchHalResource<Edition>(
            normalizeResourcePath(resourceUri),
            this.authStrategy
        );
    }

    async getEditionByYear(year: string | number): Promise<Edition | null> {
        const normalizedYear = encodeURIComponent(String(year));
        const editions = await fetchHalCollection<Edition>(
            `/editions/search/findByYear?year=${normalizedYear}`,
            this.authStrategy,
            "editions"
        );

        return editions.length > 0 ? editions[0] : null;
    }

    async getEditionsByVenueName(venueName: string): Promise<Edition[]> {
        return fetchHalCollection<Edition>(
            `/editions/search/findByVenueName?venueName=${encodeURIComponent(venueName)}`,
            this.authStrategy,
            "editions"
        );
    }

    async getEditionTeams(id: string): Promise<Team[]> {
        const editionId = encodeURIComponent(id);

        return fetchHalCollection<Team>(
            `/editions/${editionId}/teams`,
            this.authStrategy,
            "teams"
        );
    }

    async createEdition(data: CreateEditionPayload): Promise<Edition> {
        return createHalResource<Edition>(
            "/editions",
            data,
            this.authStrategy,
            "edition"
        );
    }

    async updateEdition(id: string, data: UpdateEditionPayload): Promise<Edition> {
        const editionId = encodeURIComponent(id);

        return updateHalResource<Edition>(
            `/editions/${editionId}`,
            data,
            this.authStrategy,
            "edition"
        );
    }

    async updateEditionState(id: string, newState: string): Promise<Edition> {
        const editionId = encodeURIComponent(id);

        const resource = await patchHal(
            `/editions/${editionId}`,
            { state: newState },
            this.authStrategy
        );

        if (!resource) {
            return { state: newState } as Edition;
        }

        return mergeHal<Edition>(resource);
    }
}
