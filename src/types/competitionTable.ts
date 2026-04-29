import { Resource } from "halfred";

export interface CompetitionTableEntity {
    uri?: string;
}

export type CompetitionTable = CompetitionTableEntity & Resource;
