# Trackker - Full-Stack User Analytics Platform

Trackker is a full-stack user analytics and telemetry platform that captures `page_view`, `click`, and `scroll` events in real time, then visualizes them through a session journey timeline, event inspector, session replay, and click heatmap overlay.

This project was built as part of the hiring process for the Full Stack Engineer role at **CausalFunnel**.

---

## Live Demo & Ports Architecture

To simulate a real analytics system where multiple client sites are tracked independently without cross-site data contamination, the application runs across separate ports:

| Service | URL | Description |
|---|---|---|
| Analytics Dashboard | `http://localhost:3001` | Next.js analytics workspace |
| Telemetry API | `http://localhost:3000` | Express + MongoDB backend |
| Demo Site A — **Flowdesk** | `http://localhost:8080/demo.html` | SaaS landing page (`trk_demoA_9f8k2`) |
| Demo Site B — **Verdant** | `http://localhost:8082/demoB.html` | Plant shop storefront (`trk_demoB_5j2d7`) |

---

## Tech Stack

* **Frontend (Dashboard)**: Next.js 16 (App Router), React 19, Tailwind CSS
* **Backend (API Server)**: Node.js, Express, TypeScript, Zod, Mongoose
* **Database**: MongoDB (compound indexes for scoped queries)
* **Client SDK**: Custom lightweight vanilla JavaScript IIFE (`tracker.js`)

---

## Client-Side Tracking SDK (`tracker.js`)

`tracker.js` is a zero-dependency script that auto-initializes on page load. Drop it into any website to start collecting telemetry.

### Installation

```html
<!-- 1. Set your unique tracking ID -->
<script>
  window.__TRACKER_ID = "trk_yourwebsite_xyz123";
</script>

<!-- 2. Load the tracker -->
<script src="tracker.js"></script>
```

The tracker also accepts `window.TRACKER_ID` as a fallback. If neither is set, events are tagged with `unknown`.

### Event Types

| Event | Trigger | Data captured |
|---|---|---|
| `page_view` | Initial load, SPA navigation, hash changes | `trackingId`, `session_id`, `page_url`, `timestamp` |
| `click` | Any click on the page (capture phase) | Above + `x`/`y` coordinates + `element` metadata |
| `scroll` | User scrolls (debounced 1 s) | Above + `x`/`y` scroll offsets |

### Session Management

* Session IDs are stored in `localStorage` under a key scoped by tracking ID: `trackker_session_<trackingId>`
* Format: `sess_<timestamp>_<random>`
* Multiple sites on the same origin (or different origins) never share session keys
* On init, legacy unscoped keys (`trackker_session`, `trackker_session_unknown`) are automatically removed

### Click Coordinate System

Click coordinates are calculated relative to `document.body` boundaries:

```js
x = clientX - body.getBoundingClientRect().left
y = clientY - body.getBoundingClientRect().top
```

This keeps heatmap dots aligned in the dashboard preview regardless of page centering, margins, or scroll position.

### Element Metadata (Click Events)

For every click, the tracker captures a structured `element` object:

```typescript
{
  tagName: string;      // e.g. "BUTTON"
  id: string | null;    // e.g. "btn-signup"
  className: string | null;
  text: string | null;  // trimmed inner text, max 100 chars
  selector: string | null; // auto-generated CSS selector path
}
```

CSS selectors are built by walking up the DOM tree, using IDs where available and `nth-of-type` disambiguation for siblings.

### SPA / Client-Side Routing Support

The tracker patches the History API and listens for navigation events so single-page apps are tracked without full page reloads:

* `history.pushState` — patched to fire `page_view` after 50 ms
* `history.replaceState` — patched to fire `page_view` after 50 ms
* `popstate` — fires `page_view` on back/forward navigation
* `hashchange` — fires `page_view` on hash-based routing

Duplicate `page_view` events for the same URL are suppressed via an internal `lastTrackedUrl` guard.

### Scroll Tracking

Two separate scroll mechanisms run in parallel:

1. **Database persistence** — debounced scroll events (1 s) are sent to the API with `x` (scrollLeft) and `y` (scrollTop) offsets
2. **Iframe sync** — when running inside the dashboard preview iframe, scroll/resize events are relayed to the parent via `postMessage` so the heatmap overlay stays aligned

