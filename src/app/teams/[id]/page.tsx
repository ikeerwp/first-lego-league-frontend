import { AwardsService } from "@/api/awardApi";
import { EditionsService } from "@/api/editionApi";
import { ScientificProjectsService } from "@/api/scientificProjectApi";
import { TeamsService } from "@/api/teamApi";
import { UsersService } from "@/api/userApi";
import EmptyState from "@/app/components/empty-state";
import ErrorAlert from "@/app/components/error-alert";
import { ScientificProjectCardLink } from "@/app/components/scientific-project-card";
import { TeamMembersManager } from "@/app/components/team-member-manager";
import TeamEditSection from "@/app/components/team-edit-section";
import { serverAuthProvider } from "@/lib/authProvider";
import { getAwardWinnerTeamUri, normalizeUri } from "@/lib/awardUtils";
import { NotFoundError, parseErrorMessage } from "@/types/errors";
import { Award } from "@/types/award";
import { ScientificProject } from "@/types/scientificProject";
import { Team, TeamCoach, TeamMember, TeamMemberSnapshot } from "@/types/team";
import { User } from "@/types/user";
import TeamAwardsSection from "./_team-awards-section";

interface TeamDetailPageProps {
    readonly params: Promise<{ id: string }>;
}

function toTeamMemberSnapshot(member: TeamMember): TeamMemberSnapshot {
    return {
        id: member.id,
        name: member.name,
        birthDate: member.birthDate,
        gender: member.gender,
        tShirtSize: member.tShirtSize,
        role: member.role,
        uri: member.uri ?? member.link("self")?.href,
    };
}

function getTeamDisplayName(team: Team | null): string | null {
    if (!team) return null;
    return team.name ?? team.id ?? null;
}

function getTeamUri(team: Team): string | null {
    return team.link("self")?.href ?? team.uri ?? null;
}

function getTeamEditionUri(team: Team): string | null {
    const editionHref = team.link("edition")?.href;
    if (editionHref) {
        return editionHref;
    }

    const edition = Reflect.get(team, "edition");
    return typeof edition === "string" && edition.length > 0 ? edition : null;
}

export default async function TeamDetailPage(props: Readonly<TeamDetailPageProps>) {
    const { id } = await props.params;

    const service = new TeamsService(serverAuthProvider);
    const scientificProjectsService = new ScientificProjectsService(serverAuthProvider);
    const userService = new UsersService(serverAuthProvider);
    const awardsService = new AwardsService(serverAuthProvider);
    const editionsService = new EditionsService(serverAuthProvider);

    let currentUser: User | null = null;
    let team: Team | null = null;
    let coaches: TeamCoach[] = [];
    let members: TeamMember[] = [];
    let scientificProjects: ScientificProject[] = [];
    let awards: Award[] = [];
    let teamEditionUri: string | null = null;

    let error: string | null = null;
    let membersError: string | null = null;
    let scientificProjectsError: string | null = null;
    let awardsError: string | null = null;

    try {
        currentUser = await userService.getCurrentUser().catch(() => null);
        team = await service.getTeamById(id);
    } catch (e) {
        if (e instanceof NotFoundError) {
            return <EmptyState title="Not found" description="Team does not exist" />;
        }
        error = parseErrorMessage(e);
    }

    const isAdminUser = !!currentUser?.authorities?.some(
        (authority) => authority.authority === "ROLE_ADMIN"
    );

    const teamDisplayName = getTeamDisplayName(team);

    if (team && !error) {
        const teamUri = getTeamUri(team);
        const rawTeamEditionUri = getTeamEditionUri(team);

        if (rawTeamEditionUri) {
            try {
                const resolvedEdition = await editionsService.getEditionByUri(rawTeamEditionUri);
                teamEditionUri = resolvedEdition.link("self")?.href ?? resolvedEdition.uri ?? rawTeamEditionUri;
            } catch (e) {
                console.error("Error resolving team edition:", e);
                teamEditionUri = rawTeamEditionUri;
            }
        }

        const [membersResult, scientificProjectsResult] = await Promise.allSettled([
            Promise.all([
                service.getTeamCoach(id),
                service.getTeamMembers(id),
            ]),
            teamDisplayName
                ? scientificProjectsService.getScientificProjectsByTeamName(teamDisplayName)
                : Promise.resolve([] as ScientificProject[])
        ]);

        if (membersResult.status === "fulfilled") {
            const [coachesData, membersData] = membersResult.value;
            coaches = coachesData ?? [];
            members = membersData ?? [];
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

        if (teamEditionUri && teamUri) {
            try {
                const editionAwards = await awardsService.getAwardsOfEdition(teamEditionUri);
                awards = editionAwards.filter((award) => normalizeUri(getAwardWinnerTeamUri(award)) === normalizeUri(teamUri));
            } catch (e) {
                console.error("Error loading awards:", e);
                awardsError = parseErrorMessage(e);
            }
        }

    }

    if (error) return <ErrorAlert message={error} />;
    if (!team) return <EmptyState title="Not found" description="Team does not exist" />;

    const currentUserEmail = currentUser?.email?.trim().toLowerCase();

    const isCoach =
        !!currentUserEmail &&
        coaches.some(
            (coach) =>
                coach.emailAddress?.trim().toLowerCase() === currentUserEmail
        );

    // ✅ múltiples coaches
    const coachName =
        coaches.length > 0
            ? coaches
                  .map(c => c.name ?? c.emailAddress ?? "Unnamed coach")
                  .join(", ")
            : "No coach assigned";

    const initialMembers = members.map(toTeamMemberSnapshot);

    const membersKey = initialMembers
        .map(m => m.uri ?? String(m.id ?? m.name ?? ""))
        .join("|");

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-3xl px-4 py-10">
                <div className="w-full rounded-lg border border-border bg-card p-6 shadow-sm">

                    <h1 className="mb-2 text-2xl font-semibold text-foreground">
                        {teamDisplayName ?? "Unnamed team"}
                    </h1>

                    <div className="mb-6 space-y-1 text-sm text-muted-foreground">
                        {team.city && (
                            <p><strong>City:</strong> {team.city}</p>
                        )}
                        <p><strong>Coach:</strong> {coachName}</p>
                    </div>

                    {isAdminUser && (
                        <div className="mb-6 rounded-md border border-border p-4">
                            <TeamEditSection
                                team={{
                                    id: team.id!,
                                    name: team.name!,
                                    city: team.city ?? undefined,
                                    educationalCenter: team.educationalCenter ?? undefined,
                                    category: team.category ?? undefined,
                                    foundationYear: team.foundationYear ?? undefined,
                                    inscriptionDate: team.inscriptionDate ?? undefined,
                                }}
                            />
                        </div>
                    )}

                    <TeamAwardsSection
                        teamId={id}
                        teamName={teamDisplayName ?? team.id ?? "Team"}
                        awards={awards}
                        awardsError={awardsError}
                        isAdminUser={isAdminUser}
                        teamEditionUri={teamEditionUri}
                    />

                    <h2 className="mt-8 mb-4 text-xl font-semibold">
                        Team Members
                    </h2>

                    {!membersError && (
                        <TeamMembersManager
                            key={`${id}-${membersKey}`}
                            teamId={id}
                            initialMembers={initialMembers}
                            isCoach={isCoach}
                            isAdmin={isAdminUser}
                        />
                    )}

                    {membersError && (
                        <ErrorAlert message={membersError} />
                    )}

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
                                        <ScientificProjectCardLink
                                            project={project}
                                            index={index}
                                            variant="stacked"
                                        />
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
