import { AwardsService } from "@/api/awardApi";
import { EditionsService } from "@/api/editionApi";
import { MediaService } from "@/api/mediaApi";
import ErrorAlert from "@/app/components/error-alert";
import EmptyState from "@/app/components/empty-state";
import { MediaItem } from "@/app/components/media-gallery";
import { MediaSection } from "@/app/components/media-section";
import { DEMO_MEDIA } from "@/lib/demo-media";
import { serverAuthProvider } from "@/lib/authProvider";
import { getEncodedResourceId } from "@/lib/halRoute";
import { Award } from "@/types/award";
import { Edition } from "@/types/edition";
import { MediaContent } from "@/types/mediaContent";
import { Team } from "@/types/team";
import { parseErrorMessage, NotFoundError } from "@/types/errors";
import Link from "next/link";
import { buttonVariants } from "@/app/components/button";
import { isAdmin } from "@/lib/authz";
import { User } from "@/types/user";
import { UsersService } from "@/api/userApi";

interface EditionDetailPageProps {
    readonly params: Promise<{ id: string }>;
}

function getTeamHref(team: Team): string | null {
    const teamId = getEncodedResourceId(team.uri);
    return teamId ? `/teams/${teamId}` : null;
}

function getEditionTitle(edition: Edition | null, id: string) {
    if (edition?.year) {
        return `${edition.year}`;
    }

    return `Edition ${id}`;
}

function getAwardLabel(award: Award, fallbackIndex: number): string {
    return award.name ?? award.title ?? award.category ?? `Award ${fallbackIndex + 1}`;
}

function getAwardWinnerTeamUri(award: Award): string | null {
    const winnerTeamFromLink = award.link("winnerTeam")?.href;
    if (winnerTeamFromLink) {
        return winnerTeamFromLink;
    }

    if (typeof award.winnerTeam === "string" && award.winnerTeam.length > 0) {
        return award.winnerTeam;
    }

    const winnerFromLink = award.link("winner")?.href;
    if (winnerFromLink) {
        return winnerFromLink;
    }

    const winner = Reflect.get(award, "winner");
    if (typeof winner === "string" && winner.length > 0) {
        return winner;
    }

    return null;
}

