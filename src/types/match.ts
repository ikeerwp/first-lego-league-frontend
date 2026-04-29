import { Resource } from "halfred";

export interface MatchEntity {
    uri: string;
    id: number;
    startTime: string;
    endTime: string;
    round: string;
    competitionTable: string;
    teamA: string;
    teamB: string;
    referee: string;
    state: string;
}

export type Match = MatchEntity & Resource;
