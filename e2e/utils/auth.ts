import { expect, Page } from "@playwright/test";
import { TestUser } from "./test-data";

function escapeForRegExp(value: string) {
    return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

export async function loginViaUi(page: Page, user: TestUser) {
    await page.goto("/login");

    await page.getByLabel("Username").fill(user.username);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page).toHaveURL(new RegExp(String.raw`/users/${escapeForRegExp(user.username)}$`));
}
