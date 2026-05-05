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

        const [, roundDetails] = await Promise.all([
            teamsService.getTeams().then((t) => (teams = t)),

            roundDetailsPromise,

            service.getMatchTeamA(id).then((t) => {
                formTeamA = t;
                teamADisplayName = t.name ?? "Team A";
                teamAId = decodeURIComponent(t.link("self")?.href?.split("/").pop() ?? "");
            }).catch(() => null),

            service.getMatchTeamB(id).then((t) => {
                formTeamB = t;
                teamBDisplayName = t.name ?? "Team B";
                teamBId = decodeURIComponent(t.link("self")?.href?.split("/").pop() ?? "");
            }).catch(() => null),

            service.getMatchResults(matchUri).then((r) => {
                matchResults = r;
            }).catch(() => []),
        ]);

        round = roundDetails?.round ?? null;
        edition = roundDetails?.edition ?? null;
    }

    const displayEdition: string = getEditionLabel(edition);
    const displayRound: string = getRoundLabel(round, match?.round);
    const displayState: string = matchResults.length > 0 ? "COMPLETED" : (match?.state ?? "UNKNOWN");

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