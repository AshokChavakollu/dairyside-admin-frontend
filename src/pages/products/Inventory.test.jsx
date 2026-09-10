// ============================================================
//  Admin → Inventory.
//
//  This screen moves real stock. A restock that fires with a bad number, or an
//  adjustment that lands without a reason, is not a UI bug — it is a wrong
//  count on a real product and an audit trail that cannot explain itself.
//
//  So the tests below are mostly about the calls that must NOT happen. Each
//  guard is asserted twice: that the operator is told why, and that the API was
//  never reached. Only checking the toast would pass a component that showed a
//  warning and mutated stock anyway.
// ============================================================

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../api", () => ({
  inventoryApi: {
    lowStock: vi.fn(),
    variants: vi.fn(),
    ledger: vi.fn(),
    restock: vi.fn(),
    adjust: vi.fn(),
    setThreshold: vi.fn(),
  },
}));

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { inventoryApi } from "../../api";
import { toast } from "react-toastify";
import Inventory from "./Inventory";

const variant = (over = {}) => ({
  product_variant_id: 7,
  product_name: "Buffalo Milk",
  sku: "BM-500",
  size_label: "500ml",
  stock_quantity: 12,
  low_stock_threshold: null,
  effective_threshold: 5,
  ...over,
});

const seed = (rows = [variant()]) => {
  inventoryApi.lowStock.mockResolvedValue({ data: [] });
  inventoryApi.variants.mockResolvedValue({ data: rows });
  inventoryApi.ledger.mockResolvedValue({ data: [] });
};

/**
 * Open one of the three modals on the first row.
 *
 * getAll…[0] throughout: DataTable renders the same row twice — a table for
 * wide screens and a card list for narrow ones — and jsdom has no viewport, so
 * both are in the document at once. Every row-level query therefore matches
 * two elements, and a strict getBy would throw.
 */
const openModal = async (name) => {
  await screen.findAllByText("Buffalo Milk");
  const buttons = screen.getAllByRole("button", { name: new RegExp(`^${name}$`, "i") });
  await userEvent.click(buttons[0]);
};

const confirm = () => userEvent.click(screen.getAllByRole("button", { name: /^confirm$/i })[0]);

const typeInto = async (placeholder, value) => {
  const field = screen.getAllByPlaceholderText(placeholder)[0];
  await userEvent.clear(field);
  if (value !== "") await userEvent.type(field, value);
};

beforeEach(() => {
  vi.clearAllMocks();
  seed();
  inventoryApi.restock.mockResolvedValue({ success: true });
  inventoryApi.adjust.mockResolvedValue({ success: true });
  inventoryApi.setThreshold.mockResolvedValue({ success: true });
  render(<Inventory />);
});

describe("restock — quantity must be a positive whole number", () => {
  const rejects = async (value) => {
    await openModal("Restock");
    await typeInto("e.g. supplier delivery", "");
    if (value !== "") {
      const qty = screen.getAllByRole("spinbutton")[0];
      await userEvent.clear(qty);
      await userEvent.type(qty, value);
    }
    await confirm();

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(inventoryApi.restock).not.toHaveBeenCalled();
  };

  it("refuses an empty quantity", async () => {
    await rejects("");
  });

  it("refuses zero", async () => {
    await rejects("0");
  });

  it("refuses a negative quantity — that is what Adjust is for", async () => {
    await rejects("-5");
  });

  it("refuses a fractional quantity", async () => {
    // You cannot receive half a bottle, and Number('1.5') is a valid number —
    // only the Number.isInteger check stops it.
    await rejects("1.5");
  });

  it("accepts a positive whole number and sends it", async () => {
    await openModal("Restock");
    const qty = screen.getAllByRole("spinbutton")[0];
    await userEvent.type(qty, "24");
    await confirm();

    await waitFor(() => expect(inventoryApi.restock).toHaveBeenCalledWith(7, { qty: 24, note: undefined }));
  });

  it("passes a note through when one is given", async () => {
    await openModal("Restock");
    await userEvent.type(screen.getAllByRole("spinbutton")[0], "10");
    await typeInto("e.g. supplier delivery", "morning delivery");
    await confirm();

    await waitFor(() =>
      expect(inventoryApi.restock).toHaveBeenCalledWith(7, { qty: 10, note: "morning delivery" })
    );
  });
});

