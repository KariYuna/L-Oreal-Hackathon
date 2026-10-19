# Prototype verification

## Local agent implementation — October 19, 2026

- `npm run check` and 13 tests pass, including a real local HTTP API exercise of profile/product/check-in persistence, image upload using the sample portrait, invalid input, emergency chat path and scoped data deletion.
- Qwen3 8B Q4_K_M was downloaded from the official Ollama library and verified in a live structured-output chat on the RTX 4060 Laptop GPU. A second extraction pass proposed an explicit Beijing/Student profile edit, while the UI requires the user to review it before saving.
- OpenCV photo dependencies installed in `.venv`. The original project’s face XML and pixel-analysis module were copied into `vision/original` for a self-contained app; its scoring and product rules were deliberately excluded.
- Product shelf, completion checkbox, evening theme and profile save/reload were checked in an isolated browser session. A sample photo was analyzed through the browser, saved as a check-in without retaining its original, and appeared in the journal. A browser chat with the local Qwen model responded cautiously to stinging and proposed a Beijing profile update; saving the reviewed update changed the visible advisor context. The production server now responds on `http://localhost:4173` with the new API and model-ready status. The preview tab is open in Codex.
- WhatsApp, Telegram and WeChat remain visual connection options. Follow-ups are local in-app only and require opt-in. Real platform messages, purchases, live prices and clinical photo claims are outside this implementation.

The sections below are retained from the earlier front-end prototype and are historical. The current feature and launch instructions are in `README.md`.

## Profile and messaging update — October 10, 2026

- Syntax checks passed for the client scripts and server.
- Seven storage tests passed: persistence of all fields, blank optional fields, rejected edits preserving saved data, corrupt/incompatible stored data, blocked/quota-limited storage, scoped reset, and HTML escaping.
- Browser tests used a separate localhost port (4174) to keep synthetic test profiles separate from the user's application on port 4173.
- All eight personal-information fields were changed, saved, and reloaded successfully. The sidebar, dashboard greeting/location, and advisor context displayed the saved values.
- The default name is Jamie Chan. Profile and existing preview dropdown markup now contains valid option elements.
- WhatsApp, Telegram, and WeChat are UI-only options, with no account or messaging API calls.
- All three connection buttons opened the correct preview dialogs. The Messaging apps shortcut scrolled to the section. Desktop and 390 × 844 mobile layouts were inspected; the mobile page had no horizontal overflow.
- No application errors were reported in the browser console during these checks. Temporary viewport overrides were reset afterward.
- Browser-local persistence is now implemented; the historical design-only notes below describe the previous version and no longer apply to profile saving.
- macOS portability was checked at the source/dependency level. A physical Mac/Safari run was not available; README includes macOS launch instructions and browser-storage limits.

## Original design-only smoke checks

Verified on October 10, 2026, before the profile persistence update.

- `npm run check` passed for the client JavaScript and static server.
- The local preview returned HTTP 200.
- Both local dashboard images loaded successfully.
- Desktop layout was visually inspected at 1440 × 1000, including the overview, advisor, and product shelf.
- Mobile layouts were checked at 390 × 844. No horizontal overflow was reported for the overview, check-in, advisor, routine, journey, shelf, or profile views.
- Main navigation, mobile drawer navigation, AM/PM selection, advisor suggestion chips, send-preview feedback, photo-preview dialog, reminder-preview feedback, product filters, and profile-edit feedback were exercised.
- Revisiting the profile restored the sample city, confirming that edits were not persisted.
- Hidden mobile navigation is inert; opening it makes the background inert. The drawer supports Escape, a close button, and a keyboard focus loop. Dialogs use the native modal dialog element. A skip-to-content link and reduced-motion styles are included.
- No application errors were reported by the browser console during the inspected flow.
- Source inspection found no use of fetch, XMLHttpRequest, localStorage, sessionStorage, IndexedDB, camera access, or browser notification APIs.
- The temporary browser viewport override was reset after checking. The preview tab was retained for the user.

The browser automation's `selectOption` command did not work on the reminder dropdown; keyboard interaction was used instead. This was an automation interaction limit, not a reported JavaScript error.

These are prototype smoke checks, not a full accessibility audit, cross-browser certification, clinical validation, or verification of future backend features. Google Fonts remains an optional external typography request with local font fallbacks. No user form content is transmitted.
