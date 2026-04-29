import { expect, test } from "@playwright/test";
import { createAdministratorViaApi, hasAdminTestUser } from "./utils/api";
import { loginViaUi } from "./utils/auth";
import { createTestUser } from "./utils/test-data";

function getAdminUser() {
    return {
        username: process.env.E2E_ADMIN_USERNAME ?? "",
        password: process.env.E2E_ADMIN_PASSWORD ?? "",
        email: `${process.env.E2E_ADMIN_USERNAME ?? "admin"}@sample.app`,
    };
}

test.describe("administrators delete flow", () => {
    test.beforeEach(async ({ page }) => {
        test.skip(!hasAdminTestUser(), "Admin credentials not configured");
        await loginViaUi(page, getAdminUser());
        await page.goto("/administrators");
        await expect(page.getByRole("heading", { name: "Administrators", level: 1 })).toBeVisible();
    });

    test("the delete button is disabled for the currently logged-in administrator", async ({ page }) => {
        const ownCard = page.locator("li", { hasText: getAdminUser().username }).first();
        await expect(ownCard.getByRole("button", { name: "You cannot delete your own account" })).toBeDisabled();
    });

    test("an admin can cancel deleting an administrator and the list is unchanged", async ({ page, request }) => {
        const targetAdmin = createTestUser("e2e-admin");
        await createAdministratorViaApi(request, targetAdmin);
        await page.reload();

        const adminCard = page.locator("li", { hasText: targetAdmin.username }).first();
        await adminCard.getByRole("button", { name: `Delete ${targetAdmin.username}` }).click();

        const dialog = page.getByRole("dialog", { name: "Delete administrator" });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByText(targetAdmin.username)).toBeVisible();

        await page.getByRole("button", { name: "Cancel" }).click();

        await expect(dialog).not.toBeVisible();
        await expect(page.locator("li", { hasText: targetAdmin.username }).first()).toBeVisible();
    });

    test("an admin can delete another administrator and the list updates", async ({ page, request }) => {
        const targetAdmin = createTestUser("e2e-admin");
        await createAdministratorViaApi(request, targetAdmin);
        await page.reload();

        const adminCard = page.locator("li", { hasText: targetAdmin.username }).first();
        await adminCard.getByRole("button", { name: `Delete ${targetAdmin.username}` }).click();

        await expect(page.getByRole("dialog", { name: "Delete administrator" })).toBeVisible();
        await page.getByRole("button", { name: "Delete administrator" }).click();

        await expect(page.getByText("Administrator deleted successfully.")).toBeVisible();
        await expect(page.locator("li", { hasText: targetAdmin.username })).not.toBeVisible();
    });

    test("an error message is shown when the delete request fails", async ({ page, request }) => {
        const targetAdmin = createTestUser("e2e-admin");
        await createAdministratorViaApi(request, targetAdmin);
        await page.reload();

        await page.route("**/users/**", (route) => {
            if (route.request().method() === "DELETE") {
                return route.fulfill({ status: 500 });
            }
            return route.continue();
        });

        const adminCard = page.locator("li", { hasText: targetAdmin.username }).first();
        await adminCard.getByRole("button", { name: `Delete ${targetAdmin.username}` }).click();

        await expect(page.getByRole("dialog", { name: "Delete administrator" })).toBeVisible();
        await page.getByRole("button", { name: "Delete administrator" }).click();

        await expect(page.getByRole("alert")).toBeVisible();
        await expect(page.getByRole("dialog", { name: "Delete administrator" })).toBeVisible();
        await expect(page.locator("li", { hasText: targetAdmin.username }).first()).toBeVisible();
    });

    test("pressing Escape cancels the delete dialog", async ({ page, request }) => {
        const targetAdmin = createTestUser("e2e-admin");
        await createAdministratorViaApi(request, targetAdmin);
        await page.reload();

        const adminCard = page.locator("li", { hasText: targetAdmin.username }).first();
        await adminCard.getByRole("button", { name: `Delete ${targetAdmin.username}` }).click();

        await expect(page.getByRole("dialog", { name: "Delete administrator" })).toBeVisible();
        await page.keyboard.press("Escape");

        await expect(page.getByRole("dialog")).not.toBeVisible();
        await expect(page.locator("li", { hasText: targetAdmin.username }).first()).toBeVisible();
    });
});
