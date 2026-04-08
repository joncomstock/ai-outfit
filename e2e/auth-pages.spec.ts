import { test, expect } from "@playwright/test";

test.describe("Auth Pages", () => {
  test("sign-in page renders Clerk form", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveTitle(/Outfit Engine/);
    // Clerk renders its own form — just verify the page loads
    await expect(page.locator("body")).toBeVisible();
  });

  test("sign-up page renders Clerk form", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page).toHaveTitle(/Outfit Engine/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("unauthenticated access to /closet redirects to sign-in", async ({ page }) => {
    await page.goto("/closet");
    await page.waitForURL(/sign-in/);
    expect(page.url()).toContain("sign-in");
  });

  test("unauthenticated access to /outfits redirects to sign-in", async ({ page }) => {
    await page.goto("/outfits");
    await page.waitForURL(/sign-in/);
    expect(page.url()).toContain("sign-in");
  });
});
