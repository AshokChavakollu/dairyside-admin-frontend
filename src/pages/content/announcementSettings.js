// Shared constants for the customer announcement bar.
//
// They live in their own module rather than in AnnouncementBarCard.jsx so that
// file exports components only — Vite's fast refresh drops a component file
// from the HMR boundary the moment it also exports something else, which turns
// every edit to the card into a full page reload.

// The four app_settings keys the announcement card owns. AppSettings filters
// them out of its generic key/value list so they are edited once, in the card,
// not twice in two different shapes.
export const ANNOUNCEMENT_KEYS = [
  'announcement_enabled',
  'announcement_message',
  'announcement_variant',
  'announcement_dismissible',
]

// Kept in step with the backend's ANNOUNCEMENT_MESSAGE_MAX
// (admin-backend → services/marketingService.js). Enforced on this side only so
// the counter can warn before Save; the API is what actually rejects.
export const ANNOUNCEMENT_MESSAGE_MAX = 200