### Iframe Preview Mode

When `tracker.js` detects it is running inside an iframe (`window.parent !== window`):

* **Database writes are skipped** — prevents duplicate events from dashboard preview interactions
* **postMessage events are sent** to the parent window for live UI sync:
  * `trackker_page_view` — URL and tracking ID
  * `trackker_iframe_scroll` — scroll offsets and body position
  * `trackker_click` — click coordinates and element info (for live overlay painting)

### Dashboard → Iframe Commands

The tracker listens for `trackker_command_scroll` messages from the parent dashboard and smoothly scrolls the iframe to a target position. This powers session replay (centering clicks, replaying scroll depth).

### Network & Error Handling

* Events are sent via `fetch` POST to `http://localhost:3000/api/events`
* Uses `keepalive: true` so events survive page unloads
* Network failures are caught and silently ignored — tracking never breaks the host site
* All payloads are logged to the browser console under `[Trackker]`

### Manual API (Testing)

The tracker exposes a global for manual event injection:

```js
window.Trackker.sendEvent('click', { x: 120, y: 340, element: { tagName: 'BUTTON' } });
```

---

## Node.js & Express API Backend

* Written in TypeScript with hot-reload via `node --watch`
* All incoming payloads validated with strict Zod schemas before database insertion
* CORS enabled for cross-origin requests from demo sites and the dashboard

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/events` | Record a telemetry event |
| `GET` | `/api/sessions?trackingId=...` | List sessions with event counts, first/last seen |
| `GET` | `/api/sessions/:sessionId?trackingId=...` | Fetch chronological journey for a session |
| `DELETE` | `/api/sessions/:sessionId?trackingId=...` | Delete a session and all its events |
| `GET` | `/api/clicks?trackingId=...&page_url=...` | Get click coordinates + element data for heatmap |
| `GET` | `/api/tracking-ids` | List all unique tracking IDs in the database |
| `GET` | `/api/tracked-pages?trackingId=...` | List all unique page URLs for a tracking ID |
| `GET` | `/health` | Health check (`{ status: "ok" }`) |

---

## Analytics Dashboard

### Tabbed Workspace

The dashboard uses two primary views, switchable via tabs:

**Session Journeys**
* **Sessions sidebar** — active sessions with event counts, duration, and timestamps
* **Journey timeline** — vertical, color-coded event stream:
  * Green = `page_view`
  * Red = `click`
  * Cyan = `scroll`
* **Event Inspector** — click any timeline event to inspect full metadata (URL, coordinates, element tag/id/classes/text/selector, scroll depth visualization)
* **Session replay** — step-through playback with animated cursor, click ripples, and iframe scroll commands
* **Scope switcher** — switch between tracking IDs (demo sites or any ID in the database)
* **Delete session** — with confirmation modal

**Heatmap Analyzer**
* Renders the target page in an iframe with a toggleable website preview
* Overlays pulsing click dots aligned to body-relative coordinates
* Tooltips show click index, coordinates, and element metadata on hover
* Page URL dropdown populated from tracked pages API
* Scroll-synced overlay via iframe `postMessage` bridge

### Other Dashboard Features

* **Auto-sync preview** — selecting a session sets the heatmap iframe to that session's latest page URL
* **Silent polling** — refreshes sessions, events, clicks, and tracked pages every 5 seconds without layout flicker
* **Custom toast alerts** — slide-in notifications for delete, refresh, and clipboard actions
* **State persistence** — selected tracking scope and session ID survive page reloads via `localStorage`
* **Copy to clipboard** — URLs and CSS selectors from the Event Inspector

---

## Database Schema & Indexes

### Event Schema

```typescript
{
  trackingId: string;           // Client scoping identifier
  session_id: string;             // Per-user session key
  event_type: 'page_view' | 'click' | 'scroll';
  page_url: string;               // Full URL where event occurred
  timestamp: Date;                // Event timestamp
  x: number | null;               // Click X or scrollLeft (null for page_view)
  y: number | null;               // Click Y or scrollTop (null for page_view)
  element: {                      // Present on click events
    tagName: string;
    id: string | null;
    className: string | null;
    text: string | null;
    selector: string | null;
  } | null;
  createdAt: Date;                // Mongoose auto-timestamp
  updatedAt: Date;
}
```

### Compound Indexes

* `{ trackingId: 1, session_id: 1, timestamp: 1 }` — journey timeline queries
* `{ trackingId: 1, page_url: 1, event_type: 1 }` — heatmap click queries
* `{ trackingId: 1, session_id: 1 }` — session list aggregation

---

## Setup & Run Instructions

### Prerequisites

* **Node.js** v18+
* **pnpm** (or npm/yarn)
* **Python 3** (for serving static demo pages)
* **MongoDB** running locally

Default MongoDB URI: `mongodb://localhost:27017/trackker`

