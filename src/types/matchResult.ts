import { Resource } from "halfred";

export interface MatchResultEntity {
    score: number;
}

export type MatchResult = MatchResultEntity & Resource;

export interface MatchScorePayload {
    teamAId: string;
    teamBId: string;
    teamAScore: number;
    teamBScore: number;
}

export interface RegisterMatchScoreRequest {
    matchId: number;
    score: MatchScorePayload;
}

export interface RegisterMatchScoreResponse {
    matchId: number;
    resultSaved: boolean;
    rankingUpdated: boolean;
}
