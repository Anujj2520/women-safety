import React, { useState } from 'react';
import { 
  AlertOctagon, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  KeyRound, 
  Share2, 
  Clock, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Copy,
  Check
} from 'lucide-react';
import { AlertIncident, AlertState, SafetySettings } from '../types';
import { audioService } from '../services/audioService';

interface SosTriggerProps {
  alertState: AlertState;
  activeIncident: AlertIncident | null;
  countdownRemaining: number;
  settings: SafetySettings;
  onTriggerSos: (instant?: boolean, silent?: boolean) => void;
  onCancelCountdown: () => void;
  onResolveSos: (pin: string) => { success: boolean; message: string };
  onToggleSiren: () => void;
}

export const SosTrigger: React.FC<SosTriggerProps> = ({
  alertState,
  activeIncident,
  countdownRemaining,
  settings,
  onTriggerSos,
  onCancelCountdown,
  onResolveSos,
  onToggleSiren,
}) => {
  const [showDisarmModal, setShowDisarmModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const isEmergency = alertState === 'sos_active' || alertState === 'silent_active';
  const isCountdown = alertState === 'countdown';

  const handleDisarmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = onResolveSos(enteredPin);
    if (result.success) {
      setShowDisarmModal(false);
      setEnteredPin('');
      setPinError('');
    } else {
      setPinError(result.message);
    }
  };

  const copyBroadcastLink = () => {
    if (!activeIncident) return;
    navigator.clipboard.writeText(activeIncident.liveBroadcastUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="flex flex-col items-center">
      {/* 1. Countdown Mode (Arming in 3...2...1) */}
      {isCountdown && (
        <div className="w-full max-w-lg rounded-2xl border-2 border-amber-500/80 bg-gradient-to-b from-amber-950/50 to-slate-900 p-6 text-center shadow-2xl shadow-amber-500/20 animate-pulse">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
            <AlertTriangle className="h-9 w-9 animate-bounce" />
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-amber-400">
            ARMING EMERGENCY ALERT IN
          </div>
          <div className="my-2 text-7xl font-black text-amber-300 font-mono tracking-tighter">
            {countdownRemaining}
          </div>
          <p className="text-xs text-amber-200/80 mb-5">
            Emergency contacts & authorities will receive your live GPS coordinate stream when timer expires.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              id="btn-cancel-countdown"
              onClick={onCancelCountdown}
              className="rounded-xl bg-slate-800 border border-slate-700 px-6 py-3 text-sm font-bold text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              <span>Cancel Alert (I'm Safe)</span>
            </button>
            <button
              id="btn-force-sos"
              onClick={() => onTriggerSos(true, false)}
              className="rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white hover:bg-rose-500 shadow-lg shadow-rose-600/40 transition-colors"
            >
              Dispatch Instantly Now
            </button>
          </div>
        </div>
      )}

      {/* 2. Active Emergency SOS Panel */}
      {isEmergency && activeIncident && (
        <div className="w-full max-w-2xl rounded-2xl border-2 border-rose-500/90 bg-slate-900 p-5 sm:p-7 shadow-2xl shadow-rose-600/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-5 w-5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex h-5 w-5 rounded-full bg-rose-600"></span>
              </span>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span>{alertState === 'silent_active' ? 'SILENT EMERGENCY SOS STREAM' : 'HIGH-PRIORITY SOS DISPATCHED'}</span>
                  <span className="rounded bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[11px] font-mono text-rose-300">
                    {activeIncident.id}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Triggered via {activeIncident.triggerSource.replace(/_/g, ' ').toUpperCase()} • Streaming telemetry to {activeIncident.notifiedContactsCount} contacts
                </p>
              </div>
            </div>

            <button
              id="btn-disarm-sos"
              onClick={() => setShowDisarmModal(true)}
              className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 shrink-0"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Safe / Disarm PIN</span>
            </button>
          </div>

          {/* Incident Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                <Clock className="h-3 w-3 text-rose-400" />
                <span>Elapsed</span>
              </div>
              <div className="text-lg font-mono font-bold text-white mt-1">
                {Math.floor((activeIncident.audioRecordingDuration || 0) / 60)}:
                {String((activeIncident.audioRecordingDuration || 0) % 60).padStart(2, '0')}
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                <Radio className="h-3 w-3 text-emerald-400" />
                <span>GPS Accuracy</span>
              </div>
              <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                ±{activeIncident.currentLocation.accuracy}m
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                <CheckCircle2 className="h-3 w-3 text-sky-400" />
                <span>Guardians</span>
              </div>
              <div className="text-lg font-bold text-white mt-1">
                {activeIncident.notifiedContactsCount} Alerted
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                <span>Police Unit</span>
              </div>
              <div className="text-sm font-bold text-amber-400 mt-1">
                En Route (4m ETA)
              </div>
            </div>
          </div>

          {/* Quick Actions in Alert State */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleSiren}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  audioService.isSirenActive()
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {audioService.isSirenActive() ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                <span>{audioService.isSirenActive() ? 'Silence Siren' : 'Trigger Loud Siren'}</span>
              </button>

              <button
                onClick={copyBroadcastLink}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Copied Secure Link' : 'Copy Guardian Link'}</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 font-mono">
              Live Location: {activeIncident.currentLocation.latitude.toFixed(4)}, {activeIncident.currentLocation.longitude.toFixed(4)}
            </span>
          </div>
        </div>
      )}

      {/* 3. Default Standby Mode (Big Tactile One-Tap SOS Button) */}
      {!isEmergency && !isCountdown && (
        <div className="flex flex-col items-center text-center">
          {/* Main Giant Circular SOS Button with Multi-layer Pulses */}
          <div className="relative my-4 flex items-center justify-center">
            {/* Outer Subtle Ambient Ring */}
            <div className="absolute -inset-4 rounded-full bg-rose-500/10 blur-xl"></div>
            
            {/* Pulsing Aura */}
            <div className="absolute h-52 w-52 sm:h-64 sm:w-64 rounded-full border border-rose-500/30 animate-ping opacity-25"></div>
            <div className="absolute h-48 w-48 sm:h-60 sm:w-60 rounded-full border border-rose-500/20"></div>

            {/* Clickable One-Tap Button */}
            <button
              id="btn-main-one-tap-sos"
              onClick={() => onTriggerSos(false, false)}
              className="relative z-10 flex h-44 w-44 sm:h-52 sm:w-52 flex-col items-center justify-center rounded-full bg-gradient-to-b from-rose-500 to-rose-700 p-4 text-white shadow-2xl shadow-rose-600/50 hover:from-rose-400 hover:to-rose-600 active:scale-95 transition-all duration-150 border-4 border-rose-300/40 cursor-pointer group"
              aria-label="One-tap Emergency SOS Button"
            >
              <AlertOctagon className="h-14 w-14 sm:h-16 sm:w-16 mb-1 drop-shadow-md group-hover:scale-105 transition-transform" />
              <span className="text-3xl sm:text-4xl font-black tracking-wider drop-shadow-md">
                SOS
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-rose-100/90 mt-0.5">
                ONE-TAP ALERT
              </span>
            </button>
          </div>

          {/* Subtext and Instant Options */}
          <p className="max-w-md text-xs sm:text-sm text-slate-400 mt-2">
            Tap to immediately broadcast your live GPS beacon, audio stream, and identity dossier to emergency contacts and police.
          </p>

          {/* Alternative Quick Action Buttons */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {/* Discreet Silent Alert */}
            <button
              id="btn-silent-sos"
              onClick={() => onTriggerSos(true, true)}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white hover:bg-slate-800 transition-all shadow-sm"
              title="Sends live location without sound or screen flashing"
            >
              <EyeOff className="h-4 w-4 text-purple-400" />
              <span>Discreet Silent SOS</span>
            </button>

            {/* Instant Override (Bypass 3s countdown) */}
            <button
              id="btn-instant-override-sos"
              onClick={() => onTriggerSos(true, false)}
              className="flex items-center gap-2 rounded-xl border border-rose-900/50 bg-rose-950/30 px-4 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-950/60 hover:text-rose-200 transition-all shadow-sm"
              title="Instant alert dispatch with no countdown"
            >
              <Radio className="h-4 w-4 text-rose-400" />
              <span>Instant Dispatch (0s)</span>
            </button>
          </div>
        </div>
      )}

      {/* Disarm Security Modal */}
      {showDisarmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <KeyRound className="h-5 w-5 text-rose-400" />
                <span>Verify Safe Passcode</span>
              </div>
              <button
                onClick={() => {
                  setShowDisarmModal(false);
                  setEnteredPin('');
                  setPinError('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Enter your 4-digit Emergency PIN to verify you are safe and cancel the incident dispatch.
              (Default demo passcode: <span className="font-mono text-rose-400 font-bold">1234</span>)
            </p>

            <form onSubmit={handleDisarmSubmit} className="space-y-4">
              <div>
                <input
                  id="input-emergency-pin"
                  type="password"
                  maxLength={6}
                  autoFocus
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError('');
                  }}
                  placeholder="Enter 4-digit PIN"
                  className="w-full text-center text-2xl tracking-[0.5em] font-mono rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-rose-500 focus:outline-none"
                />
                {pinError && (
                  <p className="text-xs text-rose-400 mt-1.5 text-center font-medium">
                    {pinError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisarmModal(false)}
                  className="flex-1 rounded-xl border border-slate-700 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  id="btn-submit-disarm-pin"
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white transition-colors"
                >
                  Verify Safe & Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
