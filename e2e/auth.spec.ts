import { expect, test } from "@playwright/test";

test("public registration is blocked", async ({ page }) => {
    await page.goto("/users/register");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Register" })).toHaveCount(0);
});

test("invalid credentials show the current authentication error", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Username").fill("not-a-real-user");
    await page.getByLabel("Password").fill("wrongpass123");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByText("Invalid username or password. Please try again.")).toBeVisible();
});
