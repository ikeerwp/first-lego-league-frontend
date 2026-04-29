import { Resource } from "halfred";

export interface RoundEntity {
    uri?: string;
    number?: number;
}

export type Round = RoundEntity & Resource;
