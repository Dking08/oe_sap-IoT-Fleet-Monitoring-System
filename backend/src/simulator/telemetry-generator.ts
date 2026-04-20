/**
 * Telemetry Generator — Vehicle Simulator
 * Generates realistic telemetry data for fleet vehicles.
 */
import { v4 as uuidv4 } from 'uuid';
import { eventMesh } from '../config/event-mesh';
import { queryAll } from '../config/database';

interface VehicleState {
  deviceId: string;
  vehicleId: string;
  speed: number;
  fuelLevel: number;
  engineTemp: number;
  latitude: number;
  longitude: number;
  batteryVoltage: number;
  odometer: number;
  heading: number;
  faultInjected: boolean;
  faultTimeout: ReturnType<typeof setTimeout> | null;
}

class TelemetryGenerator {
  private vehicles: Map<string, VehicleState> = new Map();
  private interval: ReturnType<typeof setInterval> | null = null;
  private running = false;

  private initialize(): void {
    const devices = queryAll('SELECT id, vehicle_id, latitude, longitude FROM devices');
    this.vehicles.clear();

    devices.forEach((device: any) => {
      this.vehicles.set(device.id, {
        deviceId: device.id,
        vehicleId: device.vehicle_id,
        speed: 30 + Math.random() * 50,
        fuelLevel: 55 + Math.random() * 40,
        engineTemp: 72 + Math.random() * 18,
        latitude: device.latitude || 12.9716 + (Math.random() - 0.5) * 0.08,
        longitude: device.longitude || 77.5946 + (Math.random() - 0.5) * 0.08,
        batteryVoltage: 12.6 + Math.random() * 1.4,
        odometer: 15000 + Math.random() * 85000,
        heading: Math.random() * 360,
        faultInjected: false,
        faultTimeout: null,
      });
    });

    console.log(`[Simulator] Initialized ${this.vehicles.size} vehicle(s)`);
  }

  start(): void {
    if (this.running) return;
    this.initialize();
    this.running = true;

    this.interval = setInterval(() => {
      this.vehicles.forEach((state) => {
        this.evolveState(state);
        this.publishTelemetry(state);
      });
    }, 3000);

    console.log('[Simulator] Telemetry generation STARTED (interval: 3s)');
  }

  stop(): void {
    if (this.interval) { clearInterval(this.interval); this.interval = null; }
    this.running = false;
    this.vehicles.forEach((state) => { if (state.faultTimeout) clearTimeout(state.faultTimeout); });
    console.log('[Simulator] Telemetry generation STOPPED');
  }

  isRunning(): boolean { return this.running; }
  getVehicleCount(): number { return this.vehicles.size; }

  injectFault(deviceId: string): boolean {
    const state = this.vehicles.get(deviceId);
    if (!state) return false;
    state.faultInjected = true;
    console.log(`[Simulator] FAULT INJECTED into ${state.vehicleId}`);
    if (state.faultTimeout) clearTimeout(state.faultTimeout);
    state.faultTimeout = setTimeout(() => {
      state.faultInjected = false;
      state.engineTemp = 80 + Math.random() * 10;
      console.log(`[Simulator] Fault cleared for ${state.vehicleId}`);
    }, 30000);
    return true;
  }

  private evolveState(state: VehicleState): void {
    state.speed += (Math.random() - 0.48) * 12;
    state.speed = Math.max(0, Math.min(140, state.speed));

    state.fuelLevel -= Math.random() * 0.4 * (state.speed / 60);
    if (state.fuelLevel <= 0) state.fuelLevel = 80 + Math.random() * 15;

    if (state.faultInjected) {
      state.engineTemp += 2 + Math.random() * 4;
      state.engineTemp = Math.min(135, state.engineTemp);
    } else {
      const targetTemp = 78 + (state.speed / 140) * 15;
      state.engineTemp += (targetTemp - state.engineTemp) * 0.3 + (Math.random() - 0.5) * 2;
      state.engineTemp = Math.max(65, Math.min(98, state.engineTemp));
    }

    const distanceKm = (state.speed / 3600) * 3;
    const latDelta = (distanceKm / 111) * Math.cos((state.heading * Math.PI) / 180);
    const lonDelta = (distanceKm / (111 * Math.cos((state.latitude * Math.PI) / 180))) * Math.sin((state.heading * Math.PI) / 180);
    state.latitude += latDelta;
    state.longitude += lonDelta;

    state.heading += (Math.random() - 0.5) * 25;
    if (state.heading < 0) state.heading += 360;
    if (state.heading >= 360) state.heading -= 360;

    state.batteryVoltage += (Math.random() - 0.5) * 0.15;
    state.batteryVoltage = Math.max(10.0, Math.min(14.8, state.batteryVoltage));

    state.odometer += distanceKm;
  }

  private publishTelemetry(state: VehicleState): void {
    eventMesh.publish('telemetry', {
      id: uuidv4(),
      deviceId: state.deviceId,
      vehicleId: state.vehicleId,
      speed: Math.round(state.speed * 10) / 10,
      fuelLevel: Math.round(state.fuelLevel * 10) / 10,
      engineTemp: Math.round(state.engineTemp * 10) / 10,
      latitude: Math.round(state.latitude * 100000) / 100000,
      longitude: Math.round(state.longitude * 100000) / 100000,
      batteryVoltage: Math.round(state.batteryVoltage * 100) / 100,
      odometer: Math.round(state.odometer),
      recordedAt: new Date().toISOString(),
    });
  }
}

export const telemetryGenerator = new TelemetryGenerator();
