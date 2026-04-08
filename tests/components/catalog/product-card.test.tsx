// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "@/components/catalog/product-card";

describe("ProductCard", () => {
  const product = {
    id: "test-1",
    name: "Test Shirt",
    brand: "TestBrand",
    category: "tops" as const,
    price: 38000,
    currency: "USD",
    imageUrl: "https://placehold.co/400x500",
    description: "A test shirt",
    colors: [],
    sizes: [],
    affiliateUrl: "https://example.com",
    affiliateProvider: null,
    sku: null,
    inStock: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("formats price from cents to dollars", () => {
    render(<ProductCard product={product} onSelect={() => {}} />);
    expect(screen.getByText("$380")).toBeInTheDocument();
  });

  it("does not display raw cents value as dollars", () => {
    render(<ProductCard product={product} onSelect={() => {}} />);
    expect(screen.queryByText("$38,000")).not.toBeInTheDocument();
  });
});
