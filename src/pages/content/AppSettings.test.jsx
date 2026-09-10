// ============================================================
//  Admin → Content → App Settings.
//
//  Four of these keys drive the announcement bar that appears above every page
//  of the customer site. A bad save here is visible to every visitor within a
//  minute, so the guards that stop a broken save are the point of this screen.
//
//  The validation is deliberately duplicated between this page and the API.
//  Blocking Save is kinder than a round-trip that comes back red, but the
//  server is still the authority — these tests cover the client half.
// ============================================================

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../api", () => ({
  contentApi: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

import { contentApi } from "../../api";
import AppSettings from "./AppSettings";
import { ANNOUNCEMENT_MESSAGE_MAX } from "./announcementSettings";

const setting = (key, value, type = "text", extra = {}) => ({
  key,
  value,
  type,
  description: `${key} description`,
  ...extra,
});

const ANNOUNCEMENT_DEFAULTS = (over = {}) => [
  setting("announcement_enabled", over.enabled ?? "false", "boolean"),
  setting("announcement_message", over.message ?? "Ordering is paused for maintenance.", "text"),
  setting("announcement_variant", over.variant ?? "maintenance", "select", {
    options: ["maintenance", "info", "warning", "success"],
  }),
  setting("announcement_dismissible", over.dismissible ?? "false", "boolean"),
];

const respond = (rows) =>
  contentApi.getSettings.mockResolvedValue({ success: true, data: rows });

const saveButton = () => screen.getByRole("button", { name: /save changes/i });

beforeEach(() => {
  vi.clearAllMocks();
  contentApi.updateSettings.mockImplementation((payload) =>
    Promise.resolve({
      success: true,
      data: Object.entries(payload).map(([key, value]) => setting(key, value)),
    })
  );
});

describe("loading", () => {
  it("shows a loading state before settings arrive", () => {
    contentApi.getSettings.mockReturnValue(new Promise(() => {}));
    render(<AppSettings />);

    expect(screen.getByText(/loading settings/i)).toBeInTheDocument();
  });

  it("surfaces a load failure", async () => {
    contentApi.getSettings.mockRejectedValue(new Error("Settings unavailable"));
    render(<AppSettings />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/settings unavailable/i);
  });

  it("renders a non-announcement setting in the generic list", async () => {
    respond([...ANNOUNCEMENT_DEFAULTS(), setting("delivery_fee", "20", "number")]);
    render(<AppSettings />);

    expect(await screen.findByText(/Delivery Fee/i)).toBeInTheDocument();
  });

  it("keeps announcement keys out of the generic list", async () => {
    // They are edited by their own card; showing them twice would let an
    // operator change the same value in two places with different validation.
    respond(ANNOUNCEMENT_DEFAULTS());
    render(<AppSettings />);

    await waitFor(() => expect(saveButton()).toBeInTheDocument());
    expect(screen.queryByText(/Announcement Message description/i)).not.toBeInTheDocument();
  });
});

describe("guards that block a broken save", () => {
  it("blocks enabling the bar with no message", async () => {
    // An enabled bar with nothing to say paints an empty strip across every
    // customer page.
    respond(ANNOUNCEMENT_DEFAULTS({ enabled: "true", message: "" }));
    render(<AppSettings />);

    await waitFor(() => expect(saveButton()).toBeDisabled());
  });

  it("blocks a whitespace-only message", async () => {
    respond(ANNOUNCEMENT_DEFAULTS({ enabled: "true", message: "    " }));
    render(<AppSettings />);

    await waitFor(() => expect(saveButton()).toBeDisabled());
  });

  it("allows an empty message while the bar is switched off", async () => {
    // Only the combination is invalid. Clearing the text before turning the bar
    // on is a legitimate order of operations.
    respond(ANNOUNCEMENT_DEFAULTS({ enabled: "false", message: "" }));
    render(<AppSettings />);

    await waitFor(() => expect(saveButton()).toBeEnabled());
  });

  it("blocks a message longer than the limit", async () => {
    respond(
      ANNOUNCEMENT_DEFAULTS({
        enabled: "true",
        message: "x".repeat(ANNOUNCEMENT_MESSAGE_MAX + 1),
      })
    );
    render(<AppSettings />);

    await waitFor(() => expect(saveButton()).toBeDisabled());
  });

  it("allows a message exactly at the limit", async () => {
    // Boundary: the limit is inclusive on the server, so it must be here too.
    respond(
      ANNOUNCEMENT_DEFAULTS({
        enabled: "true",
        message: "x".repeat(ANNOUNCEMENT_MESSAGE_MAX),
      })
    );
    render(<AppSettings />);

    await waitFor(() => expect(saveButton()).toBeEnabled());
  });

  it("blocks an over-long message even when the bar is off", async () => {
    // The server rejects the value regardless of the toggle, so blocking only
    // when enabled would still produce a failed round-trip.
    respond(
      ANNOUNCEMENT_DEFAULTS({
        enabled: "false",
        message: "x".repeat(ANNOUNCEMENT_MESSAGE_MAX + 1),
      })
    );
    render(<AppSettings />);

    await waitFor(() => expect(saveButton()).toBeDisabled());
  });
});

