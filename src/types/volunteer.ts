import { Resource } from "halfred";

export type VolunteerRole = "Judge" | "Referee" | "Floater";

export interface VolunteerEntity {
    uri?: string;
    name?: string;
    emailAddress?: string;
    phoneNumber?: string;
    type?: VolunteerRole;
    expert?: boolean;
}

export type Volunteer = VolunteerEntity & Resource;