describe("adjust — a signed correction that must be explained", () => {
  const fill = async (delta, note) => {
    await openModal("Adjust");
    if (delta !== "") await userEvent.type(screen.getAllByPlaceholderText("e.g. -3")[0], delta);
    if (note !== "") await userEvent.type(screen.getAllByPlaceholderText(/explain why/i)[0], note);
    await confirm();
  };

  it("refuses a zero delta — an adjustment that changes nothing", async () => {
    await fill("0", "spoilage");

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(inventoryApi.adjust).not.toHaveBeenCalled();
  });

  it("refuses an empty delta", async () => {
    await fill("", "spoilage");

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(inventoryApi.adjust).not.toHaveBeenCalled();
  });

  it("refuses a fractional delta", async () => {
    await fill("2.5", "spoilage");

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(inventoryApi.adjust).not.toHaveBeenCalled();
  });

  it("REQUIRES a note — the ledger has to be able to explain itself", async () => {
    // A stock movement with no reason is unauditable six months later, when
    // somebody is trying to work out where the count went wrong.
    await fill("-3", "");

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(inventoryApi.adjust).not.toHaveBeenCalled();
  });

  it("refuses a whitespace-only note", async () => {
    await fill("-3", "   ");

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(inventoryApi.adjust).not.toHaveBeenCalled();
  });

  it("ACCEPTS a negative delta — removing stock is the normal case", async () => {
    // Spoilage, breakage, a miscount. Rejecting negatives here would make the
    // screen useless for the thing it is mostly used for.
    await fill("-3", "3 bottles broken in transit");

    await waitFor(() =>
      expect(inventoryApi.adjust).toHaveBeenCalledWith(7, {
        delta: -3,
        reason: "ADJUSTMENT",
        note: "3 bottles broken in transit",
      })
    );
  });

  it("accepts a positive delta", async () => {
    await fill("4", "recount");

    await waitFor(() =>
      expect(inventoryApi.adjust).toHaveBeenCalledWith(7, expect.objectContaining({ delta: 4 }))
    );
  });

  it("trims the note before sending it", async () => {
    await fill("-1", "  spoiled  ");

    await waitFor(() =>
      expect(inventoryApi.adjust).toHaveBeenCalledWith(7, expect.objectContaining({ note: "spoiled" }))
    );
  });
});

describe("threshold", () => {
  it("sends null when cleared, restoring the default", async () => {
    // '' must become null, not 0 — a threshold of 0 means "never warn me",
    // which is the opposite of falling back to the default.
    await openModal("Threshold");
    await typeInto("blank = default", "");
    await confirm();

    await waitFor(() => expect(inventoryApi.setThreshold).toHaveBeenCalledWith(7, { threshold: null }));
  });

  it("sends a number when one is entered", async () => {
    await openModal("Threshold");
    await typeInto("blank = default", "8");
    await confirm();

    await waitFor(() => expect(inventoryApi.setThreshold).toHaveBeenCalledWith(7, { threshold: 8 }));
  });

  it("accepts zero as a deliberate never-warn setting", async () => {
    await openModal("Threshold");
    await typeInto("blank = default", "0");
    await confirm();

    await waitFor(() => expect(inventoryApi.setThreshold).toHaveBeenCalledWith(7, { threshold: 0 }));
  });
});

describe("after the call", () => {
  it("closes the modal and refreshes on success", async () => {
    await openModal("Restock");
    await userEvent.type(screen.getAllByRole("spinbutton")[0], "5");
    const callsBefore = inventoryApi.variants.mock.calls.length;
    await confirm();

    await waitFor(() => expect(screen.queryAllByRole("button", { name: /^confirm$/i })).toHaveLength(0));
    await waitFor(() => expect(inventoryApi.variants.mock.calls.length).toBeGreaterThan(callsBefore));
  });

  it("keeps the modal open when the server refuses, so the input is not lost", async () => {
    inventoryApi.restock.mockRejectedValue({ response: { data: { error: "Variant not found" } } });
    await openModal("Restock");
    await userEvent.type(screen.getAllByRole("spinbutton")[0], "5");
    await confirm();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Variant not found"));
    expect(screen.getAllByRole("button", { name: /^confirm$/i })[0]).toBeInTheDocument();
  });

  it("surfaces the server's message rather than a generic one", async () => {
    inventoryApi.adjust.mockRejectedValue({ response: { data: { error: "Stock cannot go negative" } } });
    await openModal("Adjust");
    await userEvent.type(screen.getAllByPlaceholderText("e.g. -3")[0], "-99");
    await userEvent.type(screen.getAllByPlaceholderText(/explain why/i)[0], "recount");
    await confirm();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Stock cannot go negative"));
  });
});
