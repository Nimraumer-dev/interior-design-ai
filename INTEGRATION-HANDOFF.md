# Integration handoff

## Current state

- Branch remains `frontend`; existing uncommitted changes and both `.env` files were preserved.
- `AI_MOCK=true`; the API, worker, and Expo demo-start command are documented in the mobile and server READMEs.
- Expo web loads. The desktop tab-list container previously filled the viewport and intercepted clicks; it now has a 64px desktop header while mobile tabs remain bottom-aligned. The web splash overlay is also disabled to avoid leaving an animated full-screen layer mounted.
- Login, `/me`, credit refresh, logout, and login again worked with the existing test account. Its two designs (including the newly generated saved design) remained after re-login. The generated mock result and both source/result images loaded.
- Expired-token handling now clears the token/account history and routes to Login; verified using an invalid persisted token. Normal valid login still succeeds.
- The mock upload → options → generation → polling → result → save → history path was exercised earlier. The result is explicitly labelled Mock AI.
- No live catalogue items exist. Furniture recommendations, product detail, and price-based cost estimates cannot be fully exercised without authorized catalogue data; no data was seeded.

## Screen checklist

| Screen/flow | Verified | Notes |
|---|---|---|
| Splash / web startup | Web loaded after restart; startup rendering checked | `web.output: single` avoids the earlier SSR module failure. Native splash animation was not device-tested. |
| Onboarding | 360, 430, 768, 1280, 1440 CSS px; screenshot at 1440 | No horizontal overflow. |
| Login | 360, 430, 768, 1280, 1440; valid login | Test account authenticated successfully. |
| Signup | 360, 430, 768, 1280, 1440; required-field validation | Successful UI registration not separately exercised. |
| Home / Generate / My Designs / Profile | Responsive checks at listed widths | No settled-layout horizontal overflow; desktop and mobile tab navigation clickable. Profile showed 3 available credits. |
| Upload / Choose Style / Budget / Loading | Earlier mock-flow checks | Upload, option selection, polling, and loading flow worked; latest loading decoration was not separately screenshot-checked. |
| Result / comparison / save / history | 360, 430, 768, 1280, 1440 | Before/after images, save, history, and persisted saved design verified. |
| Furniture / Cost | 360, 430, 768, 1280, 1440 | Empty catalogue states are clear; live recommendations and estimates unavailable with the current empty catalogue. |
| Furniture Detail | Not fully verifiable | No catalogue item exists to open; invalid/unavailable-item fallback is implemented. |
| 3D Preview | 360, 430, 768, 1280, 1440; screenshot at 1440 | Web correctly says 3D is unavailable and labels the scene as demo-only, not generated from the uploaded room. |

## Checks and blockers

- Earlier checks passed: frontend TypeScript, lint, focused backend test (1/1), and the end-to-end mock generation flow.
- Final `npx tsc --noEmit`, `npm run lint`, and `git diff --check` all passed after the responsive and auth-expiry fixes.
- API `/health` and Expo `/status` returned HTTP 200; the design worker process is running. Existing services were left running.
- Android device/emulator verification remains pending; none was available in the prior session.
- The external AI service is intentionally not configured; teammate follow-up needs its real URL, token, and confirmed request/response contract before changing `AI_MOCK`.
- A non-blocking web `useNativeDriver` warning remains. MongoDB Memory Server's test shutdown fallback warning did not recur in the last focused test.
