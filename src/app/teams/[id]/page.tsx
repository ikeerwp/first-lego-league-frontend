import { AwardsService } from "@/api/awardApi";
import { EditionsService } from "@/api/editionApi";
import { ScientificProjectsService } from "@/api/scientificProjectApi";
import { TeamsService } from "@/api/teamApi";
import { UsersService } from "@/api/userApi";
import { MatchesService } from "@/api/matchesApi";
import { EditionsService } from "@/api/editionApi";
import { AwardsService } from "@/api/awardApi";
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
import { Match } from "@/types/match";
import { Award } from "@/types/award";
import TournamentItinerary, { ScheduleItem } from "./tournament-itinerary";
import AwardsSection from "./_awards-section";
import TeamShareButton from "./team-share-button";

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

async function fetchMatchLink<T>(m: Match, rel: string, fetcher: () => Promise<T>): Promise<T | null> {
    if (!m.link(rel)) return null;
    return fetcher().catch(() => null);
}

function getOpponentName(tA: Team | null, tB: Team | null, targetId: string): string | undefined {
    const idA = tA?.id ? String(tA.id) : undefined;
    const idB = tB?.id ? String(tB.id) : undefined;
    
    if (idA === targetId) return tB?.name ?? tB?.id ?? "Unknown Team";
    if (idB === targetId) return tA?.name ?? tA?.id ?? "Unknown Team";
    return undefined;
}

async function resolveMatchForTeam(m: Match, targetId: string, matchesService: MatchesService) {
    const matchIdStr = m.uri ? m.uri.split("/").pop() : String(m.id);
    if (!matchIdStr) return { m, hasTeam: false, table: "Unknown" };
    
    try {
        const [tA, tB, compTable, matchRound] = await Promise.all([
            fetchMatchLink(m, "teamA", () => matchesService.getMatchTeamA(matchIdStr)),
            fetchMatchLink(m, "teamB", () => matchesService.getMatchTeamB(matchIdStr)),
            fetchMatchLink(m, "competitionTable", () => matchesService.getMatchCompetitionTable(matchIdStr)),
            fetchMatchLink(m, "round", () => matchesService.getMatchRound(matchIdStr))
        ]);
        
        const opponent = getOpponentName(tA, tB, targetId);
        const hasTeam = opponent !== undefined;
        
        const tableId = compTable?.uri ? compTable.uri.split("/").pop() : "Unknown";
        let roundStr: string | undefined;
        if (matchRound) {
            roundStr = matchRound.number === undefined ? undefined : `Round ${matchRound.number}`;
        }
        
        return { m, hasTeam, table: tableId ?? "Unknown", opponent, round: roundStr };
    } catch {
        return { m, hasTeam: false, table: "Unknown" };
    }
}

