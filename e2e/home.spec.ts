import { expect, test } from "@playwright/test";

test("home page exposes the public navigation", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "First LEGO League", level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Teams", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Matches", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Scientific Projects", exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Teams", exact: true }).click();
    await expect(page).toHaveURL(/\/teams$/);

    await page.getByRole("link", { name: "Matches", exact: true }).click();
    await expect(page).toHaveURL(/\/matches$/);

    await page.getByRole("link", { name: "Scientific Projects", exact: true }).click();
    await expect(page).toHaveURL(/\/scientific-projects$/);
});
