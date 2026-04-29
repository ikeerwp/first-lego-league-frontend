import { Resource } from "halfred";

export interface RefereeEntity {
    uri?: string;
    name?: string;
    emailAddress?: string;
    phoneNumber?: string;
    expert?: boolean;
}

export type Referee = RefereeEntity & Resource;
