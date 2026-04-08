import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("welcome page is accessible and loads fonts", async ({ page }) => {
    await page.goto("/welcome");
    // Check that the page renders with custom fonts loaded
    const body = await page.locator("body").evaluate((el) =>
      window.getComputedStyle(el).fontFamily
    );
    expect(body).toContain("Manrope");
  });

  test("mobile viewport shows proper layout", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/welcome");
    await expect(page.locator("h1")).toBeVisible();
    // Hero should stack on mobile
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
  });
});
