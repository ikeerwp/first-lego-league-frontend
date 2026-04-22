import { TeamsService } from "@/api/teamApi";
import { ScientificProjectsService } from "@/api/scientificProjectApi";
import { UsersService } from "@/api/userApi";
import ErrorAlert from "@/app/components/error-alert";
import EmptyState from "@/app/components/empty-state";
import { ScientificProjectCardLink } from "@/app/components/scientific-project-card";
import { serverAuthProvider } from "@/lib/authProvider";
import { ScientificProject } from "@/types/scientificProject";
import { Team } from "@/types/team";
import { User } from "@/types/user";
import { parseErrorMessage, NotFoundError } from "@/types/errors";
import { TeamMembersManager } from "@/app/components/team-member-manager";

interface TeamDetailPageProps {
    readonly params: Promise<{ id: string }>;
}

interface RawMember {
    id?: string | number;
    name?: string;
    username?: string;
    role?: string;
    uri?: string;
    _links?: {
        self: { href: string };
    };
}

interface HalMemberResponse {
    _embedded?: {
        teamMembers: RawMember[];
    };
}

function getTeamDisplayName(team: Team | null): string | null {
    if (!team) {
        return null;
    }

    return team.name ?? team.id ?? null;
}

function extractTeamMembers(data: unknown): User[] {
    const isHalResponse = (obj: unknown): obj is HalMemberResponse => {
        return !!obj && typeof obj === 'object' && '_embedded' in obj;
    };

    const rawMembers: RawMember[] = Array.isArray(data)
        ? data as RawMember[]
        : isHalResponse(data)
            ? data._embedded?.teamMembers ?? []
            : [];

    return rawMembers.map((m, index) => {
        const extractedId = m._links?.self?.href?.split('/').pop() || m.uri?.split('/').pop();

        return {
            id: String(m.id ?? extractedId ?? `member-${index}`),
            name: String(m.name ?? m.username ?? "Unnamed member"),
            role: String(m.role ?? "Member"),
            uri: String(m._links?.self?.href || m.uri || "")
        } as unknown as User;
    });
}

export default async function TeamDetailPage(props: Readonly<TeamDetailPageProps>) {
    const { id } = await props.params;

    const service = new TeamsService(serverAuthProvider);
    const scientificProjectsService = new ScientificProjectsService(serverAuthProvider);
    const userService = new UsersService(serverAuthProvider);

    let currentUser: User | null = null;
    let team: Team | null = null;
    let coaches: User[] = [];
    let members: User[] = [];
    let scientificProjects: ScientificProject[] = [];
    let error: string | null = null;
    let membersError: string | null = null;
    let scientificProjectsError: string | null = null;

    try {
        currentUser = await userService.getCurrentUser().catch(() => null);
        team = await service.getTeamById(id);
    } catch (e) {
        if (e instanceof NotFoundError) {
            return <EmptyState title="Not found" description="Team does not exist" />;
        }
        error = parseErrorMessage(e);
    }

    const teamDisplayName = getTeamDisplayName(team);

    if (team && !error) {
        const [membersResult, scientificProjectsResult] = await Promise.allSettled([
            Promise.all([service.getTeamCoach(id), service.getTeamMembers(id)]),
            teamDisplayName
                ? scientificProjectsService.getScientificProjectsByTeamName(teamDisplayName)
                : Promise.resolve([] as ScientificProject[])
        ]);

        if (membersResult.status === "fulfilled") {
            const [coachesData, membersData] = membersResult.value;
            coaches = coachesData ?? [];
            members = extractTeamMembers(membersData);
        } else {
            console.error("Error loading members:", membersResult.reason);
            membersError = parseErrorMessage(membersResult.reason);
        }

        if (scientificProjectsResult.status === "fulfilled") {
            scientificProjects = scientificProjectsResult.value;
        } else {
            console.error("Error loading scientific projects:", scientificProjectsResult.reason);
            scientificProjectsError = parseErrorMessage(scientificProjectsResult.reason);
        }
    }

    if (error) return <ErrorAlert message={error} />;
    if (!team) return <EmptyState title="Not found" description="Team does not exist" />;

    const isAdmin = !!currentUser?.authorities?.some(
        (authority) => authority.authority === "ROLE_ADMIN"
    );

    const isCoach = !!currentUser && coaches.some(
        (c) => c.username === currentUser?.username || c.email === currentUser?.email
    );

    const coachName = coaches.length > 0
        ? (coaches[0].username ?? coaches[0].email ?? "Unnamed coach")
        : "No coach assigned";

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-3xl px-4 py-10">
                <div className="w-full rounded-lg border bg-white p-6 shadow-sm dark:bg-black">
                    <h1 className="mb-2 text-2xl font-semibold">{teamDisplayName ?? "Unnamed team"}</h1>

                    <div className="mb-6 space-y-1 text-sm text-muted-foreground">
                        {team.city && <p><strong>City:</strong> {team.city}</p>}
                        <p><strong>Coach:</strong> {coachName}</p>
                    </div>

                    <h2 className="mt-8 mb-4 text-xl font-semibold">Team Members</h2>

                    {!membersError && (
                        <TeamMembersManager
                            key={`${id}-${members.length}`}
                            teamId={id}
                            initialMembers={members}
                            isCoach={isCoach}
                            isAdmin={isAdmin}
                        />
                    )}
                    {membersError && <ErrorAlert message={membersError} />}

                    <section aria-labelledby="team-projects-heading">
                        <h2 id="team-projects-heading" className="mt-8 mb-4 text-xl font-semibold">
                            Scientific Projects
                        </h2>

                        {scientificProjectsError && (
                            <ErrorAlert message={`Could not load scientific projects. ${scientificProjectsError}`} />
                        )}

                        {!scientificProjectsError && scientificProjects.length === 0 && (
                            <EmptyState
                                title="No scientific projects yet"
                                description="This team has not submitted any scientific projects."
                                className="py-8"
                            />
                        )}

                        {!scientificProjectsError && scientificProjects.length > 0 && (
                            <ul className="space-y-3">
                                {scientificProjects.map((project, index) => (
                                    <li key={project.uri ?? project.link("self")?.href ?? index}>
                                        <ScientificProjectCardLink project={project} index={index} variant="stacked" />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
