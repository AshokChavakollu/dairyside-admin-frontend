// ============================================================
//  Admin → Content → Reviews.
//
//  This screen decides what appears on the public home page, so the tests that
//  matter most are about what it must REFUSE to promote, and the one thing it
//  must never block: taking a review back down.
//
//  There is no "write a review" control and there should never be one — reviews
//  come from verified purchasers only, which is what lets the home page quote
//  them honestly. A test below asserts that absence.
// ============================================================

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../api", () => ({
  reviewsApi: {
    getReviews: vi.fn(),
    setFeatured: vi.fn(),
  },
}));

import { reviewsApi } from "../../api";
import Reviews from "./Reviews";

const review = (over = {}) => ({
  id: 1,
  rating: 5,
  title: "Great milk",
  body: "Thick curd every single morning.",
  author_name: "Ashok Chavakula",
  status: "published",
  is_featured: false,
  order_id: 42,
  created_at: "2026-09-01T05:00:00Z",
  product_name: "Buffalo Milk 500ml",
  ...over,
});

const respond = ({ rows = [review()], featuredCount = 0, maxFeatured = 6 } = {}) =>
  reviewsApi.getReviews.mockResolvedValue({
    success: true,
    data: rows,
    pagination: { page: 1, limit: 50, total: rows.length, pages: 1 },
    meta: { featuredCount, maxFeatured },
  });

const toggleFor = (author = "Ashok Chavakula") =>
  screen.getByRole("switch", { name: new RegExp(`feature review by ${author}`, "i") });

beforeEach(() => {
  vi.clearAllMocks();
  reviewsApi.setFeatured.mockResolvedValue({ success: true, data: {} });
});

describe("loading and listing", () => {
  it("shows a loading state before the list arrives", () => {
    reviewsApi.getReviews.mockReturnValue(new Promise(() => {}));
    render(<Reviews />);

    expect(screen.getByText(/loading reviews/i)).toBeInTheDocument();
  });

  it("renders the customer's words", async () => {
    respond();
    render(<Reviews />);

    expect(await screen.findByText(/Thick curd every single morning/)).toBeInTheDocument();
  });

  it("shows which product the review is about", async () => {
    respond({ rows: [review({ product_name: "Gir Cow Ghee 500g" })] });
    render(<Reviews />);

    expect(await screen.findByText("Gir Cow Ghee 500g")).toBeInTheDocument();
  });

  it("flags a review whose product was deleted rather than hiding it", async () => {
    // An orphan is exactly what an operator needs to see and clean up, even
    // though a shopper should never be shown a quote about nothing.
    respond({ rows: [review({ product_name: null })] });
    render(<Reviews />);

    expect(await screen.findByText(/product removed/i)).toBeInTheDocument();
  });

  it("surfaces a load failure instead of showing an empty screen", async () => {
    reviewsApi.getReviews.mockRejectedValue(new Error("Server unavailable"));
    render(<Reviews />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/server unavailable/i);
  });

  it("offers no way to author a review", async () => {
    // Load-bearing absence. An admin who could write one would recreate the
    // fabricated-testimonial problem this whole feature exists to fix.
    respond();
    render(<Reviews />);

    await screen.findByText(/Thick curd/);
    expect(screen.queryByRole("button", { name: /add|create|new review|write/i })).not.toBeInTheDocument();
  });
});

describe("empty states", () => {
  it("explains that reviews appear once customers write them", async () => {
    respond({ rows: [] });
    render(<Reviews />);

    expect(await screen.findByText(/no customer reviews yet/i)).toBeInTheDocument();
  });

  it("gives a different message when the featured filter hides everything", async () => {
    // "Nothing here" means two different things depending on the filter, and
    // the wrong one sends an operator looking for a bug.
    respond({ rows: [review()] });
    render(<Reviews />);
    await screen.findByText(/Thick curd/);

    respond({ rows: [] });
    await userEvent.click(screen.getByRole("checkbox", { name: /show only featured/i }));

    expect(await screen.findByText(/no reviews are featured yet/i)).toBeInTheDocument();
  });

  it("refetches with the filter when it is switched on", async () => {
    respond({ rows: [review()] });
    render(<Reviews />);
    await screen.findByText(/Thick curd/);

    await userEvent.click(screen.getByRole("checkbox", { name: /show only featured/i }));

    await waitFor(() =>
      expect(reviewsApi.getReviews).toHaveBeenLastCalledWith(
        expect.objectContaining({ featured: true })
      )
    );
  });
});

describe("home page slot accounting", () => {
  it("reports how many slots are used", async () => {
    respond({ featuredCount: 3, maxFeatured: 6 });
    render(<Reviews />);

    expect(await screen.findByText(/3 of 6 home page slots used/i)).toBeInTheDocument();
  });

  it("updates the count when a review is promoted", async () => {
    respond({ featuredCount: 2 });
    render(<Reviews />);
    await screen.findByText(/2 of 6/i);

    await userEvent.click(toggleFor());

    expect(await screen.findByText(/3 of 6/i)).toBeInTheDocument();
  });

  it("updates the count when a review is demoted", async () => {
    respond({ rows: [review({ is_featured: true })], featuredCount: 3 });
    render(<Reviews />);
    await screen.findByText(/3 of 6/i);

    await userEvent.click(toggleFor());

    expect(await screen.findByText(/2 of 6/i)).toBeInTheDocument();
  });
});

