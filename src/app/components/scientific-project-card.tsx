import Link from "next/link";
import { getEncodedResourceId } from "@/lib/halRoute";
import { ScientificProject } from "@/types/scientificProject";

type ScientificProjectCardVariant = "grid" | "stacked";

interface ScientificProjectCardProps {
    readonly project: ScientificProject;
    readonly index: number;
    readonly variant?: ScientificProjectCardVariant;
}

function getScientificProjectLabel(index: number): string {
    return `Scientific Project #${index + 1}`;
}

function getScientificProjectTitle(project: ScientificProject, index: number): string {
    return project.comments ? project.comments : `Project ${index + 1}`;
}

function getScientificProjectHref(project: ScientificProject): string | null {
    const resourceUri = project.uri ?? project.link("self")?.href;
    const projectId = getEncodedResourceId(resourceUri);

    return projectId ? `/scientific-projects/${projectId}` : null;
}

export function ScientificProjectCard({
    project,
    index,
    variant = "grid",
}: Readonly<ScientificProjectCardProps>) {
    if (variant === "stacked") {
        return (
            <div className="rounded-lg border bg-white p-4 transition-colors hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900">
                <div className="list-kicker">{getScientificProjectLabel(index)}</div>
                <div className="list-title mt-1">{getScientificProjectTitle(project, index)}</div>
                {project.score !== undefined && project.score !== null && (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Score: {project.score} pts
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="list-card block h-full pl-7 transition-colors hover:bg-secondary/30">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                    <div className="list-kicker">{getScientificProjectLabel(index)}</div>
                    <div className="list-title">{getScientificProjectTitle(project, index)}</div>
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

export function ScientificProjectCardLink({
    project,
    index,
    variant = "grid",
}: Readonly<ScientificProjectCardProps>) {
    const href = getScientificProjectHref(project);
    const card = <ScientificProjectCard project={project} index={index} variant={variant} />;

    if (!href) {
        return card;
    }

    return (
        <Link
            href={href}
            className={variant === "grid" ? "block h-full" : "block rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"}
        >
            {card}
        </Link>
    );
}
