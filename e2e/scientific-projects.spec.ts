import { expect, test } from "@playwright/test";
import { createUserViaApi } from "./utils/api";
import { loginViaUi } from "./utils/auth";
import { createTestUser } from "./utils/test-data";

type FallbackProject = {
    team?: string;
    comments: string;
    score?: number;
    link: (rel: string) => { href?: string } | undefined;
};

function normalizeProjectSearchValue(value: string | undefined): string {
    return value?.trim().toLowerCase() ?? "";
}

function getFallbackProjectTeamHref(project: FallbackProject): string | null {
    const teamLink = project.link("team")?.href;
    if (teamLink) return teamLink;

    if (project.team?.startsWith("/") || project.team?.startsWith("http")) {
        return project.team;
    }

    return null;
}

async function filterFallbackProjectsByTeamName(
    projects: readonly FallbackProject[],
    teamName: string,
    fetchTeam: (teamHref: string) => Promise<{ name?: string; id?: string } | null>,
) {
    const normalizedTeamName = normalizeProjectSearchValue(teamName);

    if (!normalizedTeamName) {
        return [...projects];
    }

    const teamCache = new Map<string, Promise<{ name?: string; id?: string } | null>>();

    const matchingProjects = await Promise.all(
        projects.map(async (project) => {
            const inlineTeamName = normalizeProjectSearchValue(project.team);
            if (inlineTeamName.includes(normalizedTeamName)) {
                return project;
            }

            const teamHref = getFallbackProjectTeamHref(project);
            if (!teamHref) {
                return null;
            }

            if (!teamCache.has(teamHref)) {
                teamCache.set(teamHref, fetchTeam(teamHref).catch(() => null));
            }

            const team = await teamCache.get(teamHref);
            const teamNameMatches = normalizeProjectSearchValue(team?.name).includes(normalizedTeamName);
            const teamIdMatches = normalizeProjectSearchValue(team?.id).includes(normalizedTeamName);

            return teamNameMatches || teamIdMatches ? project : null;
        }),
    );

    return matchingProjects.filter((project): project is FallbackProject => project !== null);
}

test("scientific projects page renders published content or the empty state", async ({ page }) => {
    await page.goto("/scientific-projects");

    await expect(page.getByRole("heading", { name: "Scientific Projects", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Season project overview", level: 2 })).toBeVisible();

    const emptyState = page.getByText("No scientific projects found");
    const projectCards = page.locator(".scientific-projects-page-grid > li");

    await expect(emptyState.or(projectCards.first())).toBeVisible();
});

test("scientific projects can be searched by team name from the URL", async ({ page }) => {
    const teamName = `no-project-team-${Date.now()}`;

    await page.goto("/scientific-projects?year=2099");
    await page.getByRole("searchbox", { name: "Search scientific projects by team name" }).fill(teamName);
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(new RegExp(`/scientific-projects\\?year=2099&teamName=${teamName}$`));
    await expect(page.getByText(`No scientific projects match "${teamName}".`)).toBeVisible();

    await page.getByRole("button", { name: "Clear" }).click();

    await expect(page).toHaveURL(/\/scientific-projects\?year=2099$/);
});

test("scientific project team-name search falls back to partial team id matches", async () => {
    const projects = [
        {
            team: "https://api.firstlegoleague.win/scientificProjects/1/team",
            comments: "Renewable energy in the context of the FLL",
            score: 8,
            link: (rel: string) =>
                rel === "team"
                    ? { href: "https://api.firstlegoleague.win/scientificProjects/1/team" }
                    : undefined,
        },
    ];

    const matchingProjects = await filterFallbackProjectsByTeamName(
        projects,
        "Alpha",
        async (teamHref) => {
            if (teamHref !== "https://api.firstlegoleague.win/scientificProjects/1/team") {
                return null;
            }

            return {
                id: "Test Team Alpha",
            };
        },
    );

    expect(matchingProjects).toHaveLength(1);
    expect(matchingProjects[0].comments).toBe("Renewable energy in the context of the FLL");
});

test("authenticated users can open the new scientific project form", async ({ page, request }) => {
    const user = createTestUser("scientific-project");

    await createUserViaApi(request, user);
    await loginViaUi(page, user);

    await page.goto("/scientific-projects");
    await expect(page.getByRole("link", { name: "New project", exact: true })).toBeVisible();

    await page.getByRole("link", { name: "New project", exact: true }).click();

    await expect(page).toHaveURL(/\/scientific-projects\/new$/);
    await expect(page.getByRole("heading", { name: "New Scientific Project", level: 1 })).toBeVisible();
    await expect(page.getByLabel("Project name")).toBeVisible();
    await expect(page.locator("form").getByLabel("Edition")).toBeVisible();
    await expect(page.getByLabel("Team")).toBeVisible();
});

test("scientific project cards render room details and keep the status badge", async ({ page }) => {
    await page.goto("/scientific-projects");

    const emptyState = page.getByText("No scientific projects found");
    const projectCards = page.locator(".scientific-projects-page-project-card");

    if (await emptyState.isVisible()) {
        return;
    }

    const firstCard = projectCards.first();

    await expect(firstCard.getByText("Room", { exact: true })).toBeVisible();
    await expect(firstCard.getByText(/Evaluated|Room assigned|Pending review/)).toBeVisible();

    const scoreFactValue = (
        await firstCard
            .locator(".scientific-projects-page-project-card__fact-value")
            .first()
            .textContent()
    )?.trim() ?? "";

    expect(
        scoreFactValue === "Awaiting score" || /^\d+\spts$/.test(scoreFactValue)
    ).toBeTruthy();

    const roomFactText = await firstCard
        .locator(".scientific-projects-page-project-card__fact")
        .nth(1)
        .textContent();

    expect(roomFactText ?? "").toMatch(/Room|Pending assignment/);

    const detailsLink = page.locator("a.scientific-projects-page-link").first();

    if (await detailsLink.count()) {
        const href = await detailsLink.getAttribute("href");
        expect(href ?? "").toMatch(/^\/scientific-projects\/.+/);
    }
});