describe("what may be promoted", () => {
  it("allows a published review that has written text", async () => {
    respond();
    render(<Reviews />);
    await screen.findByText(/Thick curd/);

    expect(toggleFor()).toBeEnabled();
  });

  it("blocks a rating-only review", async () => {
    // Five stars with no words is a fine review and a useless testimonial —
    // the public query filters it out anyway, so featuring it would look broken.
    respond({ rows: [review({ body: null })] });
    render(<Reviews />);
    await screen.findByText(/rating only/i);

    expect(toggleFor()).toBeDisabled();
  });

  it("explains why a rating-only review cannot be used", async () => {
    respond({ rows: [review({ body: null })] });
    render(<Reviews />);

    expect(await screen.findByText(/cannot be a testimonial/i)).toBeInTheDocument();
  });

  it("blocks a whitespace-only body", async () => {
    respond({ rows: [review({ body: "   " })] });
    render(<Reviews />);
    await screen.findByText(/rating only/i);

    expect(toggleFor()).toBeDisabled();
  });

  it("blocks an unpublished review", async () => {
    respond({ rows: [review({ status: "pending" })] });
    render(<Reviews />);
    await screen.findByText(/Thick curd/);

    expect(toggleFor()).toBeDisabled();
  });

  it("shows the status of a review that is not published", async () => {
    respond({ rows: [review({ status: "rejected" })] });
    render(<Reviews />);

    expect(await screen.findByText("REJECTED")).toBeInTheDocument();
  });

  it("blocks promotion once every slot is taken", async () => {
    respond({ featuredCount: 6, maxFeatured: 6 });
    render(<Reviews />);
    await screen.findByText(/Thick curd/);

    expect(toggleFor()).toBeDisabled();
  });
});

describe("demotion is never blocked", () => {
  it("allows unfeaturing when the cap is full", async () => {
    respond({ rows: [review({ is_featured: true })], featuredCount: 6, maxFeatured: 6 });
    render(<Reviews />);
    await screen.findByText(/Thick curd/);

    expect(toggleFor()).toBeEnabled();
  });

  it("allows unfeaturing a review that has lost its text", async () => {
    // A featured review can later be edited or unpublished. If the promotion
    // guards applied to demotion it would be stuck on the home page.
    respond({ rows: [review({ is_featured: true, body: null })] });
    render(<Reviews />);
    await screen.findByText(/rating only/i);

    expect(toggleFor()).toBeEnabled();
  });

  it("allows unfeaturing an unpublished review", async () => {
    respond({ rows: [review({ is_featured: true, status: "rejected" })] });
    render(<Reviews />);
    await screen.findByText(/Thick curd/);

    expect(toggleFor()).toBeEnabled();
  });
});

describe("toggling", () => {
  it("sends the desired state, not a flip", async () => {
    // An idempotent call: a retried request lands where it was aimed rather
    // than undoing itself.
    respond();
    render(<Reviews />);
    await screen.findByText(/Thick curd/);

    await userEvent.click(toggleFor());

    expect(reviewsApi.setFeatured).toHaveBeenCalledWith(1, true);
  });

  it("sends false when demoting", async () => {
    respond({ rows: [review({ is_featured: true })], featuredCount: 1 });
    render(<Reviews />);
    await screen.findByText(/Thick curd/);

    await userEvent.click(toggleFor());

    expect(reviewsApi.setFeatured).toHaveBeenCalledWith(1, false);
  });

  it("reflects the new state on the row", async () => {
    respond();
    render(<Reviews />);
    await screen.findByText(/Thick curd/);

    await userEvent.click(toggleFor());

    await waitFor(() => expect(toggleFor()).toBeChecked());
    expect(await screen.findByText(/on home page/i)).toBeInTheDocument();
  });

  it("warns that the change is not instant", async () => {
    // The customer backend caches featured reviews for a minute and runs in a
    // different process, so it cannot be invalidated from here. An operator who
    // is not told this reasonably concludes the toggle failed.
    respond();
    render(<Reviews />);
    await screen.findByText(/Thick curd/);

    await userEvent.click(toggleFor());

    expect(await screen.findByRole("alert")).toHaveTextContent(/within a minute/i);
  });

  it("shows the server's own refusal rather than a generic error", async () => {
    // The API writes these for a human: "The home page shows 6 testimonials.
    // Unfeature one before adding another."
    respond();
    reviewsApi.setFeatured.mockRejectedValue(
      new Error("The home page shows 6 testimonials. Unfeature one before adding another.")
    );
    render(<Reviews />);
    await screen.findByText(/Thick curd/);

    await userEvent.click(toggleFor());

    expect(await screen.findByRole("alert")).toHaveTextContent(/unfeature one before adding another/i);
  });

  it("leaves the row unchanged when the save fails", async () => {
    respond();
    reviewsApi.setFeatured.mockRejectedValue(new Error("nope"));
    render(<Reviews />);
    await screen.findByText(/Thick curd/);

    await userEvent.click(toggleFor());

    await screen.findByRole("alert");
    expect(toggleFor()).not.toBeChecked();
  });
});

describe("verified purchase", () => {
  it("badges a review backed by an order", async () => {
    respond({ rows: [review({ order_id: 42 })] });
    render(<Reviews />);

    expect(await screen.findByText(/verified purchase/i)).toBeInTheDocument();
  });

  it("does not badge a review with no backing order", async () => {
    respond({ rows: [review({ order_id: null })] });
    render(<Reviews />);
    await screen.findByText(/Thick curd/);

    expect(screen.queryByText(/verified purchase/i)).not.toBeInTheDocument();
  });

  it("shows the rating the customer actually gave", async () => {
    respond({ rows: [review({ rating: 3 })] });
    render(<Reviews />);

    const stars = await screen.findByLabelText("3 out of 5");
    expect(within(stars).queryByText("★★★")).not.toBeNull();
  });
});