### Environment Variables

| Variable | Location | Default | Description |
|---|---|---|---|
| `MONGO_URI` | `server/` | `mongodb://localhost:27017/trackker` | MongoDB connection string |
| `PORT` | `server/` | `3000` | API server port |
| `NEXT_PUBLIC_API_URL` | `dashboard/` | `http://localhost:3000` | Backend URL for dashboard API calls |

Copy the dashboard example env file if needed:

```bash
cp dashboard/.env.local.example dashboard/.env.local
```

### Option 1: One-Click Startup (Recommended)

A script kills any existing processes on the required ports and starts all services in the background.

```bash
# Install dependencies first (only needed once)
cd server && pnpm install && cd ..
cd dashboard && pnpm install && cd ..

# Make executable and run
chmod +x script.sh
./script.sh
```

Then open:

* **Dashboard**: [http://localhost:3001](http://localhost:3001)
* **Demo Site A (Flowdesk)**: [http://localhost:8080/demo.html](http://localhost:8080/demo.html)
* **Demo Site B (Verdant)**: [http://localhost:8082/demoB.html](http://localhost:8082/demoB.html)

**Log files:**

| Service | Log path |
|---|---|
| API Backend | `server/api.log` |
| Demo Site A | `demo.log` |
| Demo Site B | `demoB.log` |
| Dashboard | `dashboard/dashboard.log` |

### Option 2: Manual Startup

Run each service in a separate terminal:

```bash
# Terminal 1 — MongoDB (if not already running as a system service)
mongod

# Terminal 2 — API Backend (port 3000)
cd server
pnpm install
pnpm run dev

# Terminal 3 — Demo Site A (port 8080)
cd /path/to/casualfunnel
python3 -m http.server 8080

# Terminal 4 — Demo Site B (port 8082)
cd /path/to/casualfunnel
python3 -m http.server 8082

# Terminal 5 — Dashboard (port 3001)
cd dashboard
pnpm install
pnpm run dev
```

### Quick Test Workflow

1. Start all services (Option 1 or 2)
2. Open **Demo Site A** or **Demo Site B** in your browser
3. Click buttons, scroll the page, and navigate around to generate events
4. Open the **Dashboard** at `http://localhost:3001`
5. Select a tracking scope (`demo_site_a` or `demo_site_b`) from the header dropdown
6. Click a session in the sidebar to view its journey timeline
7. Click individual events to inspect metadata in the Event Inspector
8. Hit **replay_session** to watch the session play back in the heatmap iframe
9. Switch to the **Heatmap Analyzer** tab to see aggregated click dots

---

## Assumptions & Trade-offs

1. **Origin isolation vs port scoping**: Browsers scope `localStorage` by origin. Site A runs on port `8080` and Site B on port `8082` so each demo site gets independent session storage, simulating a real multi-tenant setup.
2. **Relative coordinates**: Click positions are captured relative to `document.body` so heatmap overlays render correctly in the dashboard iframe regardless of viewport size or scroll offset.
3. **Polling over WebSockets**: A 5-second silent polling loop keeps the backend REST-compliant and easy to test with standard HTTP tools. WebSockets would be the natural upgrade for production-scale real-time streaming.
4. **Iframe write suppression**: Events fired inside the dashboard preview iframe are not persisted to the database, preventing preview interactions from polluting real session data.
5. **Hardcoded API endpoint**: `tracker.js` points to `http://localhost:3000/api/events`. In production this would be configurable via a `data-endpoint` attribute or build-time injection.