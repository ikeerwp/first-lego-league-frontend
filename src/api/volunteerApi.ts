import type { AuthStrategy } from "@/lib/authProvider";
import { Volunteer } from "@/types/volunteer";
import { fetchHalCollection, deleteHal } from "./halClient";
export class VolunteersService {
    constructor(private readonly authStrategy: AuthStrategy) {}

    async getVolunteers(): Promise<{ judges: Volunteer[], referees: Volunteer[], floaters: Volunteer[] }> {
        const [judges, referees, floaters] = await Promise.all([
            fetchHalCollection<Volunteer>('/judges', this.authStrategy, 'judges'),
            fetchHalCollection<Volunteer>('/referees', this.authStrategy, 'referees'),
            fetchHalCollection<Volunteer>('/floaters', this.authStrategy, 'floaters')
        ]);

        return {
            judges: judges.map(j => ({ ...j, type: 'Judge' as const, uri: j.link('self')?.href })),
            referees: referees.map(r => ({ ...r, type: 'Referee' as const, uri: r.link('self')?.href })),
            floaters: floaters.map(f => ({ ...f, type: 'Floater' as const, uri: f.link('self')?.href }))
        };
    }

    async deleteVolunteer(uri: string): Promise<void> {
        await deleteHal(uri, this.authStrategy);
    }
}
