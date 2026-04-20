import { MatchesService } from "@/api/matchesApi";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { serverAuthProvider } from "@/lib/authProvider";
import { getEncodedResourceId } from "@/lib/halRoute";
import { formatMatchTime } from "@/lib/matchUtils";
import { NotFoundError, parseErrorMessage } from "@/types/errors";
import { Match } from "@/types/match";
import { Team } from "@/types/team";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface MatchDetailPageProps {
    readonly params: Promise<{ id: string }>;
    readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getMatchTitle(match: Match | null, id: string) {
    if (!match) {
        let decodedId = id;
        try {
            decodedId = decodeURIComponent(id);
        } catch {
            // use raw id if decodeURIComponent fails
        }
        return `Match ${decodedId}`;
    }

    const parts: string[] = [];
    if (match.round) parts.push(`Round ${match.round}`);
    if (match.competitionTable) parts.push(`Table ${match.competitionTable}`);
    return parts.length > 0 ? parts.join(" · ") : `Match ${match.id}`;
}

function InfoRow({ label, value }: Readonly<{ label: string; value: string }>) {
    return (
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <span className="min-w-36 text-sm font-medium text-foreground">{label}</span>
            <span className="text-sm text-muted-foreground">{value}</span>
        </div>
    );
}

function TeamCard({ team, label, yearQuery }: Readonly<{ team: Team; label: string; yearQuery: string }>) {
    const teamId = getEncodedResourceId(team.link("self")?.href ?? team.uri);

    const cardContent = (
        <div
            className={`module-card flex flex-col gap-2 rounded-lg border border-border bg-card p-5 transition-colors${teamId ? " hover:bg-secondary/30" : ""}`}
        >
            <div className="page-eyebrow">{label}</div>
            <p className="list-title">{team.name ?? "Unnamed team"}</p>
            <div className="space-y-1">
                {team.city && <p className="list-support">{team.city}</p>}
                {team.category && (
                    <span className="status-badge inline-block">{team.category}</span>
                )}
            </div>
            {teamId && (
                <p className="mt-1 text-xs font-medium text-accent-foreground underline-offset-2 hover:underline">
                    View team details →
                </p>
            )}
        </div>
    );

    if (teamId) {
        return <Link href={`/teams/${teamId}${yearQuery}`}>{cardContent}</Link>;
    }

    return cardContent;
}

function UnknownTeamCard({ label, name }: Readonly<{ label: string; name?: string }>) {
    return (
        <div className="module-card flex flex-col gap-2 rounded-lg border border-border bg-card p-5">
            <div className="page-eyebrow">{label}</div>
            <p className="list-title">{name ?? "Unknown team"}</p>
        </div>
    );
}

export default async function MatchDetailPage(props: Readonly<MatchDetailPageProps>) {
    const { id } = await props.params;
    const searchParams = await props.searchParams;
    const yearParam = searchParams.year;
    const year = Array.isArray(yearParam) ? yearParam[0] : yearParam;
    const yearQuery = year ? `?year=${year}` : "";
    
    const service = new MatchesService(serverAuthProvider);

    let match: Match | null = null;
    let teams: Team[] = [];
    let matchError: string | null = null;
    let teamsError: string | null = null;

    try {
        match = await service.getMatchById(id);
    } catch (e) {
        console.error("Failed to fetch match:", e);
        matchError =
            e instanceof NotFoundError
                ? "This match does not exist."
                : `Could not load match details. ${parseErrorMessage(e)}`;
    }

    if (match && !matchError) {
        try {
            teams = await service.getMatchTeams(id);
        } catch (e) {
            console.error("Failed to fetch match teams:", e);
            teamsError = `Could not load team information. ${parseErrorMessage(e)}`;
        }
    }

    const teamA = teams.find((t) => t.name === match?.teamA) ?? teams[0] ?? null;
    const teamB = teams.find((t) => t.name === match?.teamB) ?? teams[1] ?? null;

    return (
        <PageShell
            eyebrow="Match details"
            title={getMatchTitle(match, id)}
            description={match?.state ? `Status: ${match.state}` : undefined}
        >
            {matchError && <ErrorAlert message={matchError} />}

            {!matchError && match && (
                <div className="space-y-8">
                    {/* Match info */}
                    <section aria-labelledby="match-info-heading">
                        <div className="mb-4 space-y-1">
                            <div className="page-eyebrow">Schedule</div>
                            <h2 id="match-info-heading" className="section-title">
                                Match information
                            </h2>
                        </div>
                        <div className="rounded-lg border border-border bg-card p-5">
                            <div className="space-y-3">
                                <InfoRow label="Start time" value={formatMatchTime(match.startTime)} />
                                <InfoRow label="End time" value={formatMatchTime(match.endTime)} />
                                {match.round && <InfoRow label="Round" value={match.round} />}
                                {match.competitionTable && (
                                    <InfoRow label="Competition table" value={match.competitionTable} />
                                )}
                                {match.state && <InfoRow label="State" value={match.state} />}
                                {match.referee && <InfoRow label="Referee" value={match.referee} />}
                            </div>
                        </div>
                    </section>

                    {/* Teams */}
                    <section aria-labelledby="teams-heading">
                        <div className="mb-4 space-y-1">
                            <div className="page-eyebrow">Participating teams</div>
                            <h2 id="teams-heading" className="section-title">
                                Teams
                            </h2>
                        </div>

                        {teamsError && <ErrorAlert message={teamsError} />}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {teamA ? (
                                <TeamCard team={teamA} label="Team A" yearQuery={yearQuery} />
                            ) : (
                                <UnknownTeamCard label="Team A" name={match.teamA} />
                            )}
                            {teamB ? (
                                <TeamCard team={teamB} label="Team B" yearQuery={yearQuery} />
                            ) : (
                                <UnknownTeamCard label="Team B" name={match.teamB} />
                            )}
                        </div>
                    </section>
                </div>
            )}
        </PageShell>
    );
}
