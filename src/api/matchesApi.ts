import type { AuthStrategy } from "@/lib/authProvider";
import { CompetitionTable } from "@/types/competitionTable";
import { Match } from "@/types/match";
import { Referee } from "@/types/referee";
import { Round } from "@/types/round";
import { Team } from "@/types/team";
import { createHalResource, fetchHalCollection, fetchHalResource } from "./halClient";

export type CreateMatchPayload = {
    startTime: string;
    endTime: string;
    round: string;
    competitionTable: string;
    teamA: string;
    teamB: string;
    referee: string;
};

export class MatchesService {
    constructor(private readonly authStrategy: AuthStrategy) {}

    async getMatches(): Promise<Match[]> {
        return fetchHalCollection<Match>(
            "/matches?sort=startTime,asc&sort=id,asc&size=1000",
            this.authStrategy,
            "matches"
        );
    }

    async getMatchesByEdition(editionUri: string): Promise<Match[]> {
        return fetchHalCollection<Match>(
            `${editionUri}?sort=startTime,asc&sort=id,asc&size=1000`,
            this.authStrategy,
            "matches"
        );
    }

    async getMatchById(id: string): Promise<Match> {
        const matchId = encodeURIComponent(id);
        return fetchHalResource<Match>(`/matches/${matchId}`, this.authStrategy);
    }

    async getMatchTeams(id: string): Promise<Team[]> {
        const matchId = encodeURIComponent(id);
        return fetchHalCollection<Team>(`/matches/${matchId}/teams`, this.authStrategy, "teams");
    }

    async getRounds(): Promise<Round[]> {
        return fetchHalCollection<Round>(
            "/rounds?sort=number,asc&size=1000",
            this.authStrategy,
            "rounds"
        );
    }

    async getCompetitionTables(): Promise<CompetitionTable[]> {
        return fetchHalCollection<CompetitionTable>(
            "/competitionTables?size=1000",
            this.authStrategy,
            "competitionTables"
        );
    }

    async getReferees(): Promise<Referee[]> {
        return fetchHalCollection<Referee>(
            "/referees?sort=name,asc&size=1000",
            this.authStrategy,
            "referees"
        );
    }

    async createMatch(data: CreateMatchPayload): Promise<Match> {
        return createHalResource<Match>("/matches", data, this.authStrategy, "match");
    }
}
