# Lumière — skincare companion concept

> **October 2026 implementation update:** This document began as the front-end design plan. The current app now runs local Qwen3 8B chat, saved profile/product/journal data, in-app opt-in follow-ups, Open-Meteo weather and the limited OpenCV photo pipeline. See `README.md` and `VISION_RECOMMENDATIONS.md` for the live scope and limits. The tables below describe earlier design intentions; entries labelled future or preview may now be implemented.

Lumière helps skincare beginners describe what they notice, build a manageable routine, and reflect on how they feel over time. Its distinguishing feature is continuity: it remembers confirmed preferences and offers useful, permission-based follow-ups after the conversation ends.

This is a hackathon concept inspired by L’Oréal Paris, not an official L’Oréal application. The deliverable is a front-end prototype with working browser-local profile saving. Jamie Chan is the default sample user. Conversations, dates, progress, reminders, and product packaging remain illustrative.

## What is in the prototype

| Screen | What it communicates | What works now |
| --- | --- | --- |
| My overview | Personal greeting, advisor entry point, daily routine, feeling check-in, progress, and next follow-up | Navigation, AM/PM view selection, feeling selection, explanatory dialogs |
| Beauty advisor | Empathetic conversation, clarifying questions, remembered context, photo and voice entry points | Scripted conversation, editable text box, suggestion chips, preview feedback |
| Skin check-in | Photo framing guidance, consent, symptom location, duration, and personal notes | Editable sample form and photo-tool previews; no camera or upload access |
| My routine | A minimal morning/evening plan and reminder preferences | AM/PM switching and temporary setting changes |
| My skin journey | Self-reported comfort, journal entries, routine consistency, and follow-up milestones | Sample timeline and chart, navigation to another check-in |
| My product shelf | Explainable product matching, saved products, products already owned | Shelf filters and product-tool previews; no shopping or real recommendations |
| My profile | Approximate age, city, experience, budget, routine, sensitivities, privacy choices, and messaging apps | Working local save/load/reset for profile fields; WhatsApp, Telegram, and WeChat connections remain display-only |

Profile submission now validates and saves its fields in localStorage. Saved details update the greeting, sidebar, profile, and advisor context. No AI response is generated and no external message is sent. Other forms and switches remain previews. The new messaging-app section demonstrates optional future channels, explicitly marked Not connected / Coming soon. Actual account linking would require platform-specific implementation and an explicit opt-in; no credentials or contacts are collected in this version.

## Proposed agent tools

These are future interfaces, not implemented functions. The model should choose among narrow tools with validated inputs, rather than have unrestricted access to databases or notification systems.

| Tool | Purpose and inputs | Output and important behavior | UI location |
| --- | --- | --- | --- |
| `understand_concern` | Convert a user's ordinary language into structured observations: area, sensation, duration, severity, recent changes, and questions still unanswered | Preserve the original wording; distinguish observations from hypotheses; ask a few useful questions without forcing a diagnosis | Beauty advisor, Skin check-in |
| `assess_care_boundary` | Check symptom descriptions and reported reactions before advice or product matching | Decide whether the conversation can continue with general cosmetic guidance or needs professional/urgent care guidance; do not derive this from a redness threshold | Advisor and check-in guidance |
| `read_profile` | Retrieve only relevant, consented profile details | Return confirmed facts with provenance, last-confirmed dates, and unknown fields; avoid collecting unnecessary personal information | Advisor context card |
| `propose_profile_update` / `confirm_profile_update` | Extract an explicit change such as “I moved to Shanghai” or “my budget changed” | Show old → new values for confirmation; apply only approved changes; support field-level deletion and correction | My profile, Beauty advisor |
| `get_environment_context` | Use an opted-in city and date to retrieve weather, humidity, or UV information | Return timestamp, source, location granularity, and retrieval status. Explain that environment is context, not proof of the cause of a symptom. Do not invent live conditions when unavailable | Overview and advisor |
| `analyze_face_photo` | Analyze a consented image after checking one face, focus, exposure, and framing | Return image measurements, quality flags, limitations, and version metadata. Do not infer age, ethnicity, identity, hydration, or a clinical condition | Skin check-in |
| `retrieve_care_information` | Retrieve concise, reviewed skincare guidance relevant to the user's question | Ground advice in authoritative sources with dates and links; separate product instructions from general educational advice | Beauty advisor, routine instructions |
| `match_products` | Query an approved local L’Oréal catalogue using preferences, budget, age band where relevant, existing routine, reported sensitivities, and current concerns | Filter unsuitable candidates first, then rank. Return exact SKU, ingredient list, local availability and price with timestamps, explanation, alternatives, and uncertainty. “No suitable suggestion yet” must be a valid outcome | My product shelf |
| `build_or_adjust_routine` | Turn confirmed needs, tolerated products, and available time into a short plan | Morning/evening steps, verified label instructions, order of use, and tolerance follow-ups; reuse existing products where possible | My routine |
| `record_product_status` | Ask whether a product arrived and whether the user actually started it | Distinguish suggested, saved, ordered, received, started, paused, and stopped. Do not treat a recommendation as a purchase | My shelf, check-ins |
| `plan_follow_up` / `cancel_follow_up` | Create or cancel a permission-based follow-up tied to a confirmed event | Store due time, timezone, reason, channel consent, quiet hours, and a deduplication key. Return a schedule receipt or cancellation status | Reminder preferences and journey |
| `record_check_in` | Save a user's own description of comfort, tolerance, routine adherence, and optionally a consented photo | Timestamped journal entry; never silently turn a feeling into a diagnostic label | Skin check-in, My skin journey |
| `summarize_progress` | Compare appropriately collected entries and surface questions worth asking | Explain trends and missing data. Do not claim improvement proves a particular diagnosis or that a product caused it | My skin journey |
| `manage_personal_data` | List, correct, export, or delete stored records within a user's scope | Explicit record selection and clear retention/deletion results, including scheduled jobs and stored photos | My profile |

