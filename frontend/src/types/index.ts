/**
 * TypeScript type definitions for the IoT Fleet Monitoring System
 */

export interface User {
  id: string;
  username: string;
  role: 'Admin' | 'Operator' | 'Technician';
  fullName: string;
}

export interface Device {
  id: string;
  vehicle_id: string;
  name: string;
  type: 'Truck' | 'Van' | 'Car';
  status: 'OK' | 'Warning' | 'Critical' | 'Offline';
  latitude: number;
  longitude: number;
  last_seen: string | null;
  created_at: string;
}

export interface TelemetryData {
  id: string;
  device_id: string;
  deviceId?: string;
  vehicle_id?: string;
  vehicleId?: string;
  device_name?: string;
  speed: number;
  fuel_level?: number;
  fuelLevel?: number;
  engine_temp?: number;
  engineTemp?: number;
  latitude: number;
  longitude: number;
  battery_voltage?: number;
  batteryVoltage?: number;
  odometer: number;
  recorded_at?: string;
  recordedAt?: string;
  status?: string;
  device_status?: string;
}

export interface Alert {
  id: string;
  device_id?: string;
  deviceId?: string;
  vehicle_id?: string;
  device_name?: string;
  telemetry_id?: string;
  telemetryId?: string;
  severity: 'warning' | 'critical';
  metric: string;
  threshold: number;
  actual_value?: number;
  actualValue?: number;
  message: string;
  acknowledged: number | boolean;
  created_at: string;
}

export interface WorkOrder {
  id: string;
  device_id: string;
  alert_id: string;
  assigned_to: string | null;
  vehicle_id: string;
  device_name: string;
  technician_name: string | null;
  technician_username: string | null;
  status: 'Created' | 'Approved' | 'Assigned' | 'InProgress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface WSMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface SimulationStatus {
  running: boolean;
  vehicleCount: number;
}
