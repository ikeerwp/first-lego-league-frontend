import { EditionsService } from "@/api/editionApi";
import ErrorAlert from "@/app/components/error-alert";
import EmptyState from "@/app/components/empty-state";
import { serverAuthProvider } from "@/lib/authProvider";
import { getEncodedResourceId } from "@/lib/halRoute";
import { Edition } from "@/types/edition";
import { Team } from "@/types/team";
import { parseErrorMessage, NotFoundError } from "@/types/errors";
import Link from "next/link";
import { getTeamDisplayName } from "@/lib/teamUtils";

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

export default async function EditionDetailPage(props: Readonly<EditionDetailPageProps>) {
    const { id } = await props.params;
    const service = new EditionsService(serverAuthProvider);

    let currentUser: User | null = null;
    let edition: Edition | null = null;
    let teams: Team[] = [];
    let error: string | null = null;
    let teamsError: string | null = null;

    try {
        edition = await service.getEditionById(id);
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
            teams = await service.getEditionTeams(id);
        } catch (e) {
            console.error("Failed to fetch teams:", e);
            teamsError = parseErrorMessage(e);
        }
    }

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
                                        return (
                                            <li
                                                key={team.uri ?? index}
                                                className="w-full rounded-lg border border-border bg-card p-4 shadow-sm transition hover:bg-secondary/30"
                                            >
                                                {href ? (
                                                    <Link href={href} className="font-medium text-foreground">
                                                        {getTeamDisplayName(team)}
                                                    </Link>
                                                ) : (
                                                    <span className="font-medium text-foreground">
                                                        {getTeamDisplayName(team)}
                                                    </span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
