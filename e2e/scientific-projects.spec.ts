import { expect, test } from "@playwright/test";
import { ScientificProjectsService } from "../src/api/scientificProjectApi";
import { loginViaUi } from "./utils/auth";
import { createUserViaApi } from "./utils/api";
import { createTestUser } from "./utils/test-data";

test("scientific projects page renders published content or the empty state", async ({ page }) => {
    await page.goto("/scientific-projects");

    await expect(page.getByRole("heading", { name: "Scientific Projects", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Season projects overview", level: 2 })).toBeVisible();

    const emptyState = page.getByText("No scientific projects found");
    const projectCards = page.locator("ul.list-grid > li");

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
    const originalFetch = globalThis.fetch;
    const jsonResponse = (body: unknown) =>
        new Response(JSON.stringify(body), {
            status: 200,
            headers: { "content-type": "application/hal+json" },
        });

    globalThis.fetch = (async (input: RequestInfo | URL) => {
        const url = input.toString();

        if (url.endsWith("/scientificProjects/search/findByTeamName?teamName=Alpha")) {
            return jsonResponse({
                _embedded: { scientificProjects: [] },
                _links: { self: { href: url } },
            });
        }

        if (url.endsWith("/scientificProjects?size=1000")) {
            return jsonResponse({
                _embedded: {
                    scientificProjects: [
                        {
                            uri: "/scientificProjects/1",
                            comments: "Renewable energy in the context of the FLL",
                            score: 8,
                            _links: {
                                self: { href: "https://api.firstlegoleague.win/scientificProjects/1" },
                                team: { href: "https://api.firstlegoleague.win/scientificProjects/1/team" },
                            },
                        },
                    ],
                },
                _links: { self: { href: url } },
            });
        }

        if (url === "https://api.firstlegoleague.win/scientificProjects/1/team") {
            return jsonResponse({
                uri: "/teams/Test Team Alpha",
                id: "Test Team Alpha",
                _links: {
                    self: { href: "https://api.firstlegoleague.win/teams/Test%20Team%20Alpha" },
                },
            });
        }

        throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof fetch;

    try {
        const service = new ScientificProjectsService({ getAuth: async () => null });
        const projects = await service.searchScientificProjectsByTeamName("Alpha");

        expect(projects).toHaveLength(1);
        expect(projects[0].comments).toBe("Renewable energy in the context of the FLL");
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test("authenticated users can open the new scientific project form", async ({ page, request }) => {
    const user = createTestUser("scientific-project");

    await createUserViaApi(request, user);
    await loginViaUi(page, user);

    await page.goto("/scientific-projects");
    await expect(page.getByRole("link", { name: "New Project", exact: true })).toBeVisible();

    await page.getByRole("link", { name: "New Project", exact: true }).click();

    await expect(page).toHaveURL(/\/scientific-projects\/new$/);
    await expect(page.getByRole("heading", { name: "New Scientific Project", level: 1 })).toBeVisible();
    await expect(page.getByLabel("Project name")).toBeVisible();
    await expect(page.locator("form").getByLabel("Edition")).toBeVisible();
    await expect(page.getByLabel("Team")).toBeVisible();
});
