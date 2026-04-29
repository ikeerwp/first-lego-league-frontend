import type { AuthStrategy } from "@/lib/authProvider";
import { CompetitionTable } from "@/types/competitionTable";
import { Match } from "@/types/match";
import { MatchResult, MatchResultEntity, RegisterMatchScoreRequest, RegisterMatchScoreResponse } from "@/types/matchResult";
import { Referee } from "@/types/referee";
import { Round } from "@/types/round";
import { Team } from "@/types/team";
import { ApiError } from "@/types/errors";
import type { HalPage } from "@/types/pagination";
import { createHalResource, deleteHal, fetchHalCollection, fetchHalPagedCollection, fetchHalResource, postHal } from "./halClient";

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

    async getMatchesPaged(page: number, size: number): Promise<HalPage<Match>> {
        return fetchHalPagedCollection<Match>(
            "/matches?sort=startTime,asc&sort=id,asc",
            this.authStrategy,
            "matches",
            page,
            size
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

    async getMatchRound(id: string): Promise<Round> {
        const matchId = encodeURIComponent(id);
        return fetchHalResource<Round>(`/matches/${matchId}/round`, this.authStrategy);
    }

    async getMatchTeams(id: string): Promise<Team[]> {
        const matchId = encodeURIComponent(id);
        return fetchHalCollection<Team>(`/matches/${matchId}/teams`, this.authStrategy, "teams");
    }

    async getMatchTeamA(id: string): Promise<Team> {
        const matchId = encodeURIComponent(id);
        return fetchHalResource<Team>(`/matches/${matchId}/teamA`, this.authStrategy);
    }

    async getMatchTeamB(id: string): Promise<Team> {
        const matchId = encodeURIComponent(id);
        return fetchHalResource<Team>(`/matches/${matchId}/teamB`, this.authStrategy);
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

    async getMatchResults(matchUri: string): Promise<MatchResult[]> {
        const encodedUri = encodeURIComponent(matchUri);
        return fetchHalCollection<MatchResultEntity>(
            `/matchResults/search/findByMatch?match=${encodedUri}`,
            this.authStrategy,
            "matchResults"
        );
    }

    async registerMatchResult(data: RegisterMatchScoreRequest): Promise<RegisterMatchScoreResponse> {
        const resource = await postHal("/matchResults/register", data as unknown as Record<string, unknown>, this.authStrategy);
        if (!resource) throw new ApiError("No response from server", 500, true);
        const raw = resource as unknown as RegisterMatchScoreResponse;
        return {
            matchId: raw.matchId,
            resultSaved: raw.resultSaved,
            rankingUpdated: raw.rankingUpdated,
        };
    }

    async deleteMatch(id: string): Promise<void> {
        const matchId = encodeURIComponent(id);
        await deleteHal(`/matches/${matchId}`, this.authStrategy);
    }
}
