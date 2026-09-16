import React, { useState, useEffect } from 'react';
import { 
  Footprints, 
  Clock, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  MapPin 
} from 'lucide-react';

interface WalkWithMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerSosAuto: () => void;
  userPasscode: string;
}

export const WalkWithMeModal: React.FC<WalkWithMeModalProps> = ({
  isOpen,
  onClose,
  onTriggerSosAuto,
  userPasscode,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState(15);
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const [destination, setDestination] = useState('Walking to Metro Transit Station');
  const [checkInPin, setCheckInPin] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    if (!isActive) return;

    const timer = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsActive(false);
          onTriggerSosAuto(); // Timer expired without safe check-in!
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive]);

  if (!isOpen) return null;

  const startJourney = () => {
    setSecondsRemaining(selectedMinutes * 60);
    setIsActive(true);
  };

  const handleSafeCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkInPin.trim() === userPasscode.trim()) {
      setIsActive(false);
      setCheckInPin('');
      setPinError('');
      onClose();
    } else {
      setPinError('Invalid safety PIN. Enter 1234 to complete check-in.');
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-7 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Footprints className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              "Walk With Me" Safety Timer
            </h3>
            <p className="text-xs text-slate-400">
              Auto-escalates to Emergency SOS if you do not check in safely
            </p>
          </div>
        </div>

        {!isActive ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Destination / Route Note
              </label>
              <input
                id="input-walk-destination"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Walking home from library..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Estimated Walking Duration:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedMinutes(mins)}
                    className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                      selectedMinutes === mins
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {mins} Mins
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Fail-Safe Protocol</span>
              </div>
              <p>
                If you do not disarm the timer within {selectedMinutes} minutes, your emergency contacts and police dispatch will be immediately sent your live GPS tracking beacon.
              </p>
            </div>

            <button
              id="btn-start-walk-timer"
              onClick={startJourney}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
            >
              <Footprints className="h-4 w-4" />
              <span>Start Walk Companion</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5 text-center">
            <div className="rounded-2xl bg-slate-950 p-5 border border-emerald-500/40 shadow-inner">
              <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                SAFETY COUNTDOWN ACTIVE
              </span>
              <div className="my-2 text-5xl font-black font-mono tracking-tight text-white">
                {formatTime(secondsRemaining)}
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-rose-400" />
                <span>{destination}</span>
              </div>
            </div>

            {/* Check-in Form */}
            <form onSubmit={handleSafeCheckIn} className="space-y-3">
              <div className="text-left">
                <label className="block text-xs font-semibold text-slate-300 mb-1 text-center">
                  Enter 4-digit PIN to confirm safe arrival:
                </label>
                <input
                  id="input-walk-pin"
                  type="password"
                  maxLength={6}
                  value={checkInPin}
                  onChange={(e) => {
                    setCheckInPin(e.target.value);
                    setPinError('');
                  }}
                  placeholder="PIN (Default: 1234)"
                  className="w-full text-center text-xl font-mono tracking-widest rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                />
                {pinError && (
                  <p className="text-xs text-rose-400 mt-1 text-center font-medium">
                    {pinError}
                  </p>
                )}
              </div>

              <button
                id="btn-confirm-safe-arrival"
                type="submit"
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>I Arrived Safely • End Timer</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
