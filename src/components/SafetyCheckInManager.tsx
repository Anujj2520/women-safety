import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Car, 
  Footprints, 
  Users, 
  Briefcase, 
  Train, 
  Sparkles, 
  BellRing, 
  PhoneForwarded, 
  RotateCcw, 
  Check, 
  X, 
  ChevronRight, 
  Compass, 
  MapPin, 
  ShieldAlert,
  CalendarCheck2
} from 'lucide-react';
import { ActivityCategory, EmergencyContact, LocationPoint, SafetyCheckInSession } from '../types';
import { safetyStore } from '../services/safetyStore';

interface SafetyCheckInManagerProps {
  contacts: EmergencyContact[];
  currentLocation: LocationPoint;
  onOpenSosMonitor?: () => void;
  isCompactCard?: boolean;
}

const PRESET_ACTIVITIES: {
  category: ActivityCategory;
  title: string;
  defaultDuration: number;
  icon: React.ElementType;
  placeholderNote: string;
}[] = [
  {
    category: 'rideshare',
    title: 'Late Night Rideshare / Cab',
    defaultDuration: 25,
    icon: Car,
    placeholderNote: 'e.g. Silver Prius Uber #7ABC89, heading home via Hwy 101',
  },
  {
    category: 'walking',
    title: 'Walking Home / Solo Jog',
    defaultDuration: 15,
    icon: Footprints,
    placeholderNote: 'e.g. Walking from Metro station through Oak Street park',
  },
  {
    category: 'date_meeting',
    title: 'Meeting Someone New / First Date',
    defaultDuration: 60,
    icon: Users,
    placeholderNote: 'e.g. Meeting Alex at Blue Bottle Cafe, Downtown',
  },
  {
    category: 'transit',
    title: 'Night Public Transit / Train',
    defaultDuration: 35,
    icon: Train,
    placeholderNote: 'e.g. Red Line train car #4 to Powell station',
  },
  {
    category: 'study_work',
    title: 'Working / Studying Late Alone',
    defaultDuration: 90,
    icon: Briefcase,
    placeholderNote: 'e.g. University science library 3rd floor quiet room',
  },
  {
    category: 'custom',
    title: 'Custom Journey / Activity',
    defaultDuration: 30,
    icon: Sparkles,
    placeholderNote: 'e.g. Errands in unfamiliar neighborhood',
  },
];

export const SafetyCheckInManager: React.FC<SafetyCheckInManagerProps> = ({
  contacts,
  currentLocation,
  onOpenSosMonitor,
  isCompactCard = false,
}) => {
  const [activeCheckIn, setActiveCheckIn] = useState<SafetyCheckInSession | null>(safetyStore.getActiveCheckIn());
  const [remainingSeconds, setRemainingSeconds] = useState(safetyStore.getCheckInRemainingSeconds());

  // Form State for creating a new session
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>('rideshare');
  const [customTitle, setCustomTitle] = useState('Late Night Rideshare / Cab');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [customDurationInput, setCustomDurationInput] = useState('');
  const [routeNote, setRouteNote] = useState('');
  const [gracePeriod, setGracePeriod] = useState(60);
  const [autoEscalate, setAutoEscalate] = useState(true);
  const [notifyAll, setNotifyAll] = useState(true);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>(contacts.map(c => c.id));
  
  // Safe confirmation note input
  const [safeNote, setSafeNote] = useState('');
  const [showSafeNoteInput, setShowSafeNoteInput] = useState(false);
  const [safeSuccessFlash, setSafeSuccessFlash] = useState(false);

  // Subscribe to store updates
  useEffect(() => {
    const unsub = safetyStore.subscribe(() => {
      setActiveCheckIn(safetyStore.getActiveCheckIn());
      setRemainingSeconds(safetyStore.getCheckInRemainingSeconds());
    });

    const interval = setInterval(() => {
      setActiveCheckIn(safetyStore.getActiveCheckIn());
      setRemainingSeconds(safetyStore.getCheckInRemainingSeconds());
    }, 1000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const handleSelectPreset = (preset: typeof PRESET_ACTIVITIES[0]) => {
    setSelectedCategory(preset.category);
    setCustomTitle(preset.title);
    setDurationMinutes(preset.defaultDuration);
    setCustomDurationInput('');
  };

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDuration = customDurationInput && Number(customDurationInput) > 0 
      ? Number(customDurationInput) 
      : durationMinutes;

    safetyStore.startCheckIn({
      activityTitle: customTitle || 'Safety Check-in',
      activityCategory: selectedCategory,
      durationMinutes: finalDuration,
      routeNote: routeNote.trim() || undefined,
      designatedContactIds: notifyAll ? contacts.map(c => c.id) : selectedContactIds,
      notifyAllGuardians: notifyAll,
      gracePeriodSeconds: gracePeriod,
      autoEscalateToSos: autoEscalate,
    });
  };

  const handleConfirmSafe = () => {
    safetyStore.confirmSafe(safeNote.trim() || undefined);
    setSafeNote('');
    setShowSafeNoteInput(false);
    setSafeSuccessFlash(true);
    setTimeout(() => setSafeSuccessFlash(false), 4000);
  };

  const handleExtend = (mins: number) => {
    safetyStore.extendCheckIn(mins);
  };

  const handleCancel = () => {
    safetyStore.cancelCheckIn('Session stopped by user.');
  };

  const toggleContactSelection = (id: string) => {
    if (selectedContactIds.includes(id)) {
      if (selectedContactIds.length > 1) {
        setSelectedContactIds(selectedContactIds.filter(c => c !== id));
      }
    } else {
      setSelectedContactIds([...selectedContactIds, id]);
    }
  };

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    if (secs <= 0) return '00:00';
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  const isActiveSession = activeCheckIn && activeCheckIn.isActive;
  const isExpired = activeCheckIn && activeCheckIn.status === 'expired_alerted';
  const isWarning = activeCheckIn && activeCheckIn.status === 'warning_pending';
  const isSafeConfirmed = activeCheckIn && activeCheckIn.status === 'safe_confirmed';

  // Calculate percentage of timer remaining for progress bar
  const totalSeconds = (activeCheckIn?.durationMinutes || 1) * 60;
  const percentRemaining = Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100));

  // If compact card mode (for monitor tab or guardian tab), show high-impact responsive widget
  if (isCompactCard) {
    if (isActiveSession) {
      return (
        <div className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xl ${
          isWarning 
            ? 'border-amber-500 bg-amber-950/40 animate-pulse' 
            : 'border-emerald-500/40 bg-slate-900/90'
        }`}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${isWarning ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                <Clock className="h-5 w-5 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">
                    {activeCheckIn.activityTitle}
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isWarning ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isWarning ? 'URGENT: CHECK-IN DUE' : 'SAFETY CHECK-IN RUNNING'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Due at {new Date(activeCheckIn.scheduledCheckInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Missed timer alerts {activeCheckIn.notifyAllGuardians ? 'All Guardians' : `${activeCheckIn.designatedContactIds.length} contacts`}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className={`font-mono text-2xl sm:text-3xl font-black ${
                isWarning ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {formatTime(remainingSeconds)}
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Remaining</span>
            </div>
          </div>

          {/* Quick confirmation buttons */}
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              id="btn-quick-im-safe"
              onClick={handleConfirmSafe}
              className="w-full sm:flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white px-4 py-3 text-sm font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>I'M SAFE (Confirm Safety)</span>
            </button>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => handleExtend(15)}
                className="flex-1 sm:flex-initial rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-3 text-xs font-semibold border border-slate-700 transition-colors"
                title="Extend by 15 minutes"
              >
                +15m
              </button>
              <button
                onClick={() => handleExtend(30)}
                className="flex-1 sm:flex-initial rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-3 text-xs font-semibold border border-slate-700 transition-colors"
                title="Extend by 30 minutes"
              >
                +30m
              </button>
              <button
                onClick={handleCancel}
                className="rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 px-3 py-3 text-xs font-medium border border-slate-700/60 transition-colors"
                title="End check-in session"
              >
                End
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (isExpired) {
      return (
        <div className="rounded-2xl border-2 border-rose-600 bg-rose-950/40 p-4 sm:p-5 shadow-2xl animate-pulse">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-md">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-rose-200 uppercase tracking-wide">
                  🚨 MISSED SAFETY CHECK-IN: GUARDIANS NOTIFIED!
                </h4>
                <p className="text-xs text-rose-300/90 mt-0.5">
                  Timer expired for "{activeCheckIn.activityTitle}". Emergency SMS sent with your live GPS location.
                </p>
              </div>
            </div>
            <button
              onClick={handleConfirmSafe}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold shadow-md shrink-0 transition-colors"
            >
              I Am Actually Safe
            </button>
          </div>
        </div>
      );
    }

    // Default compact launcher card
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Proactive Safety Check-in</span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px]">
                  Proactive Guard
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Set a countdown timer before late rides or commutes. If you don't confirm "I'm Safe", guardians get an emergency alert.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const el = document.getElementById('safety-checkin-full-panel');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
          >
            <Clock className="h-4 w-4" />
            <span>Setup Check-in Timer</span>
          </button>
        </div>
      </div>
    );
  }

  // FULL DETAILED VIEW / MANAGER PANEL
  return (
    <div id="safety-checkin-full-panel" className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
              <Clock className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Safety Check-in Timer
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isActiveSession 
                    ? isWarning
                      ? 'bg-amber-500 text-slate-950 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isExpired
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {isActiveSession 
                    ? (isWarning ? 'Warning: Expiring Soon' : 'Session Active') 
                    : isExpired 
                    ? 'Alert Dispatched' 
                    : 'Standby'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Automated safety assurance. If the timer expires without a manual <span className="text-emerald-400 font-bold">'I'm Safe'</span> confirmation, your designated guardians receive an emergency alert with your live GPS.
              </p>
            </div>
          </div>

          {/* Location badge */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-950/80 px-3.5 py-2 border border-slate-800 text-xs font-mono text-slate-300">
            <MapPin className="h-4 w-4 text-rose-400 shrink-0" />
            <span>GPS: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)} (±{currentLocation.accuracy}m)</span>
          </div>
        </div>
      </div>

      {/* Safe confirmation success banner */}
      {safeSuccessFlash && (
        <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-950/60 p-4 text-white shadow-xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
          <div>
            <div className="text-sm font-bold">Safety Confirmed Successfully!</div>
            <div className="text-xs text-emerald-200">Guardians have been updated that you arrived safely. Check-in timer resolved.</div>
          </div>
        </div>
      )}

      {/* 1. ACTIVE CHECK-IN MONITOR VIEW */}
      {isActiveSession && (
        <div className={`rounded-2xl border-2 p-6 sm:p-8 transition-all shadow-2xl ${
          isWarning 
            ? 'border-amber-500 bg-gradient-to-b from-amber-950/40 to-slate-950 shadow-amber-500/10 animate-pulse' 
            : 'border-emerald-500/50 bg-gradient-to-b from-slate-900 to-slate-950 shadow-emerald-500/10'
        }`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Big Countdown Timer Visual */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${isWarning ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                TIME UNTIL AUTOMATED GUARDIAN ALERT
              </span>
              
              <div className={`my-2 font-mono text-6xl sm:text-7xl font-black tracking-tight ${
                isWarning ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {formatTime(remainingSeconds)}
              </div>

              <div className="w-64 sm:w-80 bg-slate-800 h-2.5 rounded-full overflow-hidden mt-1">
                <div 
                  className={`h-full transition-all duration-1000 ${isWarning ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${percentRemaining}%` }}
                />
              </div>

              <div className="mt-3 text-xs text-slate-400">
                Started {new Date(activeCheckIn.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Due by <span className="text-white font-bold">{new Date(activeCheckIn.scheduledCheckInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Session Info & Route Card */}
            <div className="w-full md:w-auto flex-1 max-w-md rounded-xl bg-slate-950/80 p-4 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Activity Category:</span>
                <span className="text-xs text-rose-300 font-bold uppercase">{activeCheckIn.activityCategory}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Trip / Activity:</span>
                <span className="text-xs text-white font-semibold">{activeCheckIn.activityTitle}</span>
              </div>
              {activeCheckIn.routeNote && (
                <div className="pt-2 border-t border-slate-900 text-xs">
                  <span className="text-slate-400">Notes / Plate / Location:</span>
                  <div className="mt-1 text-slate-200 font-mono text-[11px] bg-slate-900 p-2 rounded-lg border border-slate-800">
                    "{activeCheckIn.routeNote}"
                  </div>
                </div>
              )}
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
                <span>Alert Recipients:</span>
                <span className="text-emerald-400 font-semibold">
                  {activeCheckIn.notifyAllGuardians ? 'All Registered Guardians (3)' : `${activeCheckIn.designatedContactIds.length} Designated Contacts`}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Button: "I'M SAFE" */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
            <button
              id="btn-confirm-safe-primary"
              onClick={handleConfirmSafe}
              className="w-full sm:flex-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white px-6 py-4 text-base font-extrabold shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer group"
            >
              <CheckCircle2 className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
              <span>I'M SAFE — CONFIRM SAFETY</span>
            </button>

            {/* Quick Extension Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                id="btn-extend-10m"
                onClick={() => handleExtend(10)}
                className="flex-1 sm:flex-initial rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-4 text-xs font-bold transition-all text-center"
                title="Add 10 minutes to safety timer"
              >
                +10 Mins
              </button>
              <button
                id="btn-extend-20m"
                onClick={() => handleExtend(20)}
                className="flex-1 sm:flex-initial rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-4 text-xs font-bold transition-all text-center"
                title="Add 20 minutes to safety timer"
              >
                +20 Mins
              </button>
              <button
                id="btn-extend-30m"
                onClick={() => handleExtend(30)}
                className="flex-1 sm:flex-initial rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-4 text-xs font-bold transition-all text-center"
                title="Add 30 minutes to safety timer"
              >
                +30 Mins
              </button>
              <button
                id="btn-cancel-checkin"
                onClick={handleCancel}
                className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white px-3.5 py-4 text-xs font-medium transition-all"
                title="Cancel check-in session"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Optional Note toggle */}
          <div className="mt-4">
            {!showSafeNoteInput ? (
              <button
                onClick={() => setShowSafeNoteInput(true)}
                className="text-xs text-slate-400 hover:text-slate-300 underline underline-offset-4"
              >
                + Add arrival message note before confirming
              </button>
            ) : (
              <div className="flex items-center gap-2 max-w-md mt-2">
                <input
                  type="text"
                  value={safeNote}
                  onChange={(e) => setSafeNote(e.target.value)}
                  placeholder="e.g. Arrived safely inside apartment..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
                <button
                  onClick={handleConfirmSafe}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 text-xs font-bold"
                >
                  Confirm With Note
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. EXPIRED / MISSED ALERT STATE PANEL */}
      {isExpired && (
        <div className="rounded-2xl border-2 border-rose-500 bg-slate-900 p-6 sm:p-8 shadow-2xl shadow-rose-600/30 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-rose-600 text-white shadow-lg">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-rose-400 uppercase tracking-tight">
                MISSED CHECK-IN ESCALATION ACTIVE!
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                The timer for <span className="text-white font-bold">"{activeCheckIn.activityTitle}"</span> expired without a manual confirmation. Emergency alert SMS and live GPS broadcast have been dispatched to your designated guardians.
              </p>

              {/* Dispatched alert summary */}
              <div className="mt-4 rounded-xl bg-slate-950 p-4 border border-rose-900/50 space-y-2">
                <div className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                  <BellRing className="h-4 w-4" />
                  <span>Automated Carrier Broadcast Dispatched:</span>
                </div>
                <div className="text-xs font-mono text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800">
                  🚨 <span className="font-bold text-rose-400">AEGIS SHIELD SAFETY CHECK-IN MISSED:</span> Priya Sharma did not confirm "I'm Safe" for '{activeCheckIn.activityTitle}'. Last GPS coordinates: {activeCheckIn.lastKnownLocation?.latitude.toFixed(5)}, {activeCheckIn.lastKnownLocation?.longitude.toFixed(5)}. Live Map URL sent to guardians.
                </div>
                <div className="text-[11px] text-slate-400">
                  Notified: {contacts.filter(c => activeCheckIn.notifyAllGuardians || activeCheckIn.designatedContactIds.includes(c.id)).map(c => c.name).join(', ')}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  id="btn-all-clear-safe"
                  onClick={handleConfirmSafe}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>I Am Safe — Send All-Clear Message</span>
                </button>

                {onOpenSosMonitor && (
                  <button
                    onClick={onOpenSosMonitor}
                    className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-5 py-3 text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-colors"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span>View Emergency SOS Dispatch Console</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SETUP NEW SAFETY CHECK-IN FORM (When no active session) */}
      {!isActiveSession && !isExpired && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Configuration Form */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-7 shadow-lg space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-rose-400" />
                <span>1. Select Activity & Context</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose what you're doing so guardians have crucial context if you miss a check-in.
              </p>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_ACTIVITIES.map((preset) => {
                const IconComponent = preset.icon;
                const isSelected = selectedCategory === preset.category;
                return (
                  <button
                    key={preset.category}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-rose-500 bg-rose-950/30 text-white shadow-md shadow-rose-500/10' 
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mb-2 ${isSelected ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight line-clamp-1">{preset.title}</span>
                    <span className="text-[11px] text-slate-400 mt-1">{preset.defaultDuration} mins default</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Title and Route Note Input */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Activity Title / Description:
                </label>
                <input
                  id="input-checkin-title"
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Taking Uber from Market St to Mission"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Route, Companion, or Vehicle Details (Recommended for Police & Guardians):
                </label>
                <textarea
                  id="input-checkin-route-note"
                  rows={2}
                  value={routeNote}
                  onChange={(e) => setRouteNote(e.target.value)}
                  placeholder={PRESET_ACTIVITIES.find(p => p.category === selectedCategory)?.placeholderNote || 'Add vehicle license plate, driver name, route details...'}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Duration Selector */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-white">
                  2. Choose Timer Duration
                </label>
                <span className="text-xs font-semibold text-rose-400">
                  Due in: {customDurationInput || durationMinutes} minutes ({new Date(Date.now() + (Number(customDurationInput) || durationMinutes) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[10, 15, 25, 35, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      setDurationMinutes(mins);
                      setCustomDurationInput('');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      durationMinutes === mins && !customDurationInput
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}

                <div className="flex items-center gap-1.5 ml-auto">
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={customDurationInput}
                    onChange={(e) => setCustomDurationInput(e.target.value)}
                    placeholder="Custom mins"
                    className="w-24 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white text-center focus:border-rose-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400">mins</span>
                </div>
              </div>
            </div>

            {/* Guardians Designation */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">
                  3. Designate Emergency Alert Contacts
                </label>
                <button
                  type="button"
                  onClick={() => setNotifyAll(!notifyAll)}
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium"
                >
                  {notifyAll ? 'Custom Select Contacts' : 'Select All Primary Contacts'}
                </button>
              </div>

              {notifyAll ? (
                <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="h-4 w-4 text-emerald-400" />
                    <span>All Registered Emergency Guardians ({contacts.length}) will be notified if timer expires.</span>
                  </div>
                  <span className="text-emerald-400 font-bold text-[11px] uppercase">All Active</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {contacts.map((contact) => {
                    const isChecked = selectedContactIds.includes(contact.id);
                    return (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => toggleContactSelection(contact.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all ${
                          isChecked 
                            ? 'border-emerald-500/50 bg-emerald-950/20 text-white' 
                            : 'border-slate-800 bg-slate-950/40 text-slate-400'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{contact.name}</div>
                          <div className="text-[10px] text-slate-400">{contact.relationship} • {contact.phone}</div>
                        </div>
                        <div className={`h-4 w-4 rounded-md border flex items-center justify-center ${
                          isChecked ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700'
                        }`}>
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Advanced Trigger Settings */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Pre-alert Warning Grace:</span>
                  <span className="text-slate-400 text-[11px]">Chime 60s before notifying contacts</span>
                </div>
                <select
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(Number(e.target.value))}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:outline-none"
                >
                  <option value={30}>30 secs</option>
                  <option value={60}>60 secs (Recommended)</option>
                  <option value={120}>2 mins</option>
                </select>
              </div>

              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Escalate to Full SOS:</span>
                  <span className="text-slate-400 text-[11px]">Dispatch police beacon if expired</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoEscalate}
                  onChange={(e) => setAutoEscalate(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 text-rose-600 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-2">
              <button
                id="btn-start-checkin-session"
                onClick={handleStartSession}
                className="w-full rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white py-4 px-6 text-sm font-bold shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer group"
              >
                <Clock className="h-5 w-5 group-hover:rotate-45 transition-transform" />
                <span>START SAFETY CHECK-IN TIMER ({customDurationInput || durationMinutes} MINS)</span>
              </button>
            </div>
          </div>

          {/* Right Column: How it Works & Peace of Mind Assurance */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">How Safety Check-in Works</h4>
              </div>

              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-white">
                    1
                  </span>
                  <p>
                    <span className="font-semibold text-white">Set your estimated journey time:</span> When entering a cab or walking alone, start a check-in timer.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-white">
                    2
                  </span>
                  <p>
                    <span className="font-semibold text-white">Audible Reminder:</span> 60 seconds before expiration, a friendly alert prompts you to confirm you're safe.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-white">
                    3
                  </span>
                  <p>
                    <span className="font-semibold text-white">One-tap 'I'm Safe':</span> A single tap safely resolves the timer and updates your guardians.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-[11px] font-bold text-rose-400">
                    4
                  </span>
                  <p>
                    <span className="font-semibold text-rose-300">Zero-Action Protection:</span> If you don't respond, guardians immediately receive emergency SMS and live tracking coordinates.
                  </p>
                </div>
              </div>
            </div>

            {/* Live Status of Guardians Standby */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Configured Guardian Receivers
                </h4>
                <span className="text-[10px] text-emerald-400 font-mono">READY (3 ONLINE)</span>
              </div>

              <div className="space-y-2.5">
                {contacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <div>
                      <div className="font-semibold text-white">{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.phone}</div>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      SMS & Push Enabled
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. HISTORICAL SESSION AUDIT TRAIL */}
      {activeCheckIn && activeCheckIn.history && activeCheckIn.history.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="h-4 w-4 text-rose-400" />
              <h4 className="text-sm font-bold text-white">
                Safety Check-in Event Trail & Audit Log
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Session ID: {activeCheckIn.id}</span>
          </div>

          <div className="space-y-3">
            {activeCheckIn.history.slice().reverse().map((evt) => (
              <div key={evt.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  evt.type === 'safe_confirmed' 
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : evt.type === 'expired_alerted'
                    ? 'bg-rose-500/20 text-rose-400'
                    : evt.type === 'warning'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {evt.type === 'safe_confirmed' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </div>

                <div className="flex-1">
                  <div className="font-semibold text-slate-200">
                    {evt.message}
                  </div>
                  {evt.location && (
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Coordinates: {evt.location.latitude.toFixed(5)}, {evt.location.longitude.toFixed(5)} (±{evt.location.accuracy}m)
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
