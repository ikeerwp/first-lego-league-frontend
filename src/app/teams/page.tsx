import { EditionsService } from "@/api/editionApi";
import { TeamsService } from "@/api/teamApi";
import { UsersService } from "@/api/userApi";
import { buttonVariants } from "@/app/components/button";
import EmptyState from "@/app/components/empty-state";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import PaginationControls from "@/app/components/pagination-controls";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { getEncodedResourceId } from "@/lib/halRoute";
import { cn } from "@/lib/utils";
import { ApiError, AuthenticationError, parseErrorMessage } from "@/types/errors";
import type { HalPage } from "@/types/pagination";
import { Team } from "@/types/team";
import { User } from "@/types/user";
import type { LucideIcon } from "lucide-react";
import {
    ArrowUpRight,
    Building2,
    MapPin,
    Trophy,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 6;
const inscriptionDateFormatter = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
});

function getTeamDisplayName(team: Team) {
    return team.name ?? team.id ?? "Unnamed team";
}

function getTeamKey(team: Team, index: number) {
    return team.uri ?? team.id ?? `team-${index}`;
}

function getTeamErrorMessage(error: unknown) {
    if (error instanceof ApiError) {
        return parseErrorMessage(error);
    }

    if (error instanceof Error) {
        return error.message;
    }

    return parseErrorMessage(error);
}

function formatTeamCategory(category?: string) {
    if (!category) {
        return null;
    }

    return category
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function formatInscriptionDate(inscriptionDate?: string) {
    if (!inscriptionDate?.trim()) {
        return null;
    }

    const trimmedDate = inscriptionDate.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
        const [year, month, day] = trimmedDate.split("-").map(Number);
        const parsedDate = new Date(year, month - 1, day);
        return Number.isNaN(parsedDate.getTime())
            ? trimmedDate
            : inscriptionDateFormatter.format(parsedDate);
    }

    const parsedDate = new Date(trimmedDate);
    return Number.isNaN(parsedDate.getTime())
        ? trimmedDate
        : inscriptionDateFormatter.format(parsedDate);
}

function getUniqueValueCount(values: Array<string | null | undefined>) {
    return new Set(
        values
            .map((value) => value?.trim())
            .filter((value): value is string => Boolean(value)),
    ).size;
}


function StatCard({
    icon: Icon,
    label,
    value,
    description,
}: Readonly<{
    icon: LucideIcon;
    label: string;
    value: string;
    description: string;
}>) {
    return (
        <div className="teams-page-stat-card">
            <div className="teams-page-stat-card__inner">
                <div className="teams-page-stat-card__header">
                    <div className="teams-page-stat-card__copy">
                        <div className="teams-page-stat-card__label">{label}</div>
                        <div className="teams-page-stat-card__value">{value}</div>
                    </div>
                    <div className="teams-page-stat-card__icon">
                        <Icon aria-hidden="true" />
                    </div>
                </div>
                <p className="teams-page-stat-card__description">{description}</p>
            </div>
        </div>
    );
}

