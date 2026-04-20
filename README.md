# IoT Fleet Monitoring System - SAP BTP Architecture Simulation

**Student:** Dastageer - 23053275 | **Course:** OE - SAP_BTP (6th Semester)

## Overview

This project demonstrates how a production IoT Fleet Monitoring System would be architected on **SAP Business Technology Platform (BTP)**. Instead of requiring paid SAP cloud subscriptions, every core BTP service is simulated using open-source, locally-runnable equivalents. The system ingests real-time vehicle telemetry, evaluates threshold-based rules to generate alerts, and drives an automated maintenance workflow with role-based approvals - mirroring the patterns used in real SAP enterprise deployments.

## SAP BTP Service Mapping

The table below shows exactly which SAP BTP service each component simulates, and how:

| SAP BTP Service | What It Does | Local Simulation | Implementation |
|---|---|---|---|
| **SAP HANA Cloud** | Columnar in-memory database | SQLite via sql.js (WASM) | `config/database.ts` |
| **SAP Event Mesh** | Pub/sub message broker | Node.js EventEmitter (singleton) | `config/event-mesh.ts` |
| **SAP XSUAA** | OAuth2 + role-based auth | JWT tokens + bcrypt hashing | `config/auth.ts`, `middleware/` |
| **SAP Workflow Management** | Multi-step approval engine | State machine (5-step flow) | `services/workflow.service.ts` |
| **SAP Cloud Application Programming Model (CAP)** | Service layer framework | Express + TypeScript services | `services/*.service.ts` |
| **SAP Fiori / UI5** | Enterprise frontend framework | React + Vite (dark theme) | `frontend/src/` |
| **SAP IoT Services** | Device management + telemetry | Telemetry generator + WebSocket | `simulator/`, `websocket/` |

## SAP CAP Reuse Model (O2C Pattern)

This project adapts the **SAP Order-to-Cash (O2C)** reuse model from CAP to an IoT domain:

| O2C Entity | IoT Fleet Equivalent | Purpose |
|---|---|---|
| `SalesOrders` | `devices` table | Fleet vehicles registered in the system |
| `SalesOrderItems` | `telemetry` table | Individual sensor readings per vehicle |
| Delivery Workers | Alert Processing Service | Evaluates thresholds, raises alerts |
| Invoice Workers | Maintenance Workflow Service | Creates and manages work orders |

This mapping demonstrates understanding of CAP's layered service architecture where entities, events, and actions form the core abstraction.

## Architecture

```
Frontend (SAP Fiori Simulation)
    |
    |--- REST API (CAP-like OData simulation)
    |--- WebSocket (real-time push)
    |
Backend (SAP CAP Simulation - Express + TypeScript)
    |
    |--- Auth Middleware (XSUAA Simulation - JWT + RBAC)
    |--- Telemetry Service (processes incoming sensor data)
    |--- Alert Service (threshold evaluation engine)
    |--- Workflow Service (SAP Workflow - 5-step state machine)
    |
    |--- Event Mesh Simulation (pub/sub channels)
    |       |--- Channel: telemetry (raw sensor data stream)
    |       |--- Channel: alerts (threshold breach events)
    |       |--- Channel: maintenance (work order triggers)
    |
    |--- HANA Simulation (SQLite via sql.js WASM)
            |--- users, devices, telemetry, alerts, work_orders
```

### Event-Driven Data Flow

The system follows an event-driven architecture, simulating how SAP Event Mesh decouples services:

1. **Telemetry Generator** publishes sensor data to the `telemetry` channel
2. **Telemetry Service** (subscriber) processes and stores the data, then evaluates thresholds
3. If a threshold is breached, an event is published to the `alerts` channel
4. **Alert Service** (subscriber) stores the alert and broadcasts it via WebSocket
5. For critical alerts, a maintenance event is published to the `maintenance` channel
6. **Workflow Service** (subscriber) auto-creates a work order with status "Created"
7. The work order then follows the SAP Workflow approval flow:
   `Created -> Approved -> Assigned -> InProgress -> Completed`

## XSUAA Role-Based Access Control

Three roles simulate SAP XSUAA scopes and role collections:

| Role | Permissions | SAP XSUAA Equivalent |
|---|---|---|
| **Admin** | Full access: approve orders, assign technicians, start simulation, inject faults | `FleetAdmin` role collection |
| **Operator** | Monitor fleet, start simulation, assign technicians | `FleetOperator` role collection |
| **Technician** | View assigned work, start/complete work orders | `FleetTechnician` role collection |

## Prerequisites

- **Node.js** v18+ (tested with v24)
- **npm** v8+

No SAP BTP account required. No external databases. SQLite runs entirely in-memory via WebAssembly.

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

Creates 3 users (Admin, Operator, Technician) and 5 fleet vehicles.

### 3. Start the Backend

```bash
cd backend
npm run dev
```

Server starts at `http://localhost:3001`

### 4. Start the Frontend

```bash
cd frontend
npm run dev
```

Dashboard opens at `http://localhost:5173`

### 5. Login

Use the quick-login buttons on the login page, or enter credentials manually:

| Role | Username | Password |
|---|---|---|
| Admin | admin | admin123 |
| Operator | operator | operator123 |
| Technician | technician | tech123 |

