import type { AuthStrategy } from "@/lib/authProvider";
import type { HalPage } from "@/types/pagination";
import {
    ApiError,
    AuthenticationError,
    ConflictError,
    NetworkError,
    NotFoundError,
    ServerError,
    ValidationError,
} from "@/types/errors";
import {
    CreateCoachPayload,
    CreateTeamMemberPayload,
    CreateTeamPayload,
    Team,
    TeamCoach,
    TeamMember,
    TeamMemberGender,
} from "@/types/team";
import {
    API_BASE_URL,
    fetchHalCollection,
    fetchHalPagedCollection,
    fetchHalResource,
    createHalResource,
    deleteHal,
} from "./halClient";

function getSafeEncodedId(id: string): string {
    try {
        return encodeURIComponent(decodeURIComponent(id));
    } catch {
        return encodeURIComponent(id);
    }
}

export interface AddMemberPayload {
    name: string;
    role: string;
    birthDate: string;
    gender: TeamMemberGender;
}

export class TeamsService {
    constructor(private readonly authStrategy: AuthStrategy) {}

    async getTeams(): Promise<Team[]> {
        return fetchHalCollection<Team>("/teams", this.authStrategy, "teams");
    }

    async getTeamsByEdition(editionUri: string): Promise<Team[]> {
        return fetchHalCollection<Team>(editionUri, this.authStrategy, 'teams');
    }

    async getTeamsPaged(page: number, size: number): Promise<HalPage<Team>> {
        return fetchHalPagedCollection<Team>('/teams', this.authStrategy, 'teams', page, size);
    }

    async getTeamById(id: string): Promise<Team> {
        const teamId = getSafeEncodedId(id);
        return fetchHalResource<Team>(`/teams/${teamId}`, this.authStrategy);
    }

    async createTeam(data: CreateTeamPayload): Promise<Team> {
        return createHalResource<Team>(
            "/teams",
            {
                name: data.name.trim(),
                city: data.city.trim(),
                foundationYear: data.foundationYear,
                educationalCenter: data.educationalCenter.trim(),
                category: data.category,
                inscriptionDate: data.inscriptionDate,
            },
            this.authStrategy,
            "team"
        );
    }

    async getTeamCoach(id: string): Promise<TeamCoach[]> {
        const teamId = getSafeEncodedId(id);
        return fetchHalCollection<TeamCoach>(`/teams/${teamId}/trainedBy`, this.authStrategy, "coaches");
    }

    async getTeamMembers(teamId: string): Promise<TeamMember[]> {
        const safeId = getSafeEncodedId(teamId);
        return fetchHalCollection<TeamMember>(
            `/teams/${safeId}/members`,
            this.authStrategy,
            "teamMembers"
        );
    }

    async createTeamMember(data: CreateTeamMemberPayload): Promise<TeamMember> {
        return createHalResource<TeamMember>(
            "/teamMembers",
            {
                name: data.name.trim(),
                birthDate: data.birthDate,
                gender: data.gender,
                role: data.role.trim(),
                team: data.team,
            },
            this.authStrategy,
            "team member"
        );
    }

    async addTeamMember(teamId: string, data: AddMemberPayload): Promise<TeamMember> {
        const safeId = getSafeEncodedId(teamId);
        return this.createTeamMember({
            name: data.name,
            role: data.role,
            birthDate: data.birthDate,
            gender: data.gender,
            team: `/teams/${safeId}`,
        });
    }

    async createCoach(data: CreateCoachPayload): Promise<TeamCoach> {
        return createHalResource<TeamCoach>(
            "/coaches",
            {
                name: data.name.trim(),
                emailAddress: data.emailAddress.trim(),
                phoneNumber: data.phoneNumber.trim(),
            },
            this.authStrategy,
            "coach"
        );
    }

    async getCoachByEmail(emailAddress: string): Promise<TeamCoach | null> {
        const normalizedEmail = emailAddress.trim();

        if (!normalizedEmail) {
            return null;
        }

        try {
            return await fetchHalResource<TeamCoach>(
                `/coaches/search/findByEmailAddress?email=${encodeURIComponent(normalizedEmail)}`,
                this.authStrategy
            );
        } catch (error) {
            if (error instanceof NotFoundError) {
                return null;
            }

            throw error;
        }
    }

    async assignCoach(teamId: string, coachId: number): Promise<void> {
        const authorization = await this.authStrategy.getAuth();

        let response: Response;
        try {
            response = await fetch(`${API_BASE_URL}/teams/assign-coach`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    ...(authorization ? { Authorization: authorization } : {}),
                },
                body: JSON.stringify({
                    teamId,
                    coachId,
                }),
                cache: "no-store",
            });
        } catch (error) {
            if (error instanceof TypeError) {
                throw new NetworkError(undefined, error);
            }

            throw error;
        }

        if (!response.ok) {
            await this.handleAssignCoachError(response);
        }
    }

    private async handleAssignCoachError(response: Response): Promise<never> {
        let errorMessage: string | undefined;

        try {
            const contentType = response.headers.get("content-type");
            if (contentType?.toLowerCase().includes("json")) {
                const body = await response.json();
                errorMessage = body.message || body.error || body.detail;
            }
        } catch {
            errorMessage = undefined;
        }

        switch (response.status) {
            case 400:
                throw new ValidationError(errorMessage);
            case 401:
            case 403:
                throw new AuthenticationError(errorMessage, response.status);
            case 404:
                throw new NotFoundError(errorMessage);
            case 409:
                throw new ConflictError(errorMessage);
            case 500:
            case 502:
            case 503:
            case 504:
                throw new ServerError(errorMessage, response.status);
            default:
                throw new ApiError(
                    errorMessage ?? "Failed to assign coach to team.",
                    response.status,
                    true
                );
        }
    }
    async deleteTeam(id: string): Promise<void> {
        const teamId = getSafeEncodedId(id);
        await deleteHal(`/teams/${teamId}`, this.authStrategy);
    }

    async deleteCoach(id: number): Promise<void> {
        await deleteHal(`/coaches/${id}`, this.authStrategy);
    }

    async removeTeamMember(memberUri: string): Promise<void> {
        await deleteHal(memberUri, this.authStrategy);
    }
}
