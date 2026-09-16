import { BleDevice } from '../types';

type BleTriggerCallback = (device: BleDevice, actionType: BleDevice['pressAction']) => void;

class BleManager {
  private connectedDevices: BleDevice[] = [
    {
      id: 'ble-aura-ring-01',
      name: 'Aura Smart Ring X1',
      deviceType: 'ring',
      macAddress: 'E4:95:6E:41:A8:12',
      connected: true,
      batteryLevel: 88,
      rssi: -54,
      firmwareVersion: 'v2.4.1-safety',
      lastSyncTime: 'Just now',
      pressAction: 'instant_sos',
      hapticFeedback: true,
      isSimulated: true,
    }
  ];

  private listeners: BleTriggerCallback[] = [];
  private stateChangeListeners: ((devices: BleDevice[]) => void)[] = [];

  onTrigger(cb: BleTriggerCallback) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  onDevicesChange(cb: (devices: BleDevice[]) => void) {
    this.stateChangeListeners.push(cb);
    cb(this.connectedDevices);
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter(l => l !== cb);
    };
  }

  getDevices(): BleDevice[] {
    return [...this.connectedDevices];
  }

  isWebBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async pairHardwareDevice(): Promise<{ success: boolean; device?: BleDevice; message: string }> {
    if (!this.isWebBluetoothSupported()) {
      return {
        success: false,
        message: 'Web Bluetooth API is not supported in this browser. You can use the built-in Hardware Simulator below.',
      };
    }

    try {
      // Prompt user to select nearby BLE safety device
      // Standard battery service + generic access or custom safety GATT
      const navAny = navigator as unknown as {
        bluetooth: {
          requestDevice: (options: unknown) => Promise<{
            id: string;
            name?: string;
            gatt?: {
              connect: () => Promise<unknown>;
            };
          }>;
        };
      };

      const device = await navAny.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 0x1802, 0x180F]
      });

      const newBleDevice: BleDevice = {
        id: `ble-hw-${Date.now()}`,
        name: device.name || 'Safety Wearable Device',
        deviceType: device.name?.toLowerCase().includes('ring') ? 'ring' : 'smartband',
        macAddress: `${Math.floor(Math.random()*89+10)}:${Math.floor(Math.random()*89+10)}:FF:A1:02`,
        connected: true,
        isHardwareWebBle: true,
        batteryLevel: 94,
        rssi: -48,
        firmwareVersion: 'v1.0-ble',
        lastSyncTime: 'Just now',
        pressAction: 'instant_sos',
        hapticFeedback: true,
        isSimulated: false,
      };

      this.connectedDevices = [newBleDevice, ...this.connectedDevices];
      this.notifyState();
      return { success: true, device: newBleDevice, message: `Connected to ${newBleDevice.name} via BLE!` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Pairing cancelled or failed';
      return { success: false, message: msg };
    }
  }

  // Add simulated wearable (Ring, Pendant, Clip, Wristband)
  addSimulatedDevice(type: BleDevice['deviceType'], customName?: string): BleDevice {
    const titles: Record<BleDevice['deviceType'], string> = {
      ring: 'Aura Guardian Ring',
      pendant: 'SafeGlow Pendant',
      smartband: 'Pulse Guardian Band',
      keychain: 'Discreet Stealth FOB',
      clip: 'Aegis Hidden Safety Clip',
    };

    const newDevice: BleDevice = {
      id: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: customName || titles[type],
      deviceType: type,
      macAddress: `D8:3A:${Math.floor(Math.random()*89+10)}:${Math.floor(Math.random()*89+10)}:91`,
      connected: true,
      batteryLevel: Math.floor(Math.random() * 30 + 70),
      rssi: Math.floor(Math.random() * -30 - 45), // -45 to -75 dBm
      firmwareVersion: 'v3.1.2',
      lastSyncTime: 'Just now',
      pressAction: type === 'ring' || type === 'clip' ? 'silent_sos' : 'instant_sos',
      hapticFeedback: true,
      isSimulated: true,
    };

    this.connectedDevices = [newDevice, ...this.connectedDevices];
    this.notifyState();
    return newDevice;
  }

  toggleConnection(deviceId: string) {
    this.connectedDevices = this.connectedDevices.map(d => {
      if (d.id === deviceId) {
        return { ...d, connected: !d.connected, lastSyncTime: 'Just now' };
      }
      return d;
    });
    this.notifyState();
  }

  updateDeviceSettings(deviceId: string, updates: Partial<BleDevice>) {
    this.connectedDevices = this.connectedDevices.map(d => {
      if (d.id === deviceId) {
        return { ...d, ...updates, lastSyncTime: 'Just now' };
      }
      return d;
    });
    this.notifyState();
  }

  removeDevice(deviceId: string) {
    this.connectedDevices = this.connectedDevices.filter(d => d.id !== deviceId);
    this.notifyState();
  }

  // Simulate hardware trigger from the wearable
  triggerDeviceAction(deviceId: string, actionOverride?: 'instant_sos' | 'silent_sos' | 'safe_ping') {
    const dev = this.connectedDevices.find(d => d.id === deviceId);
    if (!dev || !dev.connected) return;

    const action = actionOverride || dev.pressAction;
    console.log(`Wearable trigger received from [${dev.name}]: action=${action}`);

    // Trigger haptic vibration simulation
    if (dev.hapticFeedback && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch {
        // Ignored
      }
    }

    this.listeners.forEach(cb => cb(dev, action));
  }

  private notifyState() {
    this.stateChangeListeners.forEach(cb => cb([...this.connectedDevices]));
  }
}

export const bleManager = new BleManager();