function TeamCard({
    team,
    isInteractive,
}: Readonly<{
    team: Team;
    isInteractive: boolean;
}>) {
    const formattedCategory = formatTeamCategory(team.category);
    const formattedInscriptionDate = formatInscriptionDate(team.inscriptionDate);
    const categoryTone = team.category?.toLowerCase() ?? "unknown";
    const hasFacts = Boolean(team.city || team.foundationYear !== undefined || formattedInscriptionDate);

    return (
        <article className="teams-page-team-card" data-category={categoryTone}>
            <div className="teams-page-team-card__body">
                <div className="teams-page-team-card__masthead">
                    {formattedCategory && (
                        <div className="teams-page-team-card__division">{formattedCategory}</div>
                    )}
                </div>

                <div className="teams-page-team-card__header">
                    <div className="teams-page-team-card__identity">
                        <div className="teams-page-team-card__kicker">Team</div>
                        <h3 className="teams-page-team-card__title">
                            {getTeamDisplayName(team)}
                        </h3>
                    </div>
                </div>

                {hasFacts && (
                    <div className="teams-page-team-card__facts">
                        {team.city && (
                            <div className="teams-page-team-card__fact">
                                <div className="teams-page-team-card__fact-label">City</div>
                                <div className="teams-page-team-card__fact-value">{team.city}</div>
                            </div>
                        )}
                        {team.foundationYear !== undefined && (
                            <div className="teams-page-team-card__fact">
                                <div className="teams-page-team-card__fact-label">Founded</div>
                                <div className="teams-page-team-card__fact-value">{team.foundationYear}</div>
                            </div>
                        )}
                        {formattedInscriptionDate && (
                            <div className="teams-page-team-card__fact">
                                <div className="teams-page-team-card__fact-label">Registered</div>
                                <div className="teams-page-team-card__fact-value">{formattedInscriptionDate}</div>
                            </div>
                        )}
                    </div>
                )}

                {team.educationalCenter && (
                    <div className="teams-page-team-card__center">
                        <div className="teams-page-team-card__center-label">Educational center</div>
                        <p className="teams-page-team-card__center-copy">{team.educationalCenter}</p>
                    </div>
                )}

                <div className="teams-page-team-card__footer">
                    <div
                        className={
                            isInteractive
                                ? "teams-page-team-card__action teams-page-team-card__action--interactive"
                                : "teams-page-team-card__action teams-page-team-card__action--disabled"
                        }
                    >
                        {isInteractive ? "View details" : "Profile unavailable"}
                        {isInteractive && <ArrowUpRight aria-hidden="true" />}
                    </div>
                </div>
            </div>
        </article>
    );
}

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function TeamsPage({ searchParams }: Readonly<{ searchParams: PageSearchParams }>) {
    const params = await searchParams;
    const yearParam = params.year;
    const year = Array.isArray(yearParam) ? yearParam[0] : yearParam;
    const yearQuery = year ? `?year=${year}` : "";
    const urlPage = Math.max(1, Number(params.page ?? "1") || 1);

    let teams: Team[] = [];
    let result: HalPage<Team> = { items: [], hasNext: false, hasPrev: false, currentPage: 0 };
    let error: string | null = null;
    let currentUser: User | null = null;

    try {
        currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
    } catch (error) {
        currentUser = null;
        if (error instanceof AuthenticationError || (error instanceof ApiError && error.statusCode === 403)) {
            console.warn("Current user is not authorized to access admin actions on the teams page.");
        } else {
            console.error("Failed to fetch current user on the teams page:", error);
        }
    }

    try {
        const service = new TeamsService(serverAuthProvider);

        if (year) {
            const editionsService = new EditionsService(serverAuthProvider);
            const edition = await editionsService.getEditionByYear(year);
            if (edition?.uri) {
                teams = await service.getTeamsByEdition(edition.uri + "/teams");
            }
        } else {
            result = await service.getTeamsPaged(urlPage - 1, PAGE_SIZE);
            teams = result.items;
        }
    } catch (e) {
        console.error("Failed to fetch teams:", e);
        error = getTeamErrorMessage(e);
    }

    const challengeCount = teams.filter((team) => team.category === "CHALLENGE").length;
    const exploreCount = teams.filter((team) => team.category === "EXPLORE").length;
    const citiesCount = getUniqueValueCount(teams.map((team) => team.city));
    const centersCount = getUniqueValueCount(teams.map((team) => team.educationalCenter));
    const categoriesCount = getUniqueValueCount(teams.map((team) => team.category));
    return (
        <PageShell
            eyebrow="Team management"
            title="Teams"
            description="Browse the teams currently registered in the FIRST LEGO League platform."
            bannerClassName="teams-page-banner"
            panelClassName="teams-page-panel"
            heroAside={isAdmin(currentUser) ? (
                <Link
                    href="/teams/new"
                    className={cn(
                        buttonVariants({ variant: "default", size: "sm" }),
                        "teams-page-create-button",
                    )}
                >
                    <span className="teams-page-create-button__label">Create new team</span>
                    <ArrowUpRight aria-hidden="true" />
                </Link>
            ) : undefined}
        >
            <div className="teams-page-content">
                {error && <ErrorAlert message={error} />}

                {!error && teams.length === 0 && (
                    <EmptyState
                        title="No teams found"
                        description="There are currently no teams available to display."
                    />
                )}

                {!error && teams.length > 0 && (
                    <>
                        {/* Las animaciones visuales de esta pagina estan marcadas en src/css/teams-list.css */}
                        <div className="teams-page-stats-grid">
                            <StatCard
                                icon={MapPin}
                                label="Cities represented"
                                value={String(citiesCount)}
                                description={
                                    citiesCount > 0
                                        ? "A broader geographic footprint is visible."
                                        : "City information is not available for the current teams."
                                }
                            />
                            <StatCard
                                icon={Building2}
                                label="Schools and centers"
                                value={String(centersCount)}
                                description={
                                    centersCount > 0
                                        ? "Educational institutions linked to the roster."
                                        : "No educational center has been registered yet."
                                }
                            />
                            <StatCard
                                icon={Trophy}
                                label="Categories active"
                                value={String(categoriesCount)}
                                description={
                                    categoriesCount > 0
                                        ? `${challengeCount} Challenge and ${exploreCount} Explore teams in the current view.`
                                        : "Teams do not include category metadata yet."
                                }
                            />
                        </div>
                        <ul className="teams-page-grid">
                            {teams.map((team, index) => {
                                const teamId = getEncodedResourceId(team.uri);
                                const href = teamId ? `/teams/${teamId}${yearQuery}` : null;
                                const card = (
                                    <TeamCard
                                        team={team}
                                        isInteractive={Boolean(href)}
                                    />
                                );

                                return (
                                    <li key={getTeamKey(team, index)} className="teams-page-item">
                                        {href ? (
                                            <Link href={href} className="teams-page-link">
                                                {card}
                                            </Link>
                                        ) : (
                                            <div className="teams-page-link">{card}</div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                        {!year && (
                            <div className="teams-page-pagination">
                                <PaginationControls
                                    currentPage={urlPage}
                                    hasNext={result.hasNext}
                                    hasPrev={result.hasPrev}
                                    basePath="/teams"
                                    variant="editorial"
                                    contextLabel=""
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </PageShell>
    );
}
