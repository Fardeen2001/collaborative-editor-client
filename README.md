# Collaborative Editor Client

Next.js 16 frontend. **No hardcoded URLs, limits, or protocol constants** — everything loads from the server at runtime.

## Setup

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Only `NEXT_PUBLIC_API_URL` is required for bootstrap. On startup, the app fetches `GET /api/config` and merges server values with optional env overrides.

## Config flow

```
.env.local (bootstrap URL)
    ↓
GET /api/config (server-driven contract)
    ↓
ConfigProvider → useAppConfig() / useApi()
    ↓
Editor, SyncProvider, validation UI
```

## What is dynamic

| Concern | Source |
|---------|--------|
| API / WS URLs | Server `/api/config` |
| Yjs field name | Server `/api/config` |
| Message size limits | Server `/api/config` |
| Password/title max lengths | Server `/api/config` |
| Snapshot default label | Server `/api/config` |
| Reconnect / heartbeat timing | Server `/api/config` |
| IndexedDB / outbox names | Server `/api/config` |
| AI feature visibility | Server `/api/config` (`features.ai`) |
| Shareable roles | Server `/api/config` (`roles`) |

Optional `NEXT_PUBLIC_*` overrides in `.env.local` apply when server config is unavailable.

## Sync fixes

- Outbox drains **after** initial Yjs sync handshake (not on raw `onopen`)
- Client enforces `maxMessageSize` before sending
- Editor waits for local IndexedDB **and** remote sync (or offline) before enabling edits
