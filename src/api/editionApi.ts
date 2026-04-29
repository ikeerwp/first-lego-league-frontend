import type { AuthStrategy } from "@/lib/authProvider";
import { Edition } from "@/types/edition";
import { Team } from "@/types/team";
import { fetchHalCollection, fetchHalResource, patchHal, mergeHal } from "./halClient";

export class EditionsService {
    constructor(private readonly authStrategy: AuthStrategy) {}

    async getEditions(): Promise<Edition[]> {
        return fetchHalCollection<Edition>('/editions', this.authStrategy, 'editions');
    }

    async getEditionById(id: string): Promise<Edition> {
        const editionId = encodeURIComponent(id);
        return fetchHalResource<Edition>(`/editions/${editionId}`, this.authStrategy);
    }

    async getEditionTeams(id: string): Promise<Team[]> {
        const editionId = encodeURIComponent(id);
        return fetchHalCollection<Team>(`/editions/${editionId}/teams`, this.authStrategy, 'teams');
    }

    async updateEditionState(id: string, newState: string): Promise<Edition> {
        const editionId = encodeURIComponent(id);

        const resource = await patchHal(
            `/editions/${editionId}`,
            { state: newState },
            this.authStrategy
        );

        if (!resource) {
            throw new Error("Failed to update edition state");
        }

        return mergeHal<Edition>(resource);
    }
}
