import { EditionsService } from "@/api/editionApi";
import ErrorAlert from "@/app/components/error-alert";
import EmptyState from "@/app/components/empty-state";
import EditionStateControls from "./edition-state-controls";
import { serverAuthProvider } from "@/lib/authProvider";
import { getEncodedResourceId } from "@/lib/halRoute";
import { Edition } from "@/types/edition";
import { Team } from "@/types/team";
import { parseErrorMessage, NotFoundError } from "@/types/errors";
import Link from "next/link";

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
    const editionsService = new EditionsService(serverAuthProvider);

    let edition: Edition | null = null;
    let teams: Team[] = [];
    let error: string | null = null;
    let teamsError: string | null = null;

    try {
        edition = await editionsService.getEditionById(id);
    } catch (e) {
        console.error("Failed to fetch edition:", e);
        error = e instanceof NotFoundError
            ? "This edition does not exist."
            : parseErrorMessage(e);
    }

    if (edition && !error) {
        try {
            teams = await editionsService.getEditionTeams(id);
        } catch (e) {
            console.error("Failed to fetch teams:", e);
            teamsError = parseErrorMessage(e);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50">
            <div className="w-full max-w-3xl px-4 py-10">
                <div className="w-full rounded-lg border bg-white p-6 shadow-sm dark:bg-black">
                    <h1 className="mb-2 text-2xl font-semibold">
                        {getEditionTitle(edition, id)}
                    </h1>

                    {edition && (
                        <EditionStateControls
                            editionId={id}
                            state={edition.state}
                            isAdmin={false}
                        />
                    )}

                    {edition?.venueName ? (
                        <p className="text-sm text-zinc-600">{edition.venueName}</p>
                    ) : null}

                    {edition?.description ? (
                        <p className="mt-2 text-sm text-zinc-600">
                            {edition.description}
                        </p>
                    ) : null}

                    {error && (
                        <div className="mt-6">
                            <ErrorAlert message={error} />
                        </div>
                    )}

                    {!error && (
                        <>
                            <h2 className="mt-8 mb-4 text-xl font-semibold">
                                Participating Teams
                            </h2>

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
                                                className="p-4 w-full border rounded-lg bg-white shadow-sm hover:shadow transition dark:bg-black"
                                            >
                                                {href ? (
                                                    <Link href={href} className="font-medium">
                                                        {team.name ?? `Team ${index + 1}`}
                                                    </Link>
                                                ) : (
                                                    <span className="font-medium">
                                                        {team.name ?? `Team ${index + 1}`}
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
