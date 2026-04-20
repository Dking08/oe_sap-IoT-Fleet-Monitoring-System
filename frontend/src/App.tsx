/**
 * App Component - Root of the IoT Fleet Monitoring Dashboard
 * Handles auth state and view switching (Login / Dashboard)
 */
import { useState, useEffect, useCallback } from 'react';
import { User, Device, TelemetryData, Alert, WorkOrder, WSMessage, SimulationStatus } from './types';
import { api } from './services/api';
import { useWebSocket } from './hooks/useWebSocket';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import DeviceList from './components/DeviceList';
import TelemetryPanel from './components/TelemetryPanel';
import AlertsPanel from './components/AlertsPanel';
import WorkOrdersPanel from './components/WorkOrdersPanel';

function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Dashboard state
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [latestTelemetry, setLatestTelemetry] = useState<Record<string, TelemetryData>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [simStatus, setSimStatus] = useState<SimulationStatus>({ running: false, vehicleCount: 0 });

  // Check existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('fleet_monitor_token');
    const savedUser = localStorage.getItem('fleet_monitor_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch { /* invalid saved user */ }
    }
    setLoading(false);
  }, []);

  // Load initial data when user is authenticated
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [devicesData, alertsData, workOrdersData, simStatusData] = await Promise.all([
          api.devices.getAll(),
          api.alerts.getAll(50),
          api.workOrders.getAll(),
          api.simulation.getStatus(),
        ]);
        setDevices(devicesData);
        setAlerts(alertsData);
        setWorkOrders(workOrdersData);
        setSimStatus(simStatusData);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };
    loadData();
  }, [user]);

  // WebSocket message handler
  const handleWSMessage = useCallback((msg: WSMessage) => {
    switch (msg.type) {
      case 'telemetry': {
        const t = msg.data as TelemetryData;
        const deviceId = t.deviceId || t.device_id;
        // Update latest telemetry map
        setLatestTelemetry(prev => ({ ...prev, [deviceId]: t }));
        // Update device status
        setDevices(prev => prev.map(d =>
          d.id === deviceId
            ? { ...d, status: (t.status || t.device_status || d.status) as Device['status'], latitude: t.latitude, longitude: t.longitude, last_seen: t.recordedAt || t.recorded_at || d.last_seen }
            : d
        ));
        break;
      }
      case 'alert': {
        const a = msg.data as Alert;
        setAlerts(prev => [a, ...prev].slice(0, 100));
        break;
      }
      case 'alert_updated': {
        const a = msg.data as Alert;
        setAlerts(prev => prev.map(existing => existing.id === a.id ? a : existing));
        break;
      }
      case 'workorder':
      case 'workorder_updated': {
        const wo = msg.data as WorkOrder;
        setWorkOrders(prev => {
          const exists = prev.find(w => w.id === wo.id);
          if (exists) {
            return prev.map(w => w.id === wo.id ? wo : w);
          }
          return [wo, ...prev];
        });
        break;
      }
    }
  }, []);

  // Connect WebSocket only when authenticated
  const { connected } = useWebSocket(user ? handleWSMessage : () => {});

  // Auth handlers
  const handleLogin = async (username: string, password: string) => {
    const response = await api.auth.login(username, password);
    localStorage.setItem('fleet_monitor_token', response.token);
    localStorage.setItem('fleet_monitor_user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('fleet_monitor_token');
    localStorage.removeItem('fleet_monitor_user');
    setUser(null);
    setDevices([]);
    setAlerts([]);
    setWorkOrders([]);
    setLatestTelemetry({});
  };

  // Simulation controls
  const handleSimStart = async () => {
    await api.simulation.start();
    setSimStatus({ running: true, vehicleCount: devices.length });
  };

  const handleSimStop = async () => {
    await api.simulation.stop();
    setSimStatus({ running: false, vehicleCount: devices.length });
  };

  const handleTriggerFault = async (deviceId: string) => {
    await api.simulation.triggerFault(deviceId);
  };

  // Loading state
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Initializing Fleet Monitor...</p>
      </div>
    );
  }

  // Not authenticated — show login
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Main dashboard
  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || null;
  const selectedTelemetry = selectedDeviceId ? latestTelemetry[selectedDeviceId] : null;

  return (
    <div className="app">
      <Navbar
        user={user}
        onLogout={handleLogout}
        simStatus={simStatus}
        onSimStart={handleSimStart}
        onSimStop={handleSimStop}
        wsConnected={connected}
      />
      <div className="dashboard">
        <aside className="sidebar">
          <DeviceList
            devices={devices}
            latestTelemetry={latestTelemetry}
            selectedDeviceId={selectedDeviceId}
            onSelectDevice={setSelectedDeviceId}
            onTriggerFault={handleTriggerFault}
            userRole={user.role}
          />
        </aside>
        <main className="main-content">
          <TelemetryPanel
            device={selectedDevice}
            telemetry={selectedTelemetry}
          />
          <div className="bottom-panels">
            <AlertsPanel
              alerts={alerts}
              selectedDeviceId={selectedDeviceId}
            />
            <WorkOrdersPanel
              workOrders={workOrders}
              userRole={user.role}
              userId={user.id}
              onRefresh={async () => {
                const data = await api.workOrders.getAll();
                setWorkOrders(data);
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
