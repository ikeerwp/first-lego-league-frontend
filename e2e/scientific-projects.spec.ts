import { expect, test } from "@playwright/test";
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
