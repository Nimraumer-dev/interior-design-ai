# REST contract

Base URL is `http://localhost:5000` in local development. Protected requests include `Authorization: Bearer <accessToken>`. Responses use JSON. Errors have the shape `{ "error": { "code": "INVALID_INPUT", "message": "..." } }`. User-specific resources are always looked up with the authenticated owner ID; client-supplied owner IDs and server-owned fields are rejected.

## Authentication and profile

### `POST /api/auth/register`

Request: `{ "name": "A User", "email": "user@example.com", "password": "at-least-10-characters" }`

Returns 201: `{ "user": { "id", "name", "email", "role", "credits", "reservedCredits", "availableCredits" }, "accessToken": "..." }`. Email is normalized. Registration always assigns role `user` and the configured starting credit balance.

### `POST /api/auth/login`

Request: `{ "email": "user@example.com", "password": "..." }`. Returns 200 with the registration response shape. Invalid credentials return 401.

### `GET /api/auth/me`, `PATCH /api/auth/me`

GET returns `{ "user": { "id", "name", "email", "role", "credits", "reservedCredits", "availableCredits" } }`. PATCH accepts only `{ "name": "New name" }`.

## Design queue and history

### `POST /api/designs`

Multipart fields: one `image`, `roomType`, `style`, `budgetRange`, optional JSON-array `colors`, `numVariants` (1–4, default 2), and `seed`. Send an `Idempotency-Key` header (8–128 characters). Current allowlists are:

- Room types: `living_room`, `bedroom`, `kitchen`, `dining_room`, `bathroom`, `office`, `other`
- Styles: `modern`, `minimalist`, `scandinavian`, `industrial`, `bohemian`, `traditional`, `contemporary`, `coastal`, `farmhouse`
- Budgets: `low`, `medium`, `high`, `ultra` (`ultra` shares the current high-tier catalogue ceiling and is sent to the AI adapter as `high`)

Returns 202: `{ "designId": "<id>", "status": "queued" }`. A same-owner same-key same-payload retry returns the existing ID/status. A changed payload for that key returns 409. No available credit returns 402.

### `GET /api/designs`

Owner-only history. Query parameters: `page` (default 1), `limit` (default 20, maximum 100), optional `status` (`queued|processing|completed|failed`) and `style`. Returns `{ "designs": [...], "pagination": { "page", "limit", "total", "pages" } }`.

### `GET /api/designs/:id`

Returns `{ "design": { "id", "roomType", "style", "budgetRange", "originalImageUrl", "colors", "status", "creditState", "attempts", "isMock", "results", "palette", "recommendations", "recommendedFurniture", "roomAnalysis", "modelVersion", "durationMs", "errorCode", "errorMessage", "createdAt", "updatedAt" } }`. Original and result image links are freshly signed on each read; the original image link is also included in history. A result is `{ "variant": 1, "url": "<short-lived signed URL>", "thumbUrl": "<short-lived signed URL>" }`. A foreign or missing ID returns 404.

### `PATCH /api/designs/:id/favorite`

Owner-only saved-design toggle. Request: `{ "saved": true }`; returns `{ "design": { ... } }` with the updated `isFavorite` value. Design history and detail responses include `isFavorite`.

### `DELETE /api/designs/:id`

Deletes only completed/failed owned designs. Returns 204. Queued/processing jobs return 409. Designs still referenced by an owned saved scene return 409. Object keys are removed asynchronously through the durable cleanup outbox.

## Catalogue, estimates and 3D

### `GET /api/catalog`

Requires authentication. Optional `page`, `limit` (max 100), `category` and `style` filters. Returns `{ "items": [...], "pagination": {...} }`; only active records are shown. Product prices are integers in PKR paisa. Asset links are signed only when a private model/thumbnail key exists.

### `POST /api/cost/estimate`

Request: `{ "items": [{ "itemId": "<catalog id>", "qty": 2 }] }`. Basket has 1–50 entries and quantity 1–100 per distinct item. Prices supplied by clients are not accepted. Returns `{ "currency": "PKR", "totalPaisa": 5000000, "items": [{ "itemId": "...", "qty": 2, "unitPricePaisa": 2500000, "lineTotalPaisa": 5000000 }] }`. This is a furniture subtotal only.

### `GET /api/rooms3d`

Returns active templates in `{ "templates": [{ "id", "name", "supportedRoomTypes", "modelUrl", "thumbnailUrl" }] }`. Asset URLs are signed; the frontend renders GLB content.

## Saved scenes

### `GET /api/scenes`, `POST /api/scenes`

GET returns `{ "scenes": [...] }` for the current owner. POST request:

```json
{
  "name": "Living room",
  "designId": "<optional owned design id>",
  "roomTemplateId": "<active template id>",
  "placements": [{
    "catalogItemId": "<active catalogue id>",
    "position": { "x": 0, "y": 0, "z": 0 },
    "rotation": { "x": 0, "y": 0, "z": 0 },
    "scale": { "x": 1, "y": 1, "z": 1 }
  }]
}
```

Transforms must be finite and bounded (position ±100, rotation ±360 degrees, scale 0.01–100). POST returns 201 `{ "scene": {...} }`. Responses include signed template/product model and thumbnail links when configured.

### `GET/PATCH/DELETE /api/scenes/:id`

All operations are owner-only. PATCH accepts a non-empty subset of the create fields. DELETE returns 204. Unknown fields and invalid or inaccessible references are rejected.

## Admin

`POST/PATCH/DELETE /api/admin/catalog[/:id]` and `/api/admin/rooms3d[/:id]` require an authenticated account whose current database role is `admin`. Creates and patches validate field allowlists. DELETE soft-deactivates records. Public registration never grants admin role; use the trusted `scripts/promoteAdmin.js` utility.

## Private image access and status codes

Local files are outside `express.static`; local signed file links expire after 15 minutes by default. S3-compatible URLs are presigned. Do not log, persist or share signed URLs; clients should refresh them by fetching the owning design/scene again. Typical status codes: 400 invalid input, 401 missing/expired authentication, 402 no available credits, 403 admin/CORS denial, 404 inaccessible resource, 409 conflict/in-progress, 413 upload exceeds 10 MiB, 415 unsupported/malformed image, 429 rate limit and 500 unexpected error.

## Proposed AI worker contract (not verified against service source)

With `AI_MOCK=false`, the worker sends `POST {AI_SERVICE_URL}/redesign`, `Authorization: Bearer {AI_SERVICE_TOKEN}`, JSON:

```json
{
  "designId": "<id>",
  "imageUrl": "<15-minute signed original image URL>",
  "roomType": "living_room",
  "style": "scandinavian",
  "budgetRange": "medium",
  "colors": ["beige", "light wood"],
  "numVariants": 2,
  "seed": 42
}
```

Expected success:

```json
{
  "status": "ok",
  "modelVersion": "v0.3",
  "durationMs": 18400,
  "results": [{ "variant": 1, "imageBase64": "<base64 JPEG/PNG/WebP>" }],
  "palette": ["#E8E2D6", "#B08968", "#9CA3AF"],
  "roomAnalysis": { "description": "..." },
  "recommendations": [{ "category": "sofa", "styleTags": ["scandinavian"], "colorHint": "light gray" }]
}
```

The worker requires at least one result image, validates the response and decoded image, caps response/image dimensions and retries timeout or HTTP 503 at most once. Errors are returned with a safe application error and failed jobs release reserved credits. Confirm exact AI auth, enums, field names, base64 conventions and `designId` deduplication against the actual AI implementation before enabling real mode; none was present in the workspace.

## API test examples

Register:

```powershell
curl.exe -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"A User\",\"email\":\"user@example.com\",\"password\":\"replace-with-a-long-password\"}"
```

Create a design (replace `TOKEN` and the image path):

```powershell
curl.exe -X POST http://localhost:5000/api/designs -H "Authorization: Bearer TOKEN" -H "Idempotency-Key: room-redesign-001" -F "image=@C:\path\to\room.jpg;type=image/jpeg" -F "roomType=living_room" -F "style=scandinavian" -F "budgetRange=medium" -F "numVariants=2"
```

Poll `GET /api/designs/<designId>` with the bearer token every 2–3 seconds until status is `completed` or `failed`. Estimate a basket with `POST /api/cost/estimate` and JSON `{"items":[{"itemId":"<catalog id>","qty":2}]}`.
