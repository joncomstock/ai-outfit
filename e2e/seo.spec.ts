import { test, expect } from "@playwright/test";

test.describe("SEO", () => {
  test("sitemap.xml is accessible", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("/welcome");
  });

  test("robots.txt is accessible", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("User-Agent");
    expect(body).toContain("Disallow: /api/");
  });

  test("welcome page has correct meta title", async ({ page }) => {
    await page.goto("/welcome");
    await expect(page).toHaveTitle(/Outfit Engine/);
  });
});
