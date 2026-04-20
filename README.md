# IoT Fleet Monitoring System — SAP BTP Simulation

**Student:** Dastageer — 23053275 | **Course:** OE — SAP_BTP

A production-like IoT Fleet Monitoring System that simulates SAP BTP architecture using open-source, locally-runnable tools. The system provides real-time vehicle telemetry monitoring, threshold-based alerting, and a complete maintenance workflow.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Dashboard (Vite)                       │
│              SAP Fiori-inspired Dark Theme UI                   │
└──────────────┬──────────────────────┬──────────────────────────┘
               │ REST API             │ WebSocket (real-time)
┌──────────────▼──────────────────────▼──────────────────────────┐
│                  Express + TypeScript Backend                   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ JWT Auth     │  │ CAP-like     │  │ Workflow Service    │    │
│  │ (XSUAA Sim)  │  │ Services     │  │ (Approval Flow)    │    │
│  └─────────────┘  └──────────────┘  └────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │        Event Mesh Simulation (Node.js EventEmitter)     │   │
│  │  Channels: telemetry → alerts → maintenance             │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           HANA Simulation (SQLite via sql.js)           │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

### SAP BTP Mapping

| SAP BTP Service      | Local Simulation              |
|-----------------------|-------------------------------|
| SAP HANA             | SQLite (sql.js / WASM)        |
| SAP Event Mesh       | Node.js EventEmitter          |
| SAP XSUAA            | JWT Auth + Roles              |
| SAP Workflow          | State machine in backend      |
| SAP CAP              | Express + TypeScript services |
| SAP Fiori            | React dark-themed dashboard   |

### SAP O2C Reuse Pattern

| O2C Concept       | Fleet Monitoring          |
|--------------------|--------------------------|
| SalesOrders       | Devices (fleet vehicles)  |
| SalesOrderItems   | Telemetry (readings)      |
| Delivery Workers  | Alert Processor           |
| Invoice Workers   | Maintenance Worker        |

---

## Prerequisites

- **Node.js** v18+ (tested with v24)
- **npm** v8+

No other installations required — SQLite runs in-memory via WASM.

---

## Quick Start

### 1. Install Dependencies

```bash
# Backend
cd iot-fleet-monitor/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Seed the Database

```bash
cd backend
npm run seed
```

This creates:
- 3 users (Admin, Operator, Technician)
- 5 fleet vehicles

### 3. Start the Backend

```bash
cd backend
npm run dev
```

Server starts on http://localhost:3001

### 4. Start the Frontend

```bash
cd frontend
npm run dev
```

Dashboard opens at http://localhost:5173

### 5. Login & Demo

Use quick-login buttons or these credentials:

| Role       | Username    | Password     |
|------------|-------------|-------------|
| Admin      | admin       | admin123    |
| Operator   | operator    | operator123 |
| Technician | technician  | tech123     |

---

## Demo Flow

1. **Login** as Admin using quick-login button
2. **Start Simulation** → Click the green "▶ Start Simulation" button
3. **Watch vehicles** update in real-time in the sidebar
4. **Select a vehicle** to see live telemetry gauges
5. **Inject Fault** → Click "Inject Fault" on any vehicle (forces engine temp spike)
6. **Alerts appear** automatically when thresholds are breached
7. **Work orders** are auto-created for critical alerts
8. **Approve** the work order (Admin role)
9. **Assign technician** from the dropdown
10. **Complete** the work order

---

## API Endpoints

### Auth (`/api/auth`)
- `POST /login` — Get JWT token
- `POST /register` — Create user
- `GET /me` — Current user info

### Devices (`/api/devices`)
- `GET /` — List all vehicles
- `GET /:id` — Vehicle details
- `POST /` — Register vehicle (Admin)

### Telemetry (`/api/telemetry`)
- `GET /latest` — Latest readings per device
- `GET /device/:id` — Telemetry history

### Alerts (`/api/alerts`)
- `GET /` — All alerts
- `PATCH /:id/acknowledge` — Acknowledge alert

### Work Orders (`/api/workorders`)
- `GET /` — List work orders
- `PATCH /:id/approve` — Approve (Admin)
- `PATCH /:id/assign` — Assign technician
- `PATCH /:id/complete` — Mark completed

### Simulation (`/api/simulation`)
- `POST /start` — Start telemetry sim
- `POST /stop` — Stop simulation
- `POST /trigger-fault/:deviceId` — Inject fault

---

## Database Schema

5 tables: `users`, `devices`, `telemetry`, `alerts`, `work_orders`

See `backend/src/database/schema.sql` for full schema.

---

## Project Structure

```
iot-fleet-monitor/
├── backend/
│   ├── src/
│   │   ├── config/        # Database, Event Mesh, Auth config
│   │   ├── middleware/     # JWT auth middleware
│   │   ├── services/      # CAP-like service layer
│   │   ├── routes/        # REST API endpoints
│   │   ├── events/        # Event Mesh subscribers
│   │   ├── simulator/     # Telemetry generator
│   │   ├── websocket/     # WebSocket server
│   │   ├── database/      # Schema & seed scripts
│   │   └── server.ts      # Entry point
│   └── data/              # SQLite database file
├── frontend/
│   ├── src/
│   │   ├── components/    # React UI components
│   │   ├── hooks/         # WebSocket hook
│   │   ├── services/      # API client
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx        # Main app
│   │   └── index.css      # Premium dark theme
│   └── index.html
└── README.md
```

---

## Alert Thresholds

| Metric          | Warning    | Critical    |
|-----------------|------------|-------------|
| Engine Temp     | > 95°C    | > 105°C    |
| Speed           | > 100 km/h | > 130 km/h |
| Fuel Level      | < 15%     | < 5%       |
| Battery Voltage | < 11.5V   | < 10.5V    |

---

## Workflow States

```
Created → Approved → Assigned → InProgress → Completed
```

- **Created**: Auto-generated on critical alert
- **Approved**: Admin approves maintenance request
- **Assigned**: Technician assigned to task
- **InProgress**: Technician starts work
- **Completed**: Work finished with resolution notes

---

## Technology Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, Vite, TypeScript
- **Database**: SQLite (sql.js WASM)
- **Event Mesh**: Node.js EventEmitter
- **Real-time**: WebSocket (ws)
- **Auth**: JWT + bcrypt
- **Styling**: Vanilla CSS (SAP Fiori dark theme)
