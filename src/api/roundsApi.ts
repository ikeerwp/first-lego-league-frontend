import type { AuthStrategy } from "@/lib/authProvider";
import { Round } from "@/types/round";
import { createHalResource, deleteHal, fetchHalCollection } from "./halClient";

export type CreateRoundPayload = {
    number: number;
};

export class RoundsService {
    constructor(private readonly authStrategy: AuthStrategy) { }

    async getRounds(): Promise<Round[]> {
        return fetchHalCollection<Round>(
            "/rounds?sort=number,asc&size=1000",
            this.authStrategy,
            "rounds",
        );
    }

    async createRound(data: CreateRoundPayload): Promise<Round> {
        return createHalResource<Round>(
            "/rounds",
            data,
            this.authStrategy,
            "round",
        );
    }

    async deleteRound(id: string): Promise<void> {
        const roundId = encodeURIComponent(id);
        await deleteHal(`/rounds/${roundId}`, this.authStrategy);
    }
}