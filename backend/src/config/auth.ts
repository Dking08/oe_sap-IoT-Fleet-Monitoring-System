/**
 * XSUAA Simulation — JWT Authentication Configuration
 * Simulates SAP XSUAA token-based auth with role scopes
 */

export const AUTH_CONFIG = {
  jwtSecret: 'sap-btp-iot-fleet-monitor-xsuaa-secret-2024',
  jwtExpiresIn: '24h',
  saltRounds: 10,
};

export const ROLES = {
  ADMIN: 'Admin',
  OPERATOR: 'Operator',
  TECHNICIAN: 'Technician',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/**
 * Alert threshold configuration
 * Defines when telemetry values trigger warnings/critical alerts
 */
export const THRESHOLDS = {
  engineTemp: { warning: 95, critical: 105, unit: '°C' },
  speed: { warning: 100, critical: 130, unit: 'km/h' },
  fuelLevel: { warningBelow: 15, criticalBelow: 5, unit: '%' },
  batteryVoltage: { warningBelow: 11.5, criticalBelow: 10.5, unit: 'V' },
};
