import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PostgrestError } from "@supabase/supabase-js";
import { TagsView } from "./tags-view";
import { tagAssignmentStorageKey } from "@/lib/storage/tags";
import type { Tag } from "@/types/tag";

const { mockUseTags, mockUseSession, mockCreateTag, mockUpdateTag, mockDeleteTag } =
  vi.hoisted(() => ({
    mockUseTags: vi.fn(),
    mockUseSession: vi.fn(),
    mockCreateTag: vi.fn(),
    mockUpdateTag: vi.fn(),
    mockDeleteTag: vi.fn(),
  }));

vi.mock("@/components/use-tags", () => ({ useTags: mockUseTags }));
vi.mock("@/components/auth/session-provider", () => ({
  useSession: mockUseSession,
}));
vi.mock("@/lib/supabase/tags", () => ({
  createTag: mockCreateTag,
  updateTag: mockUpdateTag,
  deleteTag: mockDeleteTag,
}));

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

const TAGS: Tag[] = [
  { id: "tag-work", name: "Work", color: "#2563eb" },
  { id: "tag-fun", name: "Fun", color: "#db2777" },
];

function readyTags(tags = TAGS, reload = vi.fn()) {
  return { status: "ready" as const, tags, error: null, reload };
}

beforeEach(() => {
  stubMatchMedia(true);
  window.localStorage.clear();
  mockUseTags.mockReset();
  mockUseTags.mockReturnValue(readyTags());
  mockUseSession.mockReset();
  mockUseSession.mockReturnValue({
    status: "authenticated",
    user: { id: "user-1", email: "ada@example.com" },
    signOut: vi.fn(),
  });
  mockCreateTag.mockReset();
  mockUpdateTag.mockReset();
  mockDeleteTag.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TagsView", () => {
  it("lists the user's tags with how many transactions use each", () => {
    window.localStorage.setItem(
      tagAssignmentStorageKey("user-1"),
      JSON.stringify([
        { transactionId: "txn-1", tagIds: ["tag-work"] },
        { transactionId: "txn-2", tagIds: ["tag-work", "tag-fun"] },
      ]),
    );

    render(<TagsView />);

    expect(screen.getByRole("heading", { name: "Tags" })).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("2 transactions")).toBeInTheDocument();
    expect(screen.getByText("Fun")).toBeInTheDocument();
    expect(screen.getByText("1 transaction")).toBeInTheDocument();
  });

  it("shows a first-run empty state", () => {
    mockUseTags.mockReturnValue(readyTags([]));

    render(<TagsView />);

    expect(screen.getByText("No tags yet")).toBeInTheDocument();
  });

  it("creates a tag through the animated form", async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    mockUseTags.mockReturnValue(readyTags(TAGS, reload));
    mockCreateTag.mockResolvedValue({
      data: { id: "tag-new", name: "Family", color: "#7c3aed" },
      error: null,
    });

    render(<TagsView />);

    await user.click(screen.getByRole("button", { name: "New tag" }));
    await user.type(screen.getByLabelText("Name"), "Family");
    await user.click(screen.getByRole("button", { name: "Create tag" }));

    await waitFor(() => expect(reload).toHaveBeenCalledOnce());
    expect(mockCreateTag).toHaveBeenCalledWith({
      name: "Family",
      color: "#7c3aed",
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("asks before deleting a tag and removes its local assignments", async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    mockUseTags.mockReturnValue(readyTags(TAGS, reload));
    mockDeleteTag.mockResolvedValue({ error: null });
    window.localStorage.setItem(
      tagAssignmentStorageKey("user-1"),
      JSON.stringify([
        { transactionId: "txn-1", tagIds: ["tag-work", "tag-fun"] },
        { transactionId: "txn-2", tagIds: ["tag-work"] },
      ]),
    );

    render(<TagsView />);

    await user.click(screen.getByRole("button", { name: "Delete Work" }));
    expect(
      screen.getByRole("dialog", { name: "Delete this tag?" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete tag" }));

    await waitFor(() =>
      expect(mockDeleteTag).toHaveBeenCalledWith("tag-work"),
    );
    expect(reload).toHaveBeenCalledOnce();
    expect(
      window.localStorage.getItem(tagAssignmentStorageKey("user-1")),
    ).toBe(JSON.stringify([{ transactionId: "txn-1", tagIds: ["tag-fun"] }]));
  });

  it("shows the load failure with a retry", () => {
    mockUseTags.mockReturnValue({
      status: "error",
      tags: [],
      error: { message: "Failed to fetch tags" } as unknown as PostgrestError,
      reload: vi.fn(),
    });

    render(<TagsView />);

    expect(screen.getByText("Could not load your tags")).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch tags")).toBeInTheDocument();
  });
});