## Demo Walkthrough

1. **Login** as Admin using the quick-login button
2. **Start Simulation** - click the green button in the navbar to begin telemetry generation
3. **Observe real-time updates** - vehicle cards in the sidebar show live speed, temperature, and fuel
4. **Select a vehicle** - click any card to see detailed telemetry gauges
5. **Inject a fault** - click "Inject Fault" on a vehicle to force an engine temperature spike
6. **Watch alerts appear** - the Alerts panel populates as thresholds are breached
7. **Work orders auto-create** - critical alerts trigger automatic work order creation
8. **Approve the work order** (Admin role required)
9. **Assign a technician** from the dropdown
10. **Complete the work** - the workflow progress bar advances through all 5 states

## Alert Thresholds

Configurable thresholds that trigger the alert processing pipeline:

| Metric | Warning | Critical |
|---|---|---|
| Engine Temperature | > 95 C | > 105 C |
| Speed | > 100 km/h | > 130 km/h |
| Fuel Level | < 15% | < 5% |
| Battery Voltage | < 11.5V | < 10.5V |

## Database Schema (HANA Simulation)

5 normalized tables with foreign key relationships and performance indexes:

- **users** - XSUAA user store (id, username, password_hash, role, full_name)
- **devices** - Fleet vehicle registry (id, vehicle_id, name, type, status, GPS coords)
- **telemetry** - Time-series sensor readings (speed, fuel, temp, voltage, odometer, GPS)
- **alerts** - Threshold breach records (severity, metric, threshold vs actual value)
- **work_orders** - Maintenance workflow (5-step status, priority, assignment, resolution notes)

Full schema: `backend/src/database/schema.sql`

## API Endpoints (CAP-like OData Simulation)

### Authentication (`/api/auth`)
- `POST /login` - Authenticate and receive JWT token
- `POST /register` - Create new user
- `GET /me` - Get current user profile

### Devices (`/api/devices`)
- `GET /` - List all fleet vehicles
- `GET /:id` - Get vehicle details
- `POST /` - Register new vehicle (Admin only)

### Telemetry (`/api/telemetry`)
- `GET /latest` - Latest readings per device
- `GET /device/:id` - Telemetry history for a device

### Alerts (`/api/alerts`)
- `GET /` - List all alerts
- `PATCH /:id/acknowledge` - Acknowledge an alert

### Work Orders (`/api/workorders`)
- `GET /` - List all work orders
- `PATCH /:id/approve` - Approve work order (Admin)
- `PATCH /:id/assign` - Assign technician
- `PATCH /:id/start` - Start work
- `PATCH /:id/complete` - Complete with resolution notes

### Simulation Control (`/api/simulation`)
- `POST /start` - Start telemetry generation
- `POST /stop` - Stop simulation
- `POST /trigger-fault/:deviceId` - Inject fault into a vehicle
- `GET /status` - Get simulation status

## Project Structure

```
iot-fleet-monitor/
|-- backend/
|   |-- src/
|   |   |-- config/           # SAP BTP service configurations
|   |   |   |-- database.ts   # HANA simulation (sql.js)
|   |   |   |-- event-mesh.ts # Event Mesh simulation (EventEmitter)
|   |   |   |-- auth.ts       # XSUAA config (JWT secret, thresholds)
|   |   |-- middleware/        # JWT auth middleware
|   |   |-- services/          # CAP-like service layer
|   |   |   |-- telemetry.service.ts  # Telemetry processing + threshold checks
|   |   |   |-- alert.service.ts      # Alert persistence + broadcasting
|   |   |   |-- workflow.service.ts   # SAP Workflow state machine
|   |   |   |-- device.service.ts     # Device CRUD operations
|   |   |-- routes/            # REST API endpoint handlers
|   |   |-- events/            # Event Mesh channel subscribers
|   |   |-- simulator/         # Telemetry data generator
|   |   |-- websocket/         # WebSocket server for real-time push
|   |   |-- database/          # SQL schema + seed scripts
|   |   |-- server.ts          # Express entry point
|   |-- data/                  # SQLite database file (auto-created)
|-- frontend/
|   |-- src/
|   |   |-- components/        # React UI components (Fiori-style)
|   |   |-- hooks/             # WebSocket connection hook
|   |   |-- services/          # REST API client
|   |   |-- types/             # TypeScript type definitions
|   |   |-- App.tsx            # Main dashboard layout
|   |   |-- index.css          # Dark theme stylesheet
|   |-- index.html
|-- README.md
```

## Technology Stack

| Layer | Technology | SAP BTP Equivalent |
|---|---|---|
| Backend Runtime | Node.js + Express + TypeScript | SAP CAP (Node.js runtime) |
| Frontend | React + Vite + TypeScript | SAP Fiori / UI5 |
| Database | SQLite via sql.js (WASM) | SAP HANA Cloud |
| Messaging | Node.js EventEmitter | SAP Event Mesh |
| Real-time | WebSocket (ws library) | SAP Event Mesh WebSocket |
| Authentication | JWT + bcrypt | SAP XSUAA |
| Styling | Vanilla CSS (dark theme) | SAP Fiori Theming |