describe("saving", () => {
  it("sends every setting in one request, announcement keys included", async () => {
    // The card is a nicer editor for four rows, not a second endpoint.
    respond([...ANNOUNCEMENT_DEFAULTS(), setting("delivery_fee", "20", "number")]);
    render(<AppSettings />);
    await waitFor(() => expect(saveButton()).toBeEnabled());

    await userEvent.click(saveButton());

    await waitFor(() => expect(contentApi.updateSettings).toHaveBeenCalled());
    const payload = contentApi.updateSettings.mock.calls[0][0];
    expect(payload).toHaveProperty("delivery_fee", "20");
    expect(payload).toHaveProperty("announcement_enabled");
    expect(payload).toHaveProperty("announcement_message");
  });

  it("confirms a successful save", async () => {
    respond(ANNOUNCEMENT_DEFAULTS());
    render(<AppSettings />);
    await waitFor(() => expect(saveButton()).toBeEnabled());

    await userEvent.click(saveButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(/settings saved/i);
  });

  it("surfaces the server's refusal", async () => {
    respond(ANNOUNCEMENT_DEFAULTS());
    contentApi.updateSettings.mockRejectedValue(
      new Error("announcement_variant must be one of: maintenance, info, warning, success")
    );
    render(<AppSettings />);
    await waitFor(() => expect(saveButton()).toBeEnabled());

    await userEvent.click(saveButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(/must be one of/i);
  });

  it("re-enables Save after a failed attempt", async () => {
    // A save that fails must be retryable; leaving the button disabled would
    // strand the operator on a screen with unsaved edits.
    respond(ANNOUNCEMENT_DEFAULTS());
    contentApi.updateSettings.mockRejectedValue(new Error("boom"));
    render(<AppSettings />);
    await waitFor(() => expect(saveButton()).toBeEnabled());

    await userEvent.click(saveButton());

    await screen.findByRole("alert");
    await waitFor(() => expect(saveButton()).toBeEnabled());
  });
});

describe("generic setting rows", () => {
  it("renders a select for a select-typed key", async () => {
    // Without the select branch the fallback renders <input type="select">,
    // which browsers silently treat as a free-text box — and a typo'd value is
    // then rejected by the API on save.
    respond([
      ...ANNOUNCEMENT_DEFAULTS(),
      setting("payment_mode", "live", "select", { options: ["test", "live"] }),
    ]);
    render(<AppSettings />);

    const select = await screen.findByRole("combobox");
    expect(select).toHaveValue("live");
    expect(within_options(select)).toEqual(["test", "live"]);
  });

  it("renders a switch-like control for a boolean key", async () => {
    respond([...ANNOUNCEMENT_DEFAULTS(), setting("maintenance_mode", "false", "boolean")]);
    render(<AppSettings />);

    expect(await screen.findByText(/^Disabled$/)).toBeInTheDocument();
  });

  it("edits a text setting", async () => {
    respond([...ANNOUNCEMENT_DEFAULTS(), setting("support_phone", "9999999999", "text")]);
    render(<AppSettings />);

    const input = await screen.findByDisplayValue("9999999999");
    await userEvent.clear(input);
    await userEvent.type(input, "8888888888");

    expect(input).toHaveValue("8888888888");
  });
});

function within_options(select) {
  return Array.from(select.querySelectorAll("option")).map((o) => o.value);
}
