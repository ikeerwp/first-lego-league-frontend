import type { AuthStrategy } from "@/lib/authProvider";
import { Volunteer } from "@/types/volunteer";
import { fetchHalCollection } from "./halClient";

export class VolunteersService {
    constructor(private readonly authStrategy: AuthStrategy) {}

    async getVolunteers(): Promise<{ judges: Volunteer[], referees: Volunteer[], floaters: Volunteer[] }> {
        const [judges, referees, floaters] = await Promise.all([
            fetchHalCollection<Volunteer>('/judges', this.authStrategy, 'judges'),
            fetchHalCollection<Volunteer>('/referees', this.authStrategy, 'referees'),
            fetchHalCollection<Volunteer>('/floaters', this.authStrategy, 'floaters')
        ]);

        return {
            judges: judges.map(j => ({ ...j, type: 'Judge' as const })),
            referees: referees.map(r => ({ ...r, type: 'Referee' as const })),
            floaters: floaters.map(f => ({ ...f, type: 'Floater' as const }))
        };
    }
}
