// Vitest setup for the admin panel's component tests.
//
// The admin UI had no tests at all before this. It is the surface where a
// mistake is silent and expensive — promoting the wrong review, mispricing a
// setting, mis-toggling a switch that every customer then sees.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// jsdom ships neither, and both are reached during render rather than being
// optional — their absence throws instead of degrading.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
