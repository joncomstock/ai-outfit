import { test, expect } from "@playwright/test";

test.describe("Public API Endpoints", () => {
  test("webhook endpoint returns 400 without headers", async ({ request }) => {
    const response = await request.post("/api/webhooks/clerk", {
      data: { type: "test" },
    });
    expect(response.status()).toBe(400);
  });

  test("protected endpoints reject unauthenticated requests", async ({ request }) => {
    const response = await request.get("/api/outfits");
    // Clerk middleware protects this route — returns 404 for unauthenticated API requests
    expect(response.status()).toBe(404);
  });

  test("products endpoint rejects unauthenticated requests", async ({ request }) => {
    const response = await request.get("/api/products");
    expect(response.status()).toBe(404);
  });
});
