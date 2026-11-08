# Mobile app

## Run with Expo Go

Set `EXPO_PUBLIC_API_URL` in the ignored local `.env` file to the backend computer's LAN URL, without `/api`:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.103:5000
```

The app adds `/api` automatically. If the computer's IP changes, update this value. The phone and computer must be on the same Wi-Fi, and Windows Firewall must allow inbound TCP ports `8081` (Expo) and `5000` (API).

Run Metro from CMD:

```cmd
cd /d C:\Users\Cc\interior-design-ai\mobile-app
npm install
npm start -- --go --lan --port 8081
```

Run the API and worker in separate terminals from `server`; follow the local database setup in [`../server/README.md`](../server/README.md). Set the API server's `PUBLIC_BASE_URL` to the same LAN URL and restart the API and worker after changing it. The API needs to be reachable at `/health`.

On Windows, start or reuse the API, worker, and Expo together from the repository root:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\server\scripts\start-local-demo.ps1
```

The script checks API and Expo health and reuses their existing ports and any running design worker. It opens separate processes only for missing services and does not read, print, or modify either `.env` file.

Restart Expo after changing `.env`; Expo public environment variables are embedded at bundle time.

## Connected features

- Signup and login call `/api/auth/register` and `/api/auth/login`; account restoration calls `/api/auth/me`.
- Native access tokens are stored with Expo SecureStore (iOS Keychain / Android Keystore). Web previews use tab-scoped `sessionStorage`.
- Photo uploads use authenticated multipart requests and an idempotency key. The app polls the durable design job until success or failure.
- Design history and deletion are synced with `/api/designs`. Signed image URLs are kept in memory only and refreshed when opening a design.
- Saved/favourite designs are synced to the signed-in account. Design history includes signed original-image URLs for comparison; result URLs are refreshed from the API when a design is opened.
- Furniture recommendations and PKR cost estimates use backend catalogue data. The 3D preview remains a clearly labeled local demo and is not generated from the uploaded room photo.
- With backend `AI_MOCK=true`, results are labelled **Mock AI** in the app. No AI credentials belong in this app or its `.env`.

Email/password reset, retailer checkout and persistent cross-device favourites are not provided by the current API.