## The follow-up experience

Interpretation: “AP / Agent Service Provider” in the brief is treated here as the backend service that routes scheduled agent messages. If it instead means a particular platform or human provider, that adapter can be changed without changing the user experience.

1. The user describes discomfort. The advisor acknowledges it and asks about duration, severity, and recent products.
2. The advisor uses relevant confirmed profile information and establishes whether cosmetic advice is appropriate.
3. If appropriate, it suggests a small routine and explains any product shortlist. The user can also choose to use existing products.
4. The user opts into follow-ups. A confirmed purchase or product start event creates the first follow-up; a scheduler delivers it 2–3 days later in the user's timezone.
5. The follow-up asks whether the product arrived, whether use started, and whether there was irritation. If it has not arrived, offer to postpone. Do not send usage instructions as though use has already begun.
6. If the product is tolerated, offer instructions grounded in that specific label. If discomfort appears or worsens, pause product promotion and respond appropriately.
7. After 1–2 weeks, ask about comfort and how the routine fits. Frequency can be changed, paused, or stopped at any time.
8. Explore another goal only when the user wants to. A new goal should not automatically create a new purchase.

The model does not “wake up” by itself. A durable scheduler or queue executes jobs, a notification adapter delivers them, and delivery/reply events update state. Every job should re-check consent and cancellation state immediately before delivery. Persist due times in UTC, preserve the user's timezone, deduplicate jobs, cap frequency, and stop nudging after a reasonable non-response policy. Retry technical failures without sending duplicates. Do not put sensitive skin details in lock-screen previews.

Suggested states: `awaiting_context → routine_proposed → user_confirmed → awaiting_start → tolerance_check_due → habit_check_due → maintenance`, with `paused`, `cancelled`, and `needs_professional_care` available as explicit branches.

## Review of the downloaded OpenCV project

Reviewed folder: `../Face_Based_Skin_Analysis_and_Recommendation_System-master/`. The original project has not been modified or connected to this interface.

### What the code actually does

- `Detection/face_detection.py`: uses an OpenCV Haar cascade to locate face bounding boxes.
- `Detection/skin_analysis.py`: calculates mean HSV value as brightness, mean BGR red channel as redness, and grayscale variance as texture. It also circles regions above a fixed red-channel threshold.
- `Scoring/scoring.py`: clips measurements into fixed ranges and linearly maps them to integers from 0 to 10. These are heuristic display scores, not probabilities or clinically validated scales.
- `Recommendation/recommender.py`: selects a fixed list from redness thresholds, including acne-related products and “Prescription care.” These recommendations are not supported by the measurement alone and should not be carried into the agent.
- `camera/webcam.py`: starts a desktop camera loop, maintains rolling measurement buffers, draws labels, and can save a snapshot. This is not a browser-facing service.

### Important limitations

The implementation analyzes the rectangular face crop; it does not implement a proper skin mask excluding eyes, lips, hair, and other non-skin pixels. The README's description of isolating meaningful skin regions is therefore stronger than the code supports. There are no implemented blur/exposure checks, calibrated severity thresholds, skin-tone validation, or disease-specific models in the reviewed files.

Raw red-channel averages change with illumination, exposure, white balance, and skin colour. Pixel variance also responds to shadows, image noise, facial features, and resolution. Neither measurement establishes hydration, irritation cause, acne, or whether skin is “healthy.” Brightness must not become a beauty ranking or a claim that lighter skin is healthier.

The rolling buffers are shared across faces and camera frames. If multiple people are detected or people change, measurements can mix. A future integration should reject multiple faces for personal check-ins and isolate measurements per image/session.

No license file was present in the supplied folder listing. Verify the upstream repository's actual license and attribution terms before redistributing or integrating its code. The prototype does not depend on or redistribute that code.

### A sensible later integration

