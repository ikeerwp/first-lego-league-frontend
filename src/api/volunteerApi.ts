import type { AuthStrategy } from "@/lib/authProvider";
import { Volunteer } from "@/types/volunteer";
import { fetchHalCollection, patchHal, deleteHal } from "./halClient";

type RawVolunteer = {
    uri?: string;
    name?: string;
    emailAddress?: string;
    phoneNumber?: string;
    expert?: boolean;
};
export class VolunteersService {
    constructor(private readonly authStrategy: AuthStrategy) {}

    async getVolunteers(): Promise<{ judges: Volunteer[], referees: Volunteer[], floaters: Volunteer[] }> {
        const [judges, referees, floaters] = await Promise.all([
            fetchHalCollection<RawVolunteer>('/judges', this.authStrategy, 'judges'),
            fetchHalCollection<RawVolunteer>('/referees', this.authStrategy, 'referees'),
            fetchHalCollection<RawVolunteer>('/floaters', this.authStrategy, 'floaters')
        ]);

        const mapV = (v: RawVolunteer, type: 'Judge' | 'Referee' | 'Floater'): Volunteer => ({
            uri: v.uri || '',
            name: v.name || '',
            emailAddress: v.emailAddress || '',
            phoneNumber: v.phoneNumber || '',
            expert: Boolean(v.expert),
            type
        } as Volunteer);

        return {
            judges: judges.map(j => ({ ...j, type: 'Judge' as const, uri: j.link('self')?.href })),
            referees: referees.map(r => ({ ...r, type: 'Referee' as const, uri: r.link('self')?.href })),
            floaters: floaters.map(f => ({ ...f, type: 'Floater' as const, uri: f.link('self')?.href }))
        };
    }

    async updateVolunteer(uri: string, data: Partial<Volunteer>): Promise<void> {
        const payload = {
            name: data.name,
            emailAddress: data.emailAddress,
            phoneNumber: data.phoneNumber,
            expert: data.expert 
        };
        await patchHal(uri, payload, this.authStrategy);
    }

    async deleteVolunteer(uri: string): Promise<void> {
        await deleteHal(uri, this.authStrategy);
    }
}
