import type { AuthStrategy } from "@/lib/authProvider";
import { Volunteer } from "@/types/volunteer";
import { fetchHalCollection, patchHal } from "./halClient";

export class VolunteersService {
    constructor(private readonly authStrategy: AuthStrategy) { }

    async getVolunteers(): Promise<{ judges: Volunteer[], referees: Volunteer[], floaters: Volunteer[] }> {
        const [judges, referees, floaters] = await Promise.all([
            fetchHalCollection<any>('/judges', this.authStrategy, 'judges'),
            fetchHalCollection<any>('/referees', this.authStrategy, 'referees'),
            fetchHalCollection<any>('/floaters', this.authStrategy, 'floaters')
        ]);

        return {
            judges: judges.map(j => ({
                uri: j.uri || '',
                name: j.name || '',
                emailAddress: j.emailAddress || '',
                phoneNumber: j.phoneNumber || '',
                expert: j.expert || false,
                type: 'Judge' as const
            })) as unknown as Volunteer[],
            referees: referees.map(r => ({
                uri: r.uri || '',
                name: r.name || '',
                emailAddress: r.emailAddress || '',
                phoneNumber: r.phoneNumber || '',
                type: 'Referee' as const
            })) as unknown as Volunteer[],
            floaters: floaters.map(f => ({
                uri: f.uri || '',
                name: f.name || '',
                emailAddress: f.emailAddress || '',
                phoneNumber: f.phoneNumber || '',
                type: 'Floater' as const
            })) as unknown as Volunteer[]
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
}