Wrap only the image-processing function behind a small Python API, for example `POST /photo-observations`. Keep it separate from the existing desktop camera loop. The browser handles consent and capture; the backend validates file size/type, strips unnecessary metadata, limits processing, checks input quality, and returns structured observations. Treat uploads as untrusted content.

Suggested response shape:

```json
{
  "status": "ok_or_needs_retake",
  "quality": { "face_count": 1, "blur_check": "not_yet_implemented", "exposure_check": "not_yet_implemented" },
  "measurements": { "mean_hsv_value": null, "mean_red_channel": null, "grayscale_variance": null },
  "limitations": ["Not a hydration measurement", "Not a diagnosis"],
  "algorithm_version": "opencv-prototype-v1"
}
```

Values are null here because no photo has been processed. Return raw measurements with their definitions until a justified interpretation is validated. Do not invent numerical confidence percentages. Connect observations to the user's description, and let the care-boundary tool determine whether advice is appropriate.

## Recommended architecture for the next phase

```text
Web interface
    ↓ authenticated requests + per-feature consent
Agent orchestration API
    ├── Profile / memory store (confirmed facts, provenance, deletion)
    ├── Reviewed guidance retrieval + approved product catalogue
    ├── Care-boundary checks + deterministic suitability filters
    ├── Photo observation API (isolated Python/OpenCV service)
    ├── Routine / journal / product-status records
    └── Durable follow-up scheduler → notification adapter → delivery events
```

The model handles conversation and proposes tool calls. Validated server code owns authorization, profile writes, catalogue filtering, scheduling, and deletion. Keep secrets server-side. Require user confirmation for newly extracted durable profile facts; use short-lived conversation context for uncertain details. Enforce per-user access to images and history. Keep service logs free of raw face images and unnecessary personal information.

For a hackathon MVP, implement text conversation + explicit memory + a verified small catalogue + one scheduled follow-up path first. Add the photo measurements as a clearly bounded experimental tool afterward. A small catalogue with good explanations is more credible than a large, weakly grounded recommendation system.

## Additional product suggestions

- **A body-area selector:** help users point to a cheek, nose, or forehead when words are difficult. Add it after the basic check-in form.
- **“Use what I own” mode:** reduce unnecessary purchases and make the routine affordable. Add barcode or label lookup later.
- **An irritation report action:** make it as easy to say “this stings” as to say “I like it.” It should interrupt promotional recommendations.
- **Memory transparency:** show “You told me this on…” and allow individual facts to be forgotten, instead of only an all-or-nothing reset.
- **Gentle habit formation:** praise manageable effort, let people restart, and avoid guilt around streaks or appearance scores.
- **Accessible conversation:** offer voice-to-text with review before sending, concise explanations, and eventually English and Simplified Chinese.
- **Consistent photo guidance:** comparable lighting and framing matter more than an impressive-looking score. Explain when comparisons are unreliable.
- **Age-aware simplicity:** use self-reported age bands, never estimate age from a face; review teen experiences and consent requirements before supporting minors in a real deployment.

Avoid automatically recommending “anti-glycation” products because somebody stays up late or describes dullness. That observation does not establish a mechanism. Ask about their goals, explain uncertainty, and restrict claims to substantiated product information.

## Care-language corrections used in the design

“Red, dry, and painful” is a description, not proof of dehydration. Weather can be relevant context, but it does not establish a diagnosis. Stinging should not be normalized as evidence that hydration is working. Persistent or worsening dryness, pain, burning, or irritation merits professional advice. General dry-skin guidance and sunscreen guidance were checked against the [American Academy of Dermatology's dry-skin advice](https://www.aad.org/public/everyday-care/skin-care-basics/dry/dermatologists-tips-relieve-dry-skin) and [moisturizer selection guidance](https://www.aad.org/public/everyday-care/skin-care-basics/dry/pick-moisturizer), accessed October 10, 2026.

The [official L’Oréal Paris Hydra Renewal page](https://www.lorealparisusa.com/skin-care/hydra-renewal-continuous-moisture-cream) was reviewed as an example of product information. It was not turned into a recommendation for the sample user's painful/red skin. The UI deliberately uses clearly labeled concept packaging until local catalogue data and suitability checks are available.

## Useful success criteria for the hackathon

- Can a beginner describe a concern without knowing a diagnosis or ingredient name?
- Does the agent ask useful clarifying questions and recognize when it should not recommend a product?
- Can a user see, correct, and delete a remembered preference?
- Is each recommendation grounded in a real local product with a clear rationale?
- Does a follow-up occur only after opt-in and a confirmed triggering event, and stop after cancellation?
- Can the vision tool reject unusable images and state its limitations?
- Does the experience encourage a tolerable, manageable routine rather than simply more purchases?

For a pitch, demonstrate one complete story: describe discomfort → clarify → confirm profile → propose a simple routine → simulate an opted-in follow-up → record tolerance → review the journey. Clearly label any accelerated demo clock, mock notification, or experimental image measurement.
