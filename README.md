# Trackker - Full-Stack User Analytics Platform

Trackker is a high-fidelity, full-stack user analytics and telemetry platform designed to track user interactions (`page_view` and `click` events) in real-time and visualize them using a session journey timeline and click heatmap overlay.

This project was built as part of the hiring process for the Full Stack Engineer role at **CausalFunnel**.

---

## 🚀 Live Demo & Ports Architecture

To simulate a real analytics system where multiple client sites are tracked independently without cross-site data contamination, the application is divided into separate ports:

*   **Analytics Dashboard (Next.js)**: `http://localhost:3001`
*   **Telemetry API Backend (Node/Express)**: `http://localhost:3000`
*   **Demo Website A (Site A)**: `http://localhost:8080/demo.html`
*   **Demo Website B (Site B)**: `http://localhost:8082/demoB.html`

---

## 🛠️ Tech Stack

*   **Frontend (Dashboard)**: Next.js 16 (App Router), React 19, Tailwind CSS.
*   **Backend (API Server)**: Node.js, Express, TypeScript, Zod (Schema Validation), Mongoose.
*   **Database**: MongoDB (with optimized compound indexes).
*   **Client SDK**: Custom lightweight vanilla JavaScript IIFE tracker.

---

## ✨ Features Implemented

### 1. Client-Side Tracking SDK (`tracker.js`)
*   **Event Ingestion**: Captures `page_view` and `click` events automatically.
*   **Data Captured**: `session_id`, `event_type`, `page_url`, `timestamp`, and `x`/`y` click coordinates (relative to the body element to handle dynamic resizing, centering, and page scrolls correctly).
*   **Local Storage Isolation**: Scopes session IDs by tracking ID so that multiple websites hosted on the same origin (or different origins) do not leak session keys to each other.
*   **Legacy Key Cleanup**: Automatically wipes legacy unscoped keys and temporary unknown session keys upon initialization to prevent storage pollution.

### 2. Node.js & Express API Backend
*   **Type Safety**: Written in pure TypeScript with hot-reloading native watch configurations (`node --watch`).
*   **Zod Validations**: All incoming tracking payloads are validated against strict Zod schemas before database insertion.
*   **API Endpoints**:
    *   `POST /api/events` - Records telemetry events.
    *   `GET /api/sessions?trackingId=...` - Returns unique sessions for a site, including first/last seen timestamps and event counts.
    *   `GET /api/sessions/:sessionId?trackingId=...` - Fetches the chronological user journey of a session.
    *   `DELETE /api/sessions/:sessionId?trackingId=...` - Wipes a session and its events from the database.
    *   `GET /api/clicks?trackingId=...&page_url=...` - Queries all click data points for a specific URL's heatmap.

### 3. Analytics Dashboard
*   **Unified Three-Panel Workspace**:
    *   **Sidebar Panel (Left)**: Lists active sessions, event counts, first seen times, and calculated session durations.
    *   **Journey Timeline (Middle)**: Displays a vertical, color-coded node timeline mapping page views and clicks chronologically. Each node expands/collapses to reveal metadata (exact coordinate offsets, date/times).
    *   **Heatmap Canvas (Right)**: Renders the target website inside an iframe with a toggleable visual overlay showing pulsing click coordinate dots. Click dots display index and coordinates on hover.
*   **Auto-Sync Preview**: Selecting any session in the sidebar automatically sets the visualizer iframe preview to the correct website URL belonging to that session's events.
*   **Real-time Silent Polling**: Automatically fetches backend changes every **5 seconds** without flickering loading indicators or layout jumps.
*   **Custom Toast Alerts**: Replaced native browser alerts with custom glassmorphic slide-in notifications for actions like deletion success, failure warnings, and manual data refreshes.
*   **State Persistence**: Persists your selected tracking scope and session ID across page reloads.

---

## 🗄️ Database Schema & Indexes

### Event Schema:
```typescript
{
  trackingId: String,   // Scoping identifier for clients
  session_id: String,   // Session tracking key
  event_type: String,   // 'page_view' | 'click'
  page_url: String,     // Page URL where event occurred
  timestamp: Date,      // ISODate of the event
  x: Number,            // Click X coordinate (null for page views)
  y: Number             // Click Y coordinate (null for page views)
}
```

### Indexed Fields for Query Optimization:
Compound indexes are defined to ensure fast retrieval when querying scoped client data:
*   `{ trackingId: 1, session_id: 1, timestamp: 1 }` (Speeds up user journey timelines)
*   `{ trackingId: 1, page_url: 1, event_type: 1 }` (Speeds up heatmap coordinate queries)
*   `{ trackingId: 1, session_id: 1 }` (Speeds up session list aggregation groupings)

---

## ⚡ Setup & Run Instructions

### Prerequisites
*   Node.js (v18+)
*   pnpm (or npm/yarn)
*   MongoDB running locally on `mongodb://localhost:27017` (you can customize this by setting the `MONGO_URI` environment variable).

### One-Click Startup
A script is provided to automatically clean up previous port bindings and start all servers in the background.

1.  Make sure the script is executable:
    ```bash
    chmod +x script.sh
    ```
2.  Start the services:
    ```bash
    ./script.sh
    ```
3.  Access the applications at:
    *   **Dashboard**: [http://localhost:3001](http://localhost:3001)
    *   **Demo Site A**: [http://localhost:8080/demo.html](http://localhost:8080/demo.html)
    *   **Demo Site B**: [http://localhost:8082/demoB.html](http://localhost:8082/demoB.html)

4.  Logs can be monitored at:
    *   API Backend: `server/api.log`
    *   Demo Site A: `demo.log`
    *   Demo Site B: `demoB.log`
    *   Dashboard: `dashboard/dashboard.log`

---

## 🧠 Assumptions & Trade-offs

1.  **Origin Isolation vs Port Scoping**: Since standard browsers use origin-scoped local storage, running both demo websites on the same port would share local storage. To simulate a real-world multi-tenant tracking scenario, we configured Site A on port `8080` and Site B on port `8082`.
2.  **Relative Coordinates**: Page coordinates depend on screen sizes. To render heatmaps accurately on the dashboard preview regardless of screen scale, coordinates are captured relative to the document's body boundaries (handling margin centers and vertical scroll offsets).
3.  **Real-Time Architecture**: WebSockets are ideal for streaming dashboards. For this task, a 5-second silent polling implementation was chosen to keep backend endpoints lightweight, REST-compliant, and fully testable through standard HTTP clients.
