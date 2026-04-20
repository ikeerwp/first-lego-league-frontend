import { EditionsService } from "@/api/editionApi";
import { ScientificProjectsService } from "@/api/scientificProjectApi";
import PageShell from "@/app/components/page-shell";
import ErrorAlert from "@/app/components/error-alert";
import EmptyState from "@/app/components/empty-state";
import { serverAuthProvider } from "@/lib/authProvider";
import { getEncodedResourceId } from "@/lib/halRoute";
import { ScientificProject } from "@/types/scientificProject";
import Link from "next/link";
import { buttonVariants } from "@/app/components/button";
import { parseErrorMessage } from "@/types/errors";

function ScientificProjectCard({ project, index }: Readonly<{ project: ScientificProject; index: number }>) {
    return (
        <div className="list-card block h-full pl-7 transition-colors hover:bg-secondary/30">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                    <div className="list-kicker">Scientific Project #{index + 1}</div>
                    <div className="list-title">
                        {project.comments ? project.comments : `Project ${index + 1}`}
                    </div>
                    {project.score !== undefined && project.score !== null && (
                        <div className="list-support">Score: {project.score}</div>
                    )}
                </div>
                {project.score !== undefined && project.score !== null && (
                    <div className="status-badge">{project.score} pts</div>
                )}
            </div>
        </div>
    );
}

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ScientificProjectsPage({ searchParams }: Readonly<{ searchParams: PageSearchParams }>) {
    let projects: ScientificProject[] = [];
    let error: string | null = null;
    let yearQuery = "";
    const auth = await serverAuthProvider.getAuth();
    const isLoggedIn = !!auth;

    try {
        const params = await searchParams;
        const yearParam = params.year;
        const year = Array.isArray(yearParam) ? yearParam[0] : yearParam;
        yearQuery = year ? `?year=${year}` : "";
        const service = new ScientificProjectsService(serverAuthProvider);

        if (year) {
            const editionsService = new EditionsService(serverAuthProvider);
            const edition = await editionsService.getEditionByYear(year);

            const editionId = edition?.uri ? getEncodedResourceId(edition.uri) : null;
            if (editionId) {
                projects = await service.getScientificProjectsByEdition(editionId);
            }
        } else {
            projects = await service.getScientificProjects();
        }
    } catch (e) {
        console.error("Failed to fetch scientific projects:", e);
        error = parseErrorMessage(e);
    }

    return (
        <PageShell
            eyebrow="Innovation project"
            title="Scientific Projects"
            description="Explore innovation projects linked to each FIRST LEGO League edition."
            heroAside={isLoggedIn ? (
                <Link href={`/scientific-projects/new${yearQuery}`} className={buttonVariants({ variant: "default", size: "sm" })}>
                    New Project
                </Link>
            ) : undefined}
        >
            <div className="space-y-6">
                <div className="space-y-3">
                    <div className="page-eyebrow">Project list</div>
                    <h2 className="section-title">Season projects overview</h2>
                    <p className="section-copy max-w-3xl">
                        Each card highlights the scientific project submitted by a team, including score and evaluation comments.
                    </p>
                </div>

                {error && <ErrorAlert message={error} />}

                {!error && projects.length === 0 && (
                    <EmptyState
                        title="No scientific projects found"
                        description="There are currently no scientific projects available to display."
                    />
                )}

                {!error && projects.length > 0 && (
                    <ul className="list-grid">
                        {projects.map((project, index) => {
                            const projectId = getEncodedResourceId(project.uri);
                            const card = <ScientificProjectCard project={project} index={index} />;
                            return (
                                <li key={project.uri ?? index}>
                                    {projectId ? (
                                        <Link href={`/scientific-projects/${projectId}${yearQuery}`} className="block h-full">
                                            {card}
                                        </Link>
                                    ) : card}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </PageShell>
    );
}
