import { test, expect } from "@playwright/test";

test.describe("Welcome / Landing Page", () => {
  test("renders hero section with CTA buttons", async ({ page }) => {
    await page.goto("/welcome");
    await expect(page.locator("h1")).toContainText("curated by AI");
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
    // Multiple sign-in links exist (nav + hero) — check at least one is visible
    await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible();
  });

  test("renders how it works section", async ({ page }) => {
    await page.goto("/welcome");
    await expect(page.getByText("HOW IT WORKS")).toBeVisible();
    // Use heading role to avoid ambiguity with body text mentioning these words
    await expect(page.getByRole("heading", { name: "Upload" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Generate" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Shop" })).toBeVisible();
  });

  test("renders features section", async ({ page }) => {
    await page.goto("/welcome");
    await expect(page.getByText("AI Vision Analysis")).toBeVisible();
    await expect(page.getByText("Smart Outfit Generation")).toBeVisible();
  });

  test("CTA links go to correct auth pages", async ({ page }) => {
    await page.goto("/welcome");
    const getStarted = page.getByRole("link", { name: /get started/i });
    await expect(getStarted).toHaveAttribute("href", "/sign-up");
  });
});
