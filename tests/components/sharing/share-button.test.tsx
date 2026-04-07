// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ShareButton } from "@/components/sharing/share-button";

const mockToast = vi.fn();
vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("ShareButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders share button", () => {
    render(<ShareButton outfitId="outfit-1" shareToken={null} />);
    expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
  });

  it("shows copy link when token exists", () => {
    render(<ShareButton outfitId="outfit-1" shareToken="abc123" />);
    expect(screen.getByRole("button", { name: /copy link/i })).toBeInTheDocument();
  });
});