function normalizeUri(resourceUri: string | null | undefined): string | null {
    if (!resourceUri) {
        return null;
    }

    const sanitizedUri = resourceUri.split(/[?#]/, 1)[0] ?? null;

    if (!sanitizedUri) {
        return null;
    }

    return sanitizedUri.replace(/^https?:\/\/[^/]+/i, "");
}

function getAwardsByTeamUri(awards: Award[]): Map<string, Award[]> {
    const awardsByTeamUri = new Map<string, Award[]>();

    for (const award of awards) {
        const teamUri = normalizeUri(getAwardWinnerTeamUri(award));
        if (!teamUri) {
            continue;
        }

        const existingAwards = awardsByTeamUri.get(teamUri) ?? [];
        existingAwards.push(award);
        awardsByTeamUri.set(teamUri, existingAwards);
    }

    return awardsByTeamUri;
}

export default async function EditionDetailPage(props: Readonly<EditionDetailPageProps>) {
    const { id } = await props.params;
    const editionsService = new EditionsService(serverAuthProvider);
    const awardsService = new AwardsService(serverAuthProvider);
    const mediaService = new MediaService(serverAuthProvider);

    let currentUser: User | null = null;
    let edition: Edition | null = null;
    let teams: Team[] = [];
    let awards: Award[] = [];
    let mediaContents: MediaContent[] = [];
    let error: string | null = null;
    let teamsError: string | null = null;
    let awardsError: string | null = null;
    let mediaError: string | null = null;

    try {
        edition = await editionsService.getEditionById(id);
    } catch (e) {
        console.error("Failed to fetch edition:", e);
        error = e instanceof NotFoundError
            ? "This edition does not exist."
            : parseErrorMessage(e);
    }

    try {
        currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
    } catch (e) {
        console.error("Failed to fetch current user:", e);
    }

    if (edition && !error) {
        try {
            teams = await editionsService.getEditionTeams(id);
        } catch (e) {
            console.error("Failed to fetch teams:", e);
            teamsError = parseErrorMessage(e);
        }

        if (edition.uri) {
            try {
                awards = await awardsService.getAwardsOfEdition(edition.uri);
            } catch (e) {
                console.error("Failed to fetch awards:", e);
                awardsError = parseErrorMessage(e);
            }

            try {
                mediaContents = await mediaService.getMediaByEdition(edition.uri);
            } catch (e) {
                console.error("Failed to fetch media:", e);
                mediaError = parseErrorMessage(e);
            }
        }
    }

    const awardsByTeamUri = getAwardsByTeamUri(awards);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-3xl px-4 py-10">
                <div className="w-full rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="mb-2 text-2xl font-semibold text-foreground">{getEditionTitle(edition, id)}</h1>
                            {edition?.venueName && (
                                <p className="text-sm text-muted-foreground">{edition.venueName}</p>
                            )}
                            {edition?.description && (
                                <p className="mt-2 text-sm text-muted-foreground">{edition.description}</p>
                            )}
                        </div>

                        {currentUser && isAdmin(currentUser) && (
                            <Link href={`/editions/${id}/edit`} className={buttonVariants({ variant: "default", size: "sm" })}>
                                ✏️ edit
                            </Link>
                        )}
                    </div>

                    {error && (
                        <div className="mt-6">
                            <ErrorAlert message={error} />
                        </div>
                    )}

                    {!error && (
                        <>
                            <h2 className="mt-8 mb-4 text-xl font-semibold text-foreground">Participating Teams</h2>

                            {teamsError && <ErrorAlert message={teamsError} />}

                            {!teamsError && teams.length === 0 && (
                                <EmptyState
                                    title="No teams found"
                                    description="No teams are registered for this edition yet."
                                />
                            )}

                            {!teamsError && teams.length > 0 && (
                                <ul className="w-full space-y-3">
                                    {teams.map((team, index) => {
                                        const href = getTeamHref(team);
                                        const teamAwards = awardsByTeamUri.get(normalizeUri(team.uri) ?? "") ?? [];
                                        return (
                                            <li
                                                key={team.uri ?? index}
                                                className="w-full rounded-lg border border-border bg-card p-4 shadow-sm transition hover:bg-secondary/30"
                                            >
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {href ? (
                                                        <Link href={href} className="font-medium text-foreground">
                                                            {team.name ?? team.id ?? `Team ${index + 1}`}
                                                        </Link>
                                                    ) : (
                                                        <span className="font-medium text-foreground">
                                                            {team.name ?? team.id ?? `Team ${index + 1}`}
                                                        </span>
                                                    )}

                                                    {teamAwards.map((award, awardIndex) => (
                                                        <span
                                                            key={award.uri ?? `${team.uri ?? index}-${awardIndex}`}
                                                            className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900"
                                                        >
                                                            {getAwardLabel(award, awardIndex)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            {!teamsError && teams.length > 0 && awardsError && (
                                <div className="mt-6">
                                    <ErrorAlert message={`Could not load awards. ${awardsError}`} />
                                </div>
                            )}

                            {!teamsError && teams.length > 0 && !awardsError && awards.length === 0 && (
                                <div className="mt-6">
                                    <EmptyState
                                        title="No awards yet"
                                        description="Awards for this edition have not been published yet."
                                    />
                                </div>
                            )}

                            {mediaError && <ErrorAlert message={mediaError} />}

                            {!mediaError && (
                                <MediaSection mediaContents={(mediaContents as MediaItem[]).length > 0 ? mediaContents as MediaItem[] : DEMO_MEDIA} />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
