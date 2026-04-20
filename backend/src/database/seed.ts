/**
 * Database Seed Script
 * Populates initial data: 3 users (one per role) + 5 fleet vehicles
 * Run: npm run seed
 */
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { initializeDatabase, execute } from '../config/database';
import { AUTH_CONFIG } from '../config/auth';

async function seed(): Promise<void> {
  console.log('=== IoT Fleet Monitor — Database Seed ===');
  console.log('Student: Dastageer - 23053275 | Course: OE - SAP_BTP\n');

  await initializeDatabase();

  // Clear existing data
  execute('DELETE FROM work_orders');
  execute('DELETE FROM alerts');
  execute('DELETE FROM telemetry');
  execute('DELETE FROM devices');
  execute('DELETE FROM users');

  // ─── Users (XSUAA Simulation) ─────────────────────────────
  const users = [
    { id: uuidv4(), username: 'admin', password: 'admin123', role: 'Admin', fullName: 'Dastageer (Admin)' },
    { id: uuidv4(), username: 'operator', password: 'operator123', role: 'Operator', fullName: 'Fleet Operator' },
    { id: uuidv4(), username: 'technician', password: 'tech123', role: 'Technician', fullName: 'Ravi Mechanic' },
  ];

  users.forEach((u) => {
    const hash = bcrypt.hashSync(u.password, AUTH_CONFIG.saltRounds);
    execute(
      'INSERT INTO users (id, username, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?)',
      [u.id, u.username, hash, u.role, u.fullName]
    );
    console.log(`  ✓ User: ${u.username} (${u.role}) — password: ${u.password}`);
  });

  // ─── Devices / Vehicles (SAP SalesOrders) ─────────────────
  const devices = [
    { id: uuidv4(), vehicleId: 'VH-001', name: 'Alpha Hauler', type: 'Truck', lat: 12.9716, lon: 77.5946 },
    { id: uuidv4(), vehicleId: 'VH-002', name: 'Beta Express', type: 'Van', lat: 12.9352, lon: 77.6245 },
    { id: uuidv4(), vehicleId: 'VH-003', name: 'Gamma Runner', type: 'Car', lat: 12.9854, lon: 77.5533 },
    { id: uuidv4(), vehicleId: 'VH-004', name: 'Delta Freight', type: 'Truck', lat: 13.0127, lon: 77.5671 },
    { id: uuidv4(), vehicleId: 'VH-005', name: 'Echo Swift', type: 'Van', lat: 12.9611, lon: 77.6387 },
  ];

  devices.forEach((d) => {
    execute(
      'INSERT INTO devices (id, vehicle_id, name, type, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)',
      [d.id, d.vehicleId, d.name, d.type, d.lat, d.lon]
    );
    console.log(`  ✓ Device: ${d.vehicleId} — ${d.name} (${d.type})`);
  });

  console.log('\n=== Seed complete ===');
  console.log(`  ${users.length} users, ${devices.length} devices created`);
  console.log('\nLogin credentials:');
  users.forEach((u) => {
    console.log(`  ${u.role.padEnd(12)} → username: ${u.username}, password: ${u.password}`);
  });
}

seed().catch(console.error);
