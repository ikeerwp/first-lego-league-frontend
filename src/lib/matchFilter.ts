import type { Match } from "@/types/match";

export function normalizeTeamSearch(value: string | null | undefined) {
    return value?.trim().toLocaleLowerCase() ?? "";
}

export function matchParticipatesTeam(
    match: Match,
    labels: Record<string, string>,
    query: string
) {
    const normalizedQuery = normalizeTeamSearch(query);
    if (!normalizedQuery) return true;

    const key = match.link("self")?.href ?? match.uri;
    const label = labels[key] ?? `${match.teamA ?? ""} ${match.teamB ?? ""}`;

    return normalizeTeamSearch(label).includes(normalizedQuery);
}

export function filterMatchesByTeam(
    matches: Match[],
    labels: Record<string, string>,
    query: string
) {
    const normalizedQuery = normalizeTeamSearch(query);
    if (!normalizedQuery) return matches;

    return matches.filter((match) => matchParticipatesTeam(match, labels, normalizedQuery));
}
