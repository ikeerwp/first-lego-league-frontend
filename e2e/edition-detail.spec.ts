import { expect, test } from "@playwright/test";

test("edition detail page renders metadata when the edition exists", async ({ page }) => {
    await page.goto("/editions");

    const firstEditionLink = page.locator('.editions-page-grid a[href^="/editions/"]').first();
    const emptyState = page.getByText("No editions found");

    await expect(emptyState.or(firstEditionLink)).toBeVisible();

    if (await emptyState.isVisible()) {
        return;
    }

    await firstEditionLink.click();

    await expect(page).toHaveURL(/\/editions\/.+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
        page.getByRole("heading", { name: "Participating Teams", level: 2 }),
    ).toBeVisible();
    await expect(
        page.getByRole("heading", { name: "Final Classification", level: 2 }),
    ).toBeVisible();
    await expect(
        page.getByRole("heading", { name: "Media Gallery", level: 2 }),
    ).toBeVisible();
});

test("edition detail page shows a not-found message when the edition does not exist", async ({ page }) => {
    await page.goto("/editions/999999999");

    await expect(page.getByText("This edition does not exist.")).toBeVisible();
});

test("edition detail page renders the participating teams section or an empty state", async ({ page }) => {
    await page.goto("/editions");

    const firstEditionLink = page.locator('.editions-page-grid a[href^="/editions/"]').first();
    const emptyState = page.getByText("No editions found");

    await expect(emptyState.or(firstEditionLink)).toBeVisible();

    if (await emptyState.isVisible()) {
        return;
    }

    await firstEditionLink.click();

    await expect(
        page.getByRole("heading", { name: "Participating Teams", level: 2 }),
    ).toBeVisible();

    const teamItem = page.locator("h2:has-text('Participating Teams') ~ ul li").first();
    const teamsEmptyState = page.getByText("No teams are registered for this edition yet.");

    await expect(teamItem.or(teamsEmptyState)).toBeVisible();
});

test("edition detail page links each participating team to its detail page", async ({ page }) => {
    await page.goto("/editions");

    const firstEditionLink = page.locator('.editions-page-grid a[href^="/editions/"]').first();
    const editionsEmptyState = page.getByText("No editions found");

    await expect(editionsEmptyState.or(firstEditionLink)).toBeVisible();

    if (await editionsEmptyState.isVisible()) {
        return;
    }

    await firstEditionLink.click();

    const teamLink = page.locator('a[href^="/teams/"]').first();
    const teamsEmptyState = page.getByText("No teams are registered for this edition yet.");

    await expect(teamLink.or(teamsEmptyState)).toBeVisible();

    if (await teamsEmptyState.isVisible()) {
        return;
    }

    await teamLink.click();

    await expect(page).toHaveURL(/\/teams\/.+$/);
});