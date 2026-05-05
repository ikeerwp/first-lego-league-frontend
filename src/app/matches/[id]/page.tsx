import { EditionsService } from "@/api/editionApi";
import { API_BASE_URL } from "@/api/halClient";
import { MatchesService } from "@/api/matchesApi";
import { TeamsService } from "@/api/teamApi";
import { UsersService } from "@/api/userApi";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin, isReferee } from "@/lib/authz";
import { Edition } from "@/types/edition";
import { NotFoundError, parseErrorMessage } from "@/types/errors";
import { Match } from "@/types/match";
import { MatchResult } from "@/types/matchResult";
import { Round } from "@/types/round";
import { Team } from "@/types/team";
import { User } from "@/types/user";
import { InfoRow } from "@/app/components/info-row";

export const dynamic = "force-dynamic";

interface MatchDetailPageProps {
    readonly params: Promise<{ id: string }>;
    readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getMatchTitle(match: Match | null, id: string) {
    if (!match) return `Match ${id}`;

    const parts: string[] = [];
    if (match.round) parts.push(`Round ${match.round}`);
    if (match.competitionTable) parts.push(`Table ${match.competitionTable}`);

    return parts.length ? parts.join(" | ") : `Match ${match.id}`;
}

function getUriLabel(resourceUri?: string, fallbackPrefix = "Item") {
    if (!resourceUri) return fallbackPrefix;

    const decoded = resourceUri.split("/").findLast(Boolean) ?? "";
    try {
        return decoded ? `${fallbackPrefix} ${decodeURIComponent(decoded)}` : fallbackPrefix;
    } catch {
        return decoded ? `${fallbackPrefix} ${decoded}` : fallbackPrefix;
    }
}

function getEditionLabel(edition: Edition | null): string {
    if (!edition) return "Edition unavailable";

    if (edition.year && edition.venueName) return `${edition.year} - ${edition.venueName}`;
    if (edition.year) return String(edition.year);
    if (edition.venueName) return edition.venueName;

    return getUriLabel(edition.link("self")?.href ?? edition.uri, "Edition");
}

function getRoundLabel(round: Round | null, fallback?: string): string {
    if (round?.number !== undefined) return `Round ${round.number}`;

    if (fallback) {
        return /^round\s+/i.test(fallback)
            ? fallback
            : getUriLabel(fallback, "Round");
    }

    return "Round unavailable";
}

export default async function MatchDetailPage(props: Readonly<MatchDetailPageProps>) {
    const { id } = await props.params;

    const service = new MatchesService(serverAuthProvider);
    const teamsService = new TeamsService(serverAuthProvider);
    const editionsService = new EditionsService(serverAuthProvider);

    let match: Match | null = null;
    let teams: Team[] = [];
    let currentUser: User | null = null;

    let matchError: string | null = null;

    let round: Round | null = null;
    let edition: Edition | null = null;

    let matchResults: MatchResult[] = [];

    let teamA: Team | null = null;
    let teamB: Team | null = null;

    try {
        currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
        isAdmin(currentUser) || isReferee(currentUser);
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

        const teamsPromise = teamsService.getTeams().catch(() => []);
        const matchResultsPromise = service.getMatchResults(matchUri).catch(() => []);
        const teamAPromise = service.getMatchTeamA(id).catch(() => null);
        const teamBPromise = service.getMatchTeamB(id).catch(() => null);

        const roundDetailsPromise = service
            .getMatchRound(id)
            .then(async (r) => {
                const editionUri =
                    r.link("edition")?.href ?? (r.uri ? `${r.uri}/edition` : null);

                if (!editionUri) return { round: r, edition: null };

                try {
                    const ed = await editionsService.getEditionByUri(editionUri);
                    return { round: r, edition: ed };
                } catch {
                    return { round: r, edition: null };
                }
            })
            .catch(() => ({ round: null, edition: null }));

        const [loadedTeams, roundDetails, results, a, b] = await Promise.all([
            teamsPromise,
            roundDetailsPromise,
            matchResultsPromise,
            teamAPromise,
            teamBPromise,
        ]);

        teams = loadedTeams;
        matchResults = results;

        teamA = a;
        teamB = b;

        round = roundDetails?.round ?? null;
        edition = roundDetails?.edition ?? null;
    }

    const displayEdition = getEditionLabel(edition);
    const displayRound = getRoundLabel(round, match?.round);
    const displayState =
        matchResults.length > 0 ? "COMPLETED" : (match?.state ?? "UNKNOWN");

    return (
        <PageShell
            eyebrow="Match details"
            title={getMatchTitle(match, id)}
            description={`Status: ${displayState}`}
        >
            {matchError && <ErrorAlert message={matchError} />}

            {!matchError && match && (
                <div className="space-y-8">
                    <section>
                        <h2>Match information</h2>

                        <InfoRow label="Edition" value={displayEdition} />
                        <InfoRow label="Round" value={displayRound} />
                        <InfoRow label="State" value={displayState} />
                    </section>
                </div>
            )}
        </PageShell>
    );
}