import React, { useState } from 'react';
import { 
  Watch, 
  Bluetooth, 
  Battery, 
  Signal, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Settings2, 
  ShieldAlert, 
  EyeOff, 
  Radio, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  HelpCircle,
  Vibrate
} from 'lucide-react';
import { BleDevice } from '../types';
import { bleManager } from '../services/bleService';

interface WearableManagerProps {
  devices: BleDevice[];
  onTriggerAction: (device: BleDevice, actionType: 'instant_sos' | 'silent_sos' | 'safe_ping') => void;
}

export const WearableManager: React.FC<WearableManagerProps> = ({
  devices,
  onTriggerAction,
}) => {
  const [pairingStatus, setPairingStatus] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<BleDevice | null>(devices[0] || null);
  const [testNotification, setTestNotification] = useState<string | null>(null);

  const handlePairHardware = async () => {
    setPairingStatus('Scanning for nearby Bluetooth Low Energy safety devices...');
    const res = await bleManager.pairHardwareDevice();
    setPairingStatus(res.message);
    setTimeout(() => setPairingStatus(null), 4000);
  };

  const handleAddPreset = (type: BleDevice['deviceType']) => {
    const newDev = bleManager.addSimulatedDevice(type);
    setSelectedDevice(newDev);
    setTestNotification(`Paired new ${newDev.name} successfully via BLE!`);
    setTimeout(() => setTestNotification(null), 3000);
  };

  const handleSimulateTrigger = (device: BleDevice, actionType: 'instant_sos' | 'silent_sos' | 'safe_ping') => {
    setTestNotification(`Simulated ${actionType.replace('_', ' ').toUpperCase()} trigger from [${device.name}]`);
    bleManager.triggerDeviceAction(device.id, actionType);
    onTriggerAction(device, actionType);
    setTimeout(() => setTestNotification(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-md">
              <Watch className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Wearable Device & BLE Integration
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Trigger emergency assistance discreetly from a ring, pendant, or clip without touching your phone
              </p>
            </div>
          </div>

          {/* Pair Hardware / Simulator Action */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-pair-ble-hardware"
              onClick={handlePairHardware}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 border border-slate-700"
            >
              <Bluetooth className="h-4 w-4 text-sky-400" />
              <span>Scan Web BLE Device</span>
            </button>
          </div>
        </div>

        {pairingStatus && (
          <div className="mt-3 rounded-xl bg-slate-950 p-2.5 text-xs text-slate-300 border border-slate-800 font-mono">
            {pairingStatus}
          </div>
        )}

        {testNotification && (
          <div className="mt-3 rounded-xl bg-rose-950/80 p-2.5 text-xs text-rose-200 border border-rose-800/80 font-semibold flex items-center gap-2 animate-bounce">
            <Zap className="h-4 w-4 text-rose-400" />
            <span>{testNotification}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Devices List & Selected Device Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Connected BLE Devices List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Paired Safety Wearables</span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                {devices.length}
              </span>
            </h3>
          </div>

          <div className="space-y-3">
            {devices.map((device) => {
              const isSelected = selectedDevice?.id === device.id;
              return (
                <div
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-rose-500 shadow-lg shadow-rose-500/10'
                      : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                        device.connected
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}>
                        <Watch className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">
                          {device.name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span className="capitalize">{device.deviceType}</span>
                          <span>•</span>
                          <span className="font-mono text-[10px]">{device.macAddress}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      device.connected
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {device.connected ? 'BLE Active' : 'Offline'}
                    </span>
                  </div>

                  {/* Telemetry row */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Battery className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{device.batteryLevel}%</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Signal className="h-3.5 w-3.5 text-sky-400" />
                      <span>{device.rssi} dBm</span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {device.lastSyncTime}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Pair Form Factors */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5 text-rose-400" />
              <span>Add Discreet Wearable Preset:</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-add-ring"
                onClick={() => handleAddPreset('ring')}
                className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors text-left"
              >
                💍 Smart Ring
              </button>
              <button
                id="btn-add-pendant"
                onClick={() => handleAddPreset('pendant')}
                className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors text-left"
              >
                📿 Stealth Pendant
              </button>
              <button
                id="btn-add-clip"
                onClick={() => handleAddPreset('clip')}
                className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors text-left"
              >
                📎 Hidden Safety Clip
              </button>
              <button
                id="btn-add-smartband"
                onClick={() => handleAddPreset('smartband')}
                className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors text-left"
              >
                ⌚ Pulse Wristband
              </button>
            </div>
          </div>
        </div>

        {/* Right 2-Cols: Selected Device Control & Testing Simulator */}
        {selectedDevice ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Device Control Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{selectedDevice.name}</span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400 font-mono">
                      {selectedDevice.firmwareVersion}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Bluetooth Low Energy GATT Profile • 2.4 GHz Ultra-low latency link
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => bleManager.toggleConnection(selectedDevice.id)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
                      selectedDevice.connected
                        ? 'bg-slate-800 text-rose-400 border border-slate-700 hover:bg-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {selectedDevice.connected ? 'Disconnect' : 'Connect BLE'}
                  </button>

                  <button
                    onClick={() => {
                      bleManager.removeDevice(selectedDevice.id);
                      setSelectedDevice(devices[0] || null);
                    }}
                    className="rounded-xl bg-slate-800 p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                    title="Unpair Device"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Hardware Telemetry Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 uppercase">
                    <Battery className="h-3 w-3 text-emerald-400" />
                    <span>Battery Level</span>
                  </div>
                  <div className="mt-1 text-lg font-bold text-white font-mono">
                    {selectedDevice.batteryLevel}%
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">
                    Est. 6 Months Life
                  </div>
                </div>

                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 uppercase">
                    <Signal className="h-3 w-3 text-sky-400" />
                    <span>BLE RSSI</span>
                  </div>
                  <div className="mt-1 text-lg font-bold text-white font-mono">
                    {selectedDevice.rssi} dBm
                  </div>
                  <div className="text-[10px] text-sky-400 mt-0.5">
                    Signal: Excellent
                  </div>
                </div>

                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 uppercase">
                    <Vibrate className="h-3 w-3 text-amber-400" />
                    <span>Haptic Motor</span>
                  </div>
                  <div className="mt-1 text-base font-bold text-white">
                    {selectedDevice.hapticFeedback ? 'Enabled' : 'Muted'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Discreet Buzz Confirms
                  </div>
                </div>

                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 uppercase">
                    <ShieldAlert className="h-3 w-3 text-rose-400" />
                    <span>Hardware Action</span>
                  </div>
                  <div className="mt-1 text-xs font-bold text-rose-300 uppercase">
                    {selectedDevice.pressAction.replace('_', ' ')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Triple-Tap or Long Squeeze
                  </div>
                </div>
              </div>

              {/* Configure Hardware Trigger Action */}
              <div className="space-y-4 rounded-xl bg-slate-950 p-4 border border-slate-800 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Settings2 className="h-3.5 w-3.5 text-rose-400" />
                  <span>Hardware Button Mapping</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={`flex flex-col rounded-xl border p-3 cursor-pointer transition-all ${
                    selectedDevice.pressAction === 'instant_sos'
                      ? 'bg-rose-950/40 border-rose-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">Instant SOS Siren</span>
                      <input
                        type="radio"
                        name="pressAction"
                        checked={selectedDevice.pressAction === 'instant_sos'}
                        onChange={() => bleManager.updateDeviceSettings(selectedDevice.id, { pressAction: 'instant_sos' })}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Sounds high-decibel alarm & pushes location to police immediately
                    </span>
                  </label>

                  <label className={`flex flex-col rounded-xl border p-3 cursor-pointer transition-all ${
                    selectedDevice.pressAction === 'silent_sos'
                      ? 'bg-purple-950/40 border-purple-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">Discreet Silent SOS</span>
                      <input
                        type="radio"
                        name="pressAction"
                        checked={selectedDevice.pressAction === 'silent_sos'}
                        onChange={() => bleManager.updateDeviceSettings(selectedDevice.id, { pressAction: 'silent_sos' })}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Silent push without phone screen or siren alerting the attacker
                    </span>
                  </label>

                  <label className={`flex flex-col rounded-xl border p-3 cursor-pointer transition-all ${
                    selectedDevice.pressAction === 'safe_ping'
                      ? 'bg-emerald-950/40 border-emerald-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">Safe Check-in Ping</span>
                      <input
                        type="radio"
                        name="pressAction"
                        checked={selectedDevice.pressAction === 'safe_ping'}
                        onChange={() => bleManager.updateDeviceSettings(selectedDevice.id, { pressAction: 'safe_ping' })}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Sends "I reached destination safely" ping with single tap
                    </span>
                  </label>
                </div>
              </div>

              {/* Hardware Test Simulator */}
              <div className="rounded-xl border border-rose-900/50 bg-gradient-to-b from-rose-950/20 to-slate-950 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Physical Wearable Hardware Trigger Simulator
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Discreet Hands-Free Testing
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Simulate emergency button presses as if pressing the physical {selectedDevice.name}:
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    id="btn-sim-discreet-tap"
                    onClick={() => handleSimulateTrigger(selectedDevice, 'silent_sos')}
                    className="flex-1 min-w-[180px] rounded-xl border border-purple-700/60 bg-purple-900/30 hover:bg-purple-900/50 p-3 text-xs font-bold text-purple-200 transition-all flex items-center justify-center gap-2"
                  >
                    <EyeOff className="h-4 w-4 text-purple-400" />
                    <span>Discreet Triple-Tap (Silent SOS)</span>
                  </button>

                  <button
                    id="btn-sim-panic-squeeze"
                    onClick={() => handleSimulateTrigger(selectedDevice, 'instant_sos')}
                    className="flex-1 min-w-[180px] rounded-xl border border-rose-700/60 bg-rose-900/40 hover:bg-rose-900/60 p-3 text-xs font-bold text-rose-100 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20"
                  >
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                    <span>Hold 3-Sec Panic Squeeze (Loud SOS)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
            Select or pair a device to manage its Bluetooth configuration.
          </div>
        )}
      </div>
    </div>
  );
};
