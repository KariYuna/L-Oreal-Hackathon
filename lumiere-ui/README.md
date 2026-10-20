# Lumière · local skincare companion

An L’Oréal-inspired hackathon app for beginners. It runs Qwen3 8B locally through Ollama, uses a small OpenCV face-image pipeline for experimental observations, and saves one user’s confirmed profile, conversations, products, routine and journal on this computer. The interface is a concept, not an official L’Oréal service or a medical tool.

## Run on this Windows computer

Double-click [`Start Lumiere.cmd`](../Start%20Lumiere.cmd). It starts Ollama and the app, checks that `qwen3:8b` is downloaded, and opens `http://localhost:4173`. First launch needs internet and about 5.2 GB for the model. Install Node.js 22+ and Python 3.10–3.13 on each Windows computer. The launcher checks the photo-analysis Python packages and installs them locally if needed; a copied `.venv` is not portable. If you use `npm start` directly, also start Ollama with `qwen3:8b` and install `vision/requirements.txt` into a Python environment.

The app serves only on `127.0.0.1`. It does not provide a phone or network demo yet. Leave Ollama and the Node process running while using it. Reopen the local URL or use the launcher later.

After replacing app files while Lumière is already running, double-click [`Restart Lumiere.cmd`](../Restart%20Lumiere.cmd) once. It verifies that the process on port 4173 is the local Lumière Node server before restarting it. This reloads backend changes without deleting saved data. You do not need to restart merely to change the agent language. To see the first-time welcome again without deleting data, use **Your space → My profile → Show first-time welcome**.

## What works

- **First visit and language:** choose how Lumière speaks on the welcome screen: English, Traditional Chinese, Simplified Chinese or Japanese. Change it at any time from the **Agent language** menu in the top bar, in **Your space → My profile**, or in the advisor. The choice saves immediately and controls the next Qwen reply, the advisor greeting and future in-app follow-ups, even within an existing conversation. Existing chat messages and already-created reminders keep their original wording; the surrounding navigation and forms remain in English. The dressing table becomes the returning home view. The sidebar stays folded until opened. The AM/PM selection also changes the visual theme. To show the first-time screen again, open **Your space → My profile → Show first-time welcome**. This preserves saved data. **Delete my data** in the same area is a separate, full reset that requires typing `DELETE`.
- **Advisor:** Qwen3 8B opens with questions about what the user notices. A guided care brief collects the concern, duration, sensations, existing routine and preferences, then asks the user to confirm the summary before named product suggestions. Suggested catalogue products appear as illustrated cards with explanations, usage guidance and shelf actions. A request such as “add it to my shelf” returns the relevant card so the user can confirm whether it was bought, received or started. The app never claims a purchase or saves a product merely because the model said it could. Conversations use saved profile, products, feedback, recent journal entries and fetched weather. Qwen can still make mistakes, so review suggestions.
- **Profile:** edit, save and later change approximate age, city, life context, exercise habits, work/study environment, daily patterns, skincare experience, budget, routine and preferences. The default name “Jamie Chan” is a sample. Until saved, other personal details are blank or set to “Prefer not to say.” A previous browser profile can be imported on the profile page.
- **Skin mirror:** upload a JPEG/PNG or use the camera. The bundled original OpenCV Haar detector and color/texture calculation produce limited, local image observations with quality flags. Add self-reported comfort, redness, blemishes, tone and symptoms. Original photos are not saved. A small copy is saved only if the user checks the box at each check-in.
- **Skin journal:** real check-ins, selectable 30/90-day or all-time trends, and product/routine change markers. All ratings are self-reported. There are no invented improvement scores.
- **Product shelf:** manually add products or save a selected advisor card after confirming whether it was bought, received or started; mark AM/PM use, record feedback, track rough remaining amount, and review bottle reminders. “Finish routine” records the day’s listed products. The level estimate is not a sensor reading or actual inventory. Product illustrations are concept artwork, not verified package photos.
- **Follow-ups:** opt-in, local in-app messages ask about delivery, starting use and later tolerance, with direct actions linked to the product shelf and feedback form. They also appear in the advisor. Quiet hours apply. The Node server must run to prepare messages; overdue ones are picked up when the app opens again. These are in-app prompts, not phone push notifications.
- **Weather:** the city lookup uses Open-Meteo only when requested. Weather is a contextual hint, not a cause or diagnosis. The city lookup is the one app feature that sends a chosen city to an external service.
- **Data:** export JSON or delete local app data. Confirmed data is stored in `.data/state.json`. It is one local profile, without a cloud account, encryption, authentication or cross-device sync.

WhatsApp, Telegram and WeChat connections remain UI previews. They do not sign in, read contacts or send messages; those platforms require accounts, approved credentials, a public service and a separate delivery integration. The app does not buy products, check live prices or verify local stock.

## Run on macOS

The source is portable, including the two copied files from the original vision project in `vision/original`. Use macOS 14 or newer. Copy **this entire `lumiere-ui` folder** to the Mac; omit `.runtime`, `.models`, `.venv`, `.qa-data` and `.data`. Install Node.js 22 or newer, Python 3.10–3.13 and Ollama for macOS. In Terminal, from `lumiere-ui`, run:

```sh
zsh scripts/start-macos.command
```

The script downloads Qwen3 8B for that Mac, creates its own Python environment, installs the vision packages, then opens the interface. The launcher passed a Unix shell syntax check, and the pinned vision packages publish macOS wheels for Apple Silicon and Intel. A physical Mac run has not been tested here. A Mac needs enough memory and disk space for its local model; performance depends on its hardware. The Windows Ollama binary and model files should not be copied over.

## Limits of the photo feature

The original GitHub project is a Haar-cascade face detector plus whole-face averages of brightness, the red color channel and grayscale variance. It has no neural skin model or validated clinical calibration. We retained its measurements and added single-face checks, image quality hints and small cheek-region color ratios. Lighting, exposure, makeup, camera processing, skin tone and pose can all alter these values. The app does not infer hydration, acne, pores, fine lines or a medical condition from them. Trend graphs are from user ratings and clearly labelled as such. An LLM cannot make these image measurements diagnostic by itself; see `VISION_RECOMMENDATIONS.md`.

## Development and privacy

```powershell
npm run check
npm test
```

There are no Node package dependencies. The browser requests same-origin APIs and a per-process token; the server rejects remote hosts and cross-site writes. These checks protect the local demo from ordinary cross-site requests, but the project is not designed as a public multi-user service. Do not expose port 4173 to a network without authentication, HTTPS, a database, and a privacy review. Avoid entering sensitive health details you do not want on this computer.

The interface uses local artwork and optional Google Fonts. `ASSETS.md` records visual asset provenance. The “Lumière” name and L’Oréal-inspired styling are hackathon concepts, not claims of sponsorship.
