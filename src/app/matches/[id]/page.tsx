import { EditionsService } from "@/api/editionApi";
import { API_BASE_URL } from "@/api/halClient";
import { MatchesService } from "@/api/matchesApi";
import { TeamsService } from "@/api/teamApi";
import { UsersService } from "@/api/userApi";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin, isReferee } from "@/lib/authz";
import { getTeamDisplayName } from "@/lib/teamUtils";
import { getEncodedResourceId } from "@/lib/halRoute";
import { formatMatchTime } from "@/lib/matchUtils";
import { Edition } from "@/types/edition";
import { NotFoundError, parseErrorMessage } from "@/types/errors";
import { Match } from "@/types/match";
import { MatchResult } from "@/types/matchResult";
import { Round } from "@/types/round";
import { Team } from "@/types/team";
import { User } from "@/types/user";
import Link from "next/link";
import MatchDeleteSection from "./match-delete-section";
import RecordResultForm from "./record-result-form";
import { InfoRow } from '@/app/components/info-row';

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
        } catch {}
        return `Match ${decodedId}`;
    }

    const parts: string[] = [];
    if (match.round) parts.push(`Round ${match.round}`);
    if (match.competitionTable) parts.push(`Table ${match.competitionTable}`);
    return parts.length > 0 ? parts.join(" | ") : `Match ${match.id}`;
}

function getUriLabel(resourceUri?: string, fallbackPrefix: string = "Item") {
    const uri = resourceUri ?? "";
    let decodedId = uri.split("/").findLast(Boolean) ?? "";

    try {
        decodedId = decodeURIComponent(decodedId);
    } catch {}

    return decodedId ? `${fallbackPrefix} ${decodedId}` : fallbackPrefix;
}

function getEditionLabel(edition: Edition | null) {
    if (!edition) return "Edition unavailable";

    if (edition.year && edition.venueName) return `${edition.year} - ${edition.venueName}`;
    if (edition.year) return String(edition.year);
    if (edition.venueName) return edition.venueName;

    return getUriLabel(edition.link("self")?.href ?? edition.uri, "Edition");
}

function getRoundLabel(round: Round | null, fallbackRound?: string) {
    if (round?.number !== undefined) return `Round ${round.number}`;

    if (fallbackRound) {
        return /^round\s+/i.test(fallbackRound)
            ? fallbackRound
            : getUriLabel(fallbackRound, "Round");
    }

    return "Round unavailable";
}

function TeamCard({ team, label, yearQuery }: Readonly<{ team: Team; label: string; yearQuery: string }>) {
    const teamId = getEncodedResourceId(team.uri ?? team.link("self")?.href);

    const cardContent = (
        <div className={`module-card flex flex-col gap-2 rounded-lg border border-border bg-card p-5 ${teamId ? "hover:bg-secondary/30" : ""}`}>
            <div className="page-eyebrow">{label}</div>
            <p className="list-title">{getTeamDisplayName(team)}</p>
            <div className="space-y-1">
                {team.city && <p className="list-support">{team.city}</p>}
                {team.category && <span className="status-badge inline-block">{team.category}</span>}
            </div>
            {teamId && (
                <p className="mt-1 text-xs font-medium underline">
                    View team details →
                </p>
            )}
        </div>
    );

    if (teamId) return <Link href={`/teams/${teamId}${yearQuery}`}>{cardContent}</Link>;
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
    let currentUser: User | null = null;
    let matchError: string | null = null;
    let teamsError: string | null = null;
    let isAuthorized = false;
    let formTeamA: Team | null = null;
    let formTeamB: Team | null = null;
    let round: Round | null = null;
    let edition: Edition | null = null;
    let matchResults: MatchResult[] = [];

    let teamAId = "";
    let teamBId = "";
    let teamADisplayName = "Team A";
    let teamBDisplayName = "Team B";

    try {
        currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
        isAuthorized = isAdmin(currentUser) || isReferee(currentUser);
    } catch {}

    try {
        match = await service.getMatchById(id);
    } catch (e) {
        matchError =
            e instanceof NotFoundError
                ? "This match does not exist."
                : parseErrorMessage(e);
    }

    if (match && !matchError) {
        const matchUri = `${API_BASE_URL}/matches/${decodeURIComponent(id)}`;
        const teamsService = new TeamsService(serverAuthProvider);
        const editionsService = new EditionsService(serverAuthProvider);

        const roundDetailsPromise = service
            .getMatchRound(id)
            .then((resolvedRound) => {
                const editionUri =
                    resolvedRound.link("edition")?.href ??
                    (resolvedRound.uri ? `${resolvedRound.uri}/edition` : null);

                if (!editionUri) return { round: resolvedRound, edition: null };

                return editionsService
                    .getEditionByUri(editionUri)
                    .then((resolvedEdition) => ({
                        round: resolvedRound,
                        edition: resolvedEdition,
                    }))
                    .catch(() => ({ round: resolvedRound, edition: null }));
            })
            .catch(() => ({ round: null, edition: null }));

        const [, roundDetails] = await Promise.all([
            teamsService.getTeams().then((t) => (teams = t)),
            roundDetailsPromise,
            service.getMatchTeamA(id).then((t) => {
                formTeamA = t;
                teamADisplayName = t.name ?? t.id ?? "Team A";
                teamAId = decodeURIComponent(t.link("self")?.href?.split("/").pop() ?? "");
            }).catch(() => null),
            service.getMatchTeamB(id).then((t) => {
                formTeamB = t;
                teamBDisplayName = t.name ?? t.id ?? "Team B";
                teamBId = decodeURIComponent(t.link("self")?.href?.split("/").pop() ?? "");
            }).catch(() => null),
            service.getMatchResults(matchUri).then((r) => {
                matchResults = r;
            }).catch(() => null),
        ]);

        round = roundDetails?.round ?? null;
        edition = roundDetails?.edition ?? null;
    }

    const resolveTeam = (rel: "teamA" | "teamB", fallbackName?: string) => {
        if (!match) return null;

        const halLink = match.link(rel)?.href;
        const targetId = getEncodedResourceId(halLink);

        if (targetId) {
            const found = teams.find(
                (t) => getEncodedResourceId(t.link("self")?.href ?? t.uri) === targetId
            );
            if (found) return found;
        }

        return teams.find((t) => t.name === fallbackName) ?? null;
    };

    const teamA = resolveTeam("teamA", match?.teamA);
    const teamB = resolveTeam("teamB", match?.teamB);

    const displayTeamA = teamA ?? formTeamA;
    const displayTeamB = teamB ?? formTeamB;

    const displayEdition = getEditionLabel(edition);
    const displayRound = getRoundLabel(round, (match as any)?.round);

    const displayState = matchResults.length > 0 ? "COMPLETED" : match?.state;

    return (
        <PageShell
            eyebrow="Match details"
            title={getMatchTitle(match, id)}
            description={displayState ? `Status: ${displayState}` : undefined}
        >
            {matchError && <ErrorAlert message={matchError} />}

            {!matchError && match && (
                <div className="space-y-8">
                    <section>
                        <h2>Match information</h2>
                        <InfoRow label="Edition" value={displayEdition} />
                        <InfoRow label="Round" value={displayRound} />
                    </section>

                    <section>
                        <h2>Teams</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {displayTeamA ? (
                                <TeamCard team={displayTeamA} label="Team A" yearQuery={yearQuery} />
                            ) : (
                                <UnknownTeamCard label="Team A" name={match.teamA} />
                            )}

                            {displayTeamB ? (
                                <TeamCard team={displayTeamB} label="Team B" yearQuery={yearQuery} />
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