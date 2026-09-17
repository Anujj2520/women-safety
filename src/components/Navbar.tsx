import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Radio, 
  Users, 
  Watch, 
  Settings, 
  MapPin, 
  PhoneCall, 
  Footprints, 
  AlertTriangle, 
  Battery, 
  Bluetooth, 
  LogIn, 
  LogOut, 
  Volume2, 
  VolumeX,
  Lock,
  Timer,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { AppTab, UserProfile, AlertState, BleDevice } from '../types';
import { audioService } from '../services/audioService';
import { safetyStore } from '../services/safetyStore';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  alertState: AlertState;
  userProfile: UserProfile;
  bleDevices: BleDevice[];
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenFakeCall: () => void;
  onOpenWalkWithMe: () => void;
  onTriggerSosQuick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  alertState,
  userProfile,
  bleDevices,
  onOpenAuth,
  onLogout,
  onOpenFakeCall,
  onOpenWalkWithMe,
  onTriggerSosQuick,
}) => {
  const [activeCheckIn, setActiveCheckIn] = useState(safetyStore.getActiveCheckIn());
  const [checkInSecs, setCheckInSecs] = useState(safetyStore.getCheckInRemainingSeconds());

  useEffect(() => {
    const unsub = safetyStore.subscribe(() => {
      setActiveCheckIn(safetyStore.getActiveCheckIn());
      setCheckInSecs(safetyStore.getCheckInRemainingSeconds());
    });
    const interval = setInterval(() => {
      setActiveCheckIn(safetyStore.getActiveCheckIn());
      setCheckInSecs(safetyStore.getCheckInRemainingSeconds());
    }, 1000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const connectedBle = bleDevices.find(d => d.connected);
  const isEmergency = alertState === 'sos_active' || alertState === 'silent_active';
  const isCountdown = alertState === 'countdown';
  const isCheckInActive = activeCheckIn && activeCheckIn.isActive;
  const isCheckInWarning = activeCheckIn && activeCheckIn.status === 'warning_pending';
  const isCheckInExpired = activeCheckIn && activeCheckIn.status === 'expired_alerted';

  const formatCheckInTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md">
      {/* High-contrast emergency banner if alert active */}
      {isEmergency && (
        <div className="w-full bg-rose-600 px-4 py-2 text-white flex items-center justify-between text-xs sm:text-sm font-semibold tracking-wide animate-pulse">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {alertState === 'silent_active' 
                ? 'DISCREET SILENT SOS ACTIVE • LIVE GPS BROADCASTING TO GUARDIANS'
                : 'CRITICAL EMERGENCY SOS ACTIVE • BROADCASTING GPS & STREAMING AUDIO TO AUTHORITIES'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (audioService.isSirenActive()) {
                  audioService.stopEmergencySiren();
                } else {
                  audioService.startEmergencySiren();
                }
              }}
              className="rounded bg-black/40 px-2.5 py-1 text-xs hover:bg-black/60 transition-colors flex items-center gap-1.5"
            >
              {audioService.isSirenActive() ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              <span>{audioService.isSirenActive() ? 'Mute Siren' : 'Loud Siren'}</span>
            </button>
            <button
              onClick={() => setActiveTab('monitor')}
              className="rounded bg-white text-rose-700 px-2.5 py-1 text-xs font-bold hover:bg-rose-50 transition-colors"
            >
              Manage SOS
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 h-16">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('monitor')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
              isEmergency 
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-lg shadow-rose-500/30' 
                : isCountdown 
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 animate-pulse'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-400 group-hover:border-rose-500/60'
            }`}>
              <Shield className="h-5 w-5" />
              {connectedBle && (
                <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center" title="Wearable BLE Linked">
                  <Bluetooth className="h-2 w-2 text-white" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white sm:text-base text-sm">
                  AEGIS SHIELD
                </span>
                <span className="hidden md:inline-block rounded-full bg-slate-800/90 border border-slate-700 px-2 py-0.5 text-[10px] font-medium tracking-wider text-slate-300">
                  WOMEN SAFETY 24/7
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Emergency Location & Guardian Cloud Alerting
              </p>
            </div>
          </button>
        </div>

        {/* Navigation tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          <button
            id="nav-tab-monitor"
            onClick={() => setActiveTab('monitor')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'monitor'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>SOS Monitor</span>
          </button>

          <button
            id="nav-tab-guardian"
            onClick={() => setActiveTab('guardian')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'guardian'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Guardian Cloud</span>
          </button>

          <button
            id="nav-tab-checkin"
            onClick={() => setActiveTab('checkin')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all relative ${
              activeTab === 'checkin'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : isCheckInActive
                ? isCheckInWarning
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 animate-pulse'
                  : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Timer className="h-3.5 w-3.5" />
            <div className="flex items-center gap-1.5">
              <span>Check-in</span>
              {isCheckInActive && (
                <span className={`font-mono text-[10px] font-black px-1.5 py-0.2 rounded ${
                  isCheckInWarning ? 'bg-amber-500 text-slate-950 animate-ping' : 'bg-emerald-500/30 text-emerald-300'
                }`}>
                  {formatCheckInTime(checkInSecs)}
                </span>
              )}
            </div>
          </button>

          <button
            id="nav-tab-wearables"
            onClick={() => setActiveTab('wearables')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'wearables'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Watch className="h-3.5 w-3.5" />
            <div className="flex items-center gap-1.5">
              <span>Wearable BLE</span>
              {connectedBle && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </div>
          </button>

          <button
            id="nav-tab-contacts"
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'contacts'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Contacts & Dispatch</span>
          </button>

          <button
            id="nav-tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Quick action tools & Auth */}
        <div className="flex items-center gap-2">
          {/* Active Check-in Header Pill & Quick Safe Action */}
          {isCheckInActive && (
            <div className="flex items-center gap-1.5">
              <button
                id="btn-header-checkin-live"
                onClick={() => setActiveTab('checkin')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all border ${
                  isCheckInWarning
                    ? 'border-amber-500 bg-amber-950/80 text-amber-300 animate-pulse'
                    : 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300'
                }`}
                title="View Active Safety Check-in"
              >
                <Clock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Check-in:</span>
                <span className="font-mono">{formatCheckInTime(checkInSecs)}</span>
              </button>

              <button
                id="btn-header-im-safe"
                onClick={() => safetyStore.confirmSafe()}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1.5 text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                title="Confirm You Are Safe"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="hidden md:inline">I'm Safe</span>
              </button>
            </div>
          )}

          {/* Quick Check-in launcher if not active */}
          {!isCheckInActive && (
            <button
              id="btn-quick-check-in"
              onClick={() => setActiveTab('checkin')}
              title="Set Safety Check-in Timer"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
            >
              <Timer className="h-3.5 w-3.5 text-rose-400" />
              <span className="hidden md:inline">Check-in</span>
            </button>
          )}

          {/* Quick Fake Call tool */}
          <button
            id="btn-quick-fake-call"
            onClick={onOpenFakeCall}
            title="Trigger Fake Call (Discreet Exit Assistance)"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          >
            <PhoneCall className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden md:inline">Fake Call</span>
          </button>

          {/* Quick Walk With Me timer tool */}
          <button
            id="btn-quick-walk-with-me"
            onClick={onOpenWalkWithMe}
            title="Start Walk With Me Safety Journey Timer"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          >
            <Footprints className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden md:inline">Walk Safe</span>
          </button>

          {/* Quick SOS Trigger in Header */}
          {!isEmergency && (
            <button
              id="btn-header-sos"
              onClick={onTriggerSosQuick}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-500 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <span>SOS</span>
            </button>
          )}

          {/* OAuth User Badge */}
          {userProfile.isLoggedIn ? (
            <div className="relative flex items-center gap-2 pl-2 border-l border-slate-800">
              <button
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-900 transition-colors"
                title={`Logged in via ${userProfile.authProvider.toUpperCase()}: ${userProfile.name}`}
              >
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full border border-slate-700 object-cover"
                />
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-semibold text-white leading-tight">
                    {userProfile.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>OAuth Verified</span>
                  </div>
                </div>
              </button>
              <button
                onClick={onLogout}
                title="Log Out"
                className="text-slate-500 hover:text-slate-300 p-1.5 rounded hover:bg-slate-900"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-600 hover:text-white transition-colors"
            >
              <LogIn className="h-3.5 w-3.5 text-rose-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Tab Bar below header */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-900 bg-slate-950 px-2 py-2">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium ${
            activeTab === 'monitor' ? 'text-rose-400' : 'text-slate-400'
          }`}
        >
          <Radio className="h-4 w-4" />
          <span>Monitor</span>
        </button>

        <button
          onClick={() => setActiveTab('guardian')}
          className={`flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium ${
            activeTab === 'guardian' ? 'text-rose-400' : 'text-slate-400'
          }`}
        >
          <MapPin className="h-4 w-4" />
          <span>Guardian</span>
        </button>

        <button
          id="mobile-nav-tab-checkin"
          onClick={() => setActiveTab('checkin')}
          className={`flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium relative ${
            activeTab === 'checkin' 
              ? 'text-rose-400' 
              : isCheckInActive
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400'
          }`}
        >
          <div className="relative">
            <Timer className="h-4 w-4" />
            {isCheckInActive && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <span>Check-in</span>
        </button>

        <button
          onClick={() => setActiveTab('wearables')}
          className={`flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium ${
            activeTab === 'wearables' ? 'text-rose-400' : 'text-slate-400'
          }`}
        >
          <Watch className="h-4 w-4" />
          <span>BLE Ring</span>
        </button>

        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium ${
            activeTab === 'contacts' ? 'text-rose-400' : 'text-slate-400'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Contacts</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium ${
            activeTab === 'settings' ? 'text-rose-400' : 'text-slate-400'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
};