export default async function TeamDetailPage(props: Readonly<TeamDetailPageProps>) {
    const { id } = await props.params;

    const service = new TeamsService(serverAuthProvider);
    const scientificProjectsService = new ScientificProjectsService(serverAuthProvider);
    const userService = new UsersService(serverAuthProvider);
    const matchesService = new MatchesService(serverAuthProvider);
    const editionsService = new EditionsService(serverAuthProvider);
    const awardsService = new AwardsService(serverAuthProvider);
    const editionsService = new EditionsService(serverAuthProvider);

    let currentUser: User | null = null;
    let team: Team | null = null;
    let editionYearStr: string | undefined;
    let coaches: TeamCoach[] = [];
    let members: TeamMember[] = [];
    let scientificProjects: ScientificProject[] = [];
    let teamMatchesData: { match: Match; table: string; opponent?: string; round?: string }[] = [];
    let awards: Award[] = [];

    let error: string | null = null;
    let membersError: string | null = null;
    let scientificProjectsError: string | null = null;
    let awardsError: string | null = null;
    const matchesError: string | null = null;

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
    const teamUri = team?.link("self")?.href ?? `/teams/${id}`;

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
                : Promise.resolve([] as ScientificProject[]),
            matchesService.getMatches(),
            editionUri ? editionsService.getEditionByUri(editionUri).catch(() => null) : Promise.resolve(null),
            teamUri ? awardsService.getAwardsOfTeam(teamUri) : Promise.resolve([] as Award[])
        ]);

        if (editionResult.status === "fulfilled" && editionResult.value) {
            editionYearStr = String(editionResult.value.year);
        }

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

        if (awardsResult.status === "fulfilled") {
            awards = awardsResult.value;
        } else {
            console.error("Error loading awards:", awardsResult.reason);
            awardsError = parseErrorMessage(awardsResult.reason);
        }

        if (matchesResult.status === "fulfilled") {
            const allMatches = matchesResult.value;
            
            const resolvedMatches = await Promise.all(
                allMatches.map((m) => resolveMatchForTeam(m, String(id), matchesService))
            );
            
            teamMatchesData = resolvedMatches.filter(r => r.hasTeam).map(r => ({
                match: r.m,
                table: r.table,
                opponent: r.opponent,
                round: r.round
            }));
        } else {
            scientificProjectsError = parseErrorMessage(matchesResult.reason);
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

    const coachName =
        coaches.length > 0
            ? coaches
                .map((coach) => coach.name ?? coach.emailAddress ?? "Unnamed coach")
                .join(", ")
            : "No coach assigned";

    const initialMembers = members.map(toTeamMemberSnapshot);

    const membersKey = initialMembers
        .map((member) => member.uri ?? String(member.id ?? member.name ?? ""))
        .join("|");

    const schedule: ScheduleItem[] = [];

    teamMatchesData.forEach(({ match: m, table, opponent, round }, index) => {
        if (m.startTime) {
            const isCompleted = m.state === "COMPLETED" || m.state === "FINISHED";
            const matchId = m.uri ? m.uri.split('/').pop() : (m.id ?? index);
            schedule.push({
                id: `match-${matchId}`,
                startTime: m.startTime,
                endTime: m.endTime,
                eventType: "Robot Game",
                location: `Table ${table}`,
                status: isCompleted ? "Completed" : "Pending",
                opponent: opponent,
                round: round,
            });
        }
    });

    scientificProjects.forEach((sp, index) => {
        if (sp.startTime) {
            const spId = sp.uri ? sp.uri.split("/").pop() : `unknown-${index}`;
            schedule.push({
                id: `sp-${spId}`,
                startTime: sp.startTime,
                eventType: "Scientific Project",
                location: sp.room ? `Room ${sp.room}` : "Unknown Room",
                status: sp.score === undefined ? "Pending" : "Completed",
            });
        }
    });

    schedule.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-3xl px-4 py-10">
                <div className="w-full rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <h1 className="text-2xl font-semibold text-foreground">
                            {teamDisplayName ?? "Unnamed team"}
                        </h1>

                        <TeamShareButton teamName={teamDisplayName ?? "Unnamed team"} />
                    </div>

                    <div className="mb-6 space-y-1 text-sm text-muted-foreground">
                        {team.city && (
                            <p>
                                <strong>City:</strong> {team.city}
                            </p>
                        )}
                        <p>
                            <strong>Coach:</strong> {coachName}
                        </p>
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

                    {membersError && <ErrorAlert message={membersError} />}

                    <section aria-labelledby="team-projects-heading">
                        <h2
                            id="team-projects-heading"
                            className="mt-8 mb-4 text-xl font-semibold"
                        >
                            Scientific Projects
                        </h2>

                        {scientificProjectsError && (
                            <ErrorAlert
                                message={`Could not load scientific projects. ${scientificProjectsError}`}
                            />
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

                    <section aria-labelledby="tournament-itinerary-heading" className="mt-8">
                        <h2 id="tournament-itinerary-heading" className="mb-4 text-xl font-semibold print:hidden">
                            Tournament Itinerary
                        </h2>
                        {matchesError && (<ErrorAlert message={`Could not load matches. ${matchesError}`} />)}
                        <TournamentItinerary
                            teamName={teamDisplayName ?? "Team"}
                            editionYear={editionYearStr}
                            schedule={schedule}
                        />
                    </section>

                    {awardsError && (
                        <ErrorAlert message={`Could not load awards. ${awardsError}`} />
                    )}
                    
                    {!awardsError && (
                        <AwardsSection 
                            teamId={id} 
                            awards={awards.map(a => ({
                                uri: a.uri ?? a.link("self")?.href,
                                name: a.name,
                                title: a.title,
                                category: a.category,
                                description: (a as { description?: string }).description
                            }))} 
                            isAdmin={isAdmin} 
                        />
                    )}

                </div>
            </div>
        </div>
    );
}
