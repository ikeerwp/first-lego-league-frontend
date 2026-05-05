import { expect, test } from "@playwright/test";

test("editions page links to an edition detail page", async ({ page }) => {
    await page.goto("/editions");

    await expect(page.getByRole("heading", { name: "Editions", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Season overview", level: 2 })).toBeVisible();

    const emptyState = page.getByText("No editions found");
    const firstEditionLink = page.locator('a[href^="/editions/"]').first();

    await expect(emptyState.or(firstEditionLink)).toBeVisible();

    if (await emptyState.isVisible()) {
        return;
    }

    await firstEditionLink.click();

    await expect(page).toHaveURL(/\/editions\/.+$/);
    await expect(page.getByRole("heading", { name: "Participating Teams", level: 2 })).toBeVisible();

    const projectRankingLink = page.getByRole("link", { name: "Scientific Project Ranking" });
    await expect(projectRankingLink).toBeVisible();

    await projectRankingLink.click();

    await expect(page).toHaveURL(/\/editions\/.+\/project-ranking$/);
    await expect(page.getByRole("heading", { name: /Project Ranking/, level: 1 })).toBeVisible();
    await expect(
        page.getByText("Project scores are not public yet")
            .or(page.getByText("No scientific projects found"))
            .or(page.getByRole("columnheader", { name: "Project Score" }))
    ).toBeVisible();
});
