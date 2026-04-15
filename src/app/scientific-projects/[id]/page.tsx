import { ScientificProjectsService } from "@/api/scientificProjectApi";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { InfoRow } from "@/app/components/info-row";
import { TeamCard } from "@/app/components/team-card";
import { serverAuthProvider } from "@/lib/authProvider";
import { fetchHalResource } from "@/api/halClient";
import { NotFoundError, parseErrorMessage } from "@/types/errors";
import { ScientificProject } from "@/types/scientificProject";
import { Team } from "@/types/team";

export const dynamic = "force-dynamic";

interface ScientificProjectDetailPageProps {
    readonly params: Promise<{ id: string }>;
}

function getProjectTitle(project: ScientificProject | null, id: string): string {
    if (!project) {
        let decodedId = id;
        try { decodedId = decodeURIComponent(id); } catch { /* use raw id */ }
        return `Scientific Project ${decodedId}`;
    }
    return project.comments ? project.comments : `Scientific Project ${id}`;
}

export default async function ScientificProjectDetailPage(props: Readonly<ScientificProjectDetailPageProps>) {
    const { id } = await props.params;
    const service = new ScientificProjectsService(serverAuthProvider);

    let project: ScientificProject | null = null;
    let team: Team | null = null;
    let projectError: string | null = null;
    let teamError: string | null = null;

    try {
        project = await service.getScientificProjectById(id);
    } catch (e) {
        console.error("Failed to fetch scientific project:", e);
        projectError = e instanceof NotFoundError
            ? "This scientific project does not exist."
            : `Could not load project details. ${parseErrorMessage(e)}`;
    }

    const teamHref = project?.link("team")?.href ?? project?.team;
    if (teamHref) {
        try {
            team = await fetchHalResource<Team>(teamHref, serverAuthProvider);
        } catch (e) {
            console.error("Failed to fetch project team:", e);
            teamError = `Could not load team information. ${parseErrorMessage(e)}`;
        }
    }

    return (
        <PageShell
            eyebrow="Scientific Project"
            title={getProjectTitle(project, id)}
            description={project?.score !== undefined && project?.score !== null ? `Score: ${project.score} pts` : undefined}
        >
            {projectError && <ErrorAlert message={projectError} />}

            {!projectError && project && (
                <div className="space-y-8">
                    <section aria-labelledby="project-info-heading">
                        <div className="mb-4 space-y-1">
                            <div className="page-eyebrow">Evaluation</div>
                            <h2 id="project-info-heading" className="section-title">Project details</h2>
                        </div>
                        <div className="rounded-lg border border-border bg-card p-5">
                            <div className="space-y-3">
                                {project.score !== undefined && project.score !== null && (
                                    <InfoRow label="Score" value={`${project.score} pts`} />
                                )}
                                {project.comments && (
                                    <InfoRow label="Comments" value={project.comments} />
                                )}
                            </div>
                        </div>
                    </section>

                    <section aria-labelledby="team-heading">
                        <div className="mb-4 space-y-1">
                            <div className="page-eyebrow">Participant</div>
                            <h2 id="team-heading" className="section-title">Presenting team</h2>
                        </div>

                        {teamError && <ErrorAlert message={teamError} />}

                        {!teamError && team && <TeamCard team={team} label="Presenting team" />}
                    </section>

                    <section aria-labelledby="room-heading">
                        <div className="mb-4 space-y-1">
                            <div className="page-eyebrow">Venue</div>
                            <h2 id="room-heading" className="section-title">Evaluation room</h2>
                        </div>
                        <div className="rounded-lg border border-border bg-card p-5">
                            <p className="text-sm text-muted-foreground">
                                Room and judge information will be available in a future update.
                            </p>
                        </div>
                    </section>
                </div>
            )}
        </PageShell>
    );
}