# Interior Design API

CommonJS Node.js/Express API and durable MongoDB worker. The API owns authentication, user data, private room/result files, design jobs, furniture, cost estimates, room templates and saved scenes. The mobile app must never connect directly to MongoDB or receive the AI service token.

## Requirements

- Node.js 20.19+ (Node.js 24 LTS tested) and npm.
- MongoDB Atlas or a local MongoDB replica set. Transactions are required for design credit reservations/finalization; a standalone `mongod` is not supported.
- `server/.env` copied from `.env.example`.
- Local development uses a private, ignored filesystem directory and mock AI. Production should use private S3-compatible storage, HTTPS, and secret environment variables.

## Local setup

From the repository root, start a local MongoDB replica set in one PowerShell terminal. Use MongoDB Community Server and `mongosh` installed on your machine:

```powershell
New-Item -ItemType Directory -Force C:\data\interior-design-db
mongod --replSet rs0 --dbpath C:\data\interior-design-db --bind_ip 127.0.0.1
```

In another terminal, initialize the replica set once:

```powershell
mongosh "mongodb://127.0.0.1:27017/admin" --eval "rs.initiate()"
```

From `C:\Users\Cc\interior-design-ai\server`:

```powershell
Copy-Item .env.example .env
npm install
```

Edit `.env`: set `JWT_SECRET` to a freshly generated random value of at least 32 characters and set `MONGODB_URI` to:

```text
mongodb://127.0.0.1:27017/interior_design?replicaSet=rs0
```

Keep `AI_MOCK=true` and `STORAGE_DRIVER=local` for offline setup. No credentials are included in this repository. Do not commit `.env`.

Run the API and worker in separate terminals, both from the `server` directory:

```powershell
npm run dev
```

```powershell
npm run worker:dev
```

The API listens on `0.0.0.0:5000`, creates MongoDB indexes before accepting requests and exposes only `GET /health` without authentication. Start the API and worker using `npm start` and `npm run worker` outside development. Seed the sample catalogue with `npm run seed:catalog`.

On Windows, start or reuse the API, worker, and Expo web server together from the repository root:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\server\scripts\start-local-demo.ps1
```

The script reuses a healthy API on port 5000, an existing worker process, and a healthy Expo server on port 8081. It starts only missing services in separate processes, keeps `.env` values private, and does not edit configuration or secrets.

To grant admin access, first register the account normally, then run `npm run admin:promote -- user@example.com` from the server directory. Promotion is a trusted local/operations command, not a public API.

## Phone on the same Wi-Fi

Find the development computer's LAN IPv4 address with `ipconfig`. Change `PUBLIC_BASE_URL` in `server/.env` to `http://<LAN-IP>:5000`, set the mobile app's API base URL to that same address, allow inbound TCP port 5000 in the computer's firewall, and restart both processes. For example, if the LAN IP is `192.168.1.25`, use `http://192.168.1.25:5000`. A phone cannot reach the computer using `localhost`. Use HTTPS and a reachable public API/object-storage URL for remote AI or production; a remote AI cannot fetch a localhost or private-LAN image URL.

Native mobile requests do not require CORS. Set comma-separated `CORS_ORIGINS` only for browser clients.

## API overview

Protected routes use `Authorization: Bearer <accessToken>`. Access tokens are HS256 JWTs with configured issuer/audience and a default 15-minute expiry. All JSON errors use `{ "error": { "code": "...", "message": "..." } }`. See [docs/api-contract.md](./docs/api-contract.md) for request and response examples.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Register/login |
| GET/PATCH | `/api/auth/me` | Profile and credit balance / change name |
| POST/GET | `/api/designs` | Queue an image design / owner-only paginated history |
| GET/DELETE | `/api/designs/:id` | Poll results / delete a terminal design |
| GET | `/api/catalog` | Active furniture catalogue |
| POST | `/api/cost/estimate` | PKR furniture subtotal, calculated from catalogue prices |
| GET | `/api/rooms3d` | Active templates with short-lived private asset links |
| GET/POST | `/api/scenes` | List or save owner scenes |
| GET/PATCH/DELETE | `/api/scenes/:id` | Owner-only scene operations |
| POST/PATCH/DELETE | `/api/admin/catalog[/:id]`, `/api/admin/rooms3d[/:id]` | Database-role-checked admin writes |
| GET | `/health` | Minimal health response |

Upload exactly one multipart `image` (JPEG/PNG/WebP), at most 10 MiB. The server decodes the bytes, rejects malformed/oversized pixel data, rotates, strips metadata and normalizes to JPEG with a 1536-pixel maximum side. `ownerId`, prices, credits, design status and worker fields are server-owned.

## Durable queue and credits

The `designs` collection is the durable queue. Request creation stores the private image, then atomically reserves one available credit (`credits - reservedCredits > 0`) and inserts the queued job in a Mongo transaction. A unique owner/idempotency-key index makes same-payload retries return the same job; reusing a key with different content returns 409. Concurrent submissions cannot overspend.

Workers claim jobs atomically with a fenced worker token and lease. AI calls and storage writes happen outside transactions. Successful completion conditionally charges one credit and releases one reservation in a single transaction. Terminal failure releases the reservation without consuming a credit. Expired leases are reclaimed up to two worker attempts; exhausted jobs are failed and released. Result keys include design, attempt and variant to prevent stale workers overwriting a newer attempt. Deleted-design object cleanup is recorded in a Mongo outbox and retried.

Both mock and real generation charge one credit on success. Mock output is locally generated, clearly marked with `isMock: true` and does not require an external placeholder service.

## AI service integration

When `AI_MOCK=false`, configure `AI_SERVICE_URL` (base URL without `/redesign`) and `AI_SERVICE_TOKEN`. The worker posts the proposed contract in [docs/api-contract.md](./docs/api-contract.md), with a 120-second default timeout, one retry for timeout/503, bounded JSON/image sizes and Sharp verification of returned images.

No AI implementation was present in the supplied workspace to verify request fields, enums, auth header, retry/idempotency support or response schemas. This integration is prepared against the PDF's proposed FastAPI contract, not verified against the teammate's service. Confirm the request/response field names, shared room/style allowlists, bearer-token configuration and `designId` deduplication against that code before setting `AI_MOCK=false`. The AI must be able to fetch the short-lived original-image URL; local filesystem links are only reachable from the API host/LAN. Duplicate AI work after an ambiguous timeout remains possible unless the AI service deduplicates by `designId`; backend credit charging remains conditional and one-time.

## Catalogue, budget and cost rules

`npm run seed:catalog` upserts 30 stable SKU examples across eight categories. Their names/prices are development seed data, not verified products; replace them through admin operations before production. Model and thumbnail keys are null until actual private assets are uploaded.

Budget recommendation ceilings are per furniture item: `low` = PKR 25,000, `medium` = PKR 100,000, `high` and `ultra` = PKR 500,000. These starter limits need confirmation with the product team; `ultra` currently shares the high-tier catalogue ceiling and is passed to the AI adapter as `high`. AI suggestions only select existing active catalogue items and never create catalogue prices. Estimates use integer PKR paisa, combine duplicate line items, cap quantities/baskets/totals and exclude tax, delivery and discounts.

## Checks

```powershell
npm test
```

The tests start an ephemeral MongoDB replica set (the MongoDB Memory Server package downloads a MongoDB binary on first use) and cover auth, role/ownership isolation, upload validation, idempotency, concurrent credit reservations, mock success charging, failure release, lease recovery, scenes and stored-price cost estimates. They do not verify Atlas connectivity, S3 credentials, a physical phone/firewall, or the real AI contract/service.

## Frontend integration

The Expo client uses the auth, profile, design upload/history/favorite, catalogue recommendation, and cost-estimate endpoints above. Native tokens are stored in platform secure storage; web previews use tab-scoped session storage. The frontend polls jobs until a terminal status and labels mock results. Keep `AI_MOCK=true` until the separate AI service contract is configured and verified.
