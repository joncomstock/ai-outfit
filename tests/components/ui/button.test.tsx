// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with primary variant by default", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain("editorial-gradient");
  });

  it("renders secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByRole("button", { name: "Secondary" });
    expect(btn.className).toContain("ghost-border");
  });

  it("renders tertiary variant", () => {
    render(<Button variant="tertiary">Tertiary</Button>);
    const btn = screen.getByRole("button", { name: "Tertiary" });
    expect(btn.className).toContain("underline");
  });
});
