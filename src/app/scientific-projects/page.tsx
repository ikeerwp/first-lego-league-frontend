import { EditionsService } from "@/api/editionApi";
import { ScientificProjectsService } from "@/api/scientificProjectApi";
import { buttonVariants } from "@/app/components/button";
import EmptyState from "@/app/components/empty-state";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import PaginationControls from "@/app/components/pagination-controls";
import { ScientificProjectCardLink } from "@/app/components/scientific-project-card";
import { serverAuthProvider } from "@/lib/authProvider";
import { getEncodedResourceId } from "@/lib/halRoute";
import { parseErrorMessage } from "@/types/errors";
import type { HalPage } from "@/types/pagination";
import { ScientificProject } from "@/types/scientificProject";
import Link from "next/link";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 5;

export default async function ScientificProjectsPage({ searchParams }: Readonly<{ searchParams: PageSearchParams }>) {
    const params = await searchParams;
    const yearParam = params.year;
    const year = Array.isArray(yearParam) ? yearParam[0] : yearParam;
    const yearQuery = year ? `?year=${year}` : "";
    const urlPage = Math.max(1, Number(params.page ?? "1") || 1);

    let projects: ScientificProject[] = [];
    let result: HalPage<ScientificProject> = { items: [], hasNext: false, hasPrev: false, currentPage: 0 };
    let error: string | null = null;
    const auth = await serverAuthProvider.getAuth();
    const isLoggedIn = !!auth;

    try {
        const service = new ScientificProjectsService(serverAuthProvider);

        if (year) {
            const editionsService = new EditionsService(serverAuthProvider);
            const edition = await editionsService.getEditionByYear(year);
            const editionId = edition?.uri ? getEncodedResourceId(edition.uri) : null;
            if (editionId) {
                projects = await service.getScientificProjectsByEdition(editionId);
            }
        } else {
            result = await service.getScientificProjectsPaged(urlPage - 1, PAGE_SIZE);
            projects = result.items;
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
                    <>
                        <ul className="list-grid">
                            {projects.map((project, index) => (
                                <li key={project.uri ?? project.link("self")?.href ?? index}>
                                    <ScientificProjectCardLink project={project} index={index} />
                                </li>
                            ))}
                        </ul>
                        {!year && (
                            <PaginationControls
                                currentPage={urlPage}
                                hasNext={result.hasNext}
                                hasPrev={result.hasPrev}
                                basePath="/scientific-projects"
                            />
                        )}
                    </>
                )}
            </div>
        </PageShell>
    );
}
