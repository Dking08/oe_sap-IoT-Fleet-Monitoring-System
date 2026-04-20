-- ============================================================
-- IoT Fleet Monitoring System — Database Schema
-- Simulates SAP HANA using SQLite
-- Student: Dastageer - 23053275 | Course: OE - SAP_BTP
-- ============================================================

-- SAP O2C Pattern: Users → XSUAA Simulation
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Admin', 'Operator', 'Technician')),
    full_name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- SAP O2C Pattern: SalesOrders → Devices (Fleet Vehicles)
CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Truck', 'Van', 'Car')),
    status TEXT DEFAULT 'Offline' CHECK(status IN ('OK', 'Warning', 'Critical', 'Offline')),
    latitude REAL DEFAULT 0,
    longitude REAL DEFAULT 0,
    last_seen TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- SAP O2C Pattern: SalesOrderItems → Telemetry (Readings per Device)
CREATE TABLE IF NOT EXISTS telemetry (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    speed REAL,
    fuel_level REAL,
    engine_temp REAL,
    latitude REAL,
    longitude REAL,
    battery_voltage REAL,
    odometer REAL,
    recorded_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- SAP O2C Pattern: Delivery Workers → Alert Processor
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    telemetry_id TEXT,
    severity TEXT NOT NULL CHECK(severity IN ('warning', 'critical')),
    metric TEXT NOT NULL,
    threshold REAL,
    actual_value REAL,
    message TEXT,
    acknowledged INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (device_id) REFERENCES devices(id),
    FOREIGN KEY (telemetry_id) REFERENCES telemetry(id)
);

-- SAP O2C Pattern: Invoice Workers → Maintenance Work Orders
CREATE TABLE IF NOT EXISTS work_orders (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    alert_id TEXT,
    assigned_to TEXT,
    status TEXT DEFAULT 'Created' CHECK(status IN ('Created', 'Approved', 'Assigned', 'InProgress', 'Completed')),
    priority TEXT DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High', 'Critical')),
    description TEXT,
    resolution_notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (device_id) REFERENCES devices(id),
    FOREIGN KEY (alert_id) REFERENCES alerts(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_telemetry_device_id ON telemetry(device_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_recorded_at ON telemetry(recorded_at);
CREATE INDEX IF NOT EXISTS idx_alerts_device_id ON alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_work_orders_device_id ON work_orders(device_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_to ON work_orders(assigned_to);
