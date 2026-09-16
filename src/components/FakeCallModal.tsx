import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Volume2, 
  Mic, 
  X, 
  Clock, 
  User 
} from 'lucide-react';
import { audioService } from '../services/audioService';

interface FakeCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FakeCallModal: React.FC<FakeCallModalProps> = ({ isOpen, onClose }) => {
  const [callState, setCallState] = useState<'incoming' | 'connected' | 'ended'>('incoming');
  const [callerName, setCallerName] = useState('Mom (Sunita)');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCallState('incoming');
      setCallDuration(0);
      return;
    }

    let interval: number;
    if (callState === 'incoming') {
      // Periodic ringtone chirp
      const ringInterval = window.setInterval(() => {
        audioService.playCountdownBeep(650);
      }, 2000);
      return () => clearInterval(ringInterval);
    } else if (callState === 'connected') {
      interval = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, callState]);

  if (!isOpen) return null;

  const handleAnswer = () => {
    setCallState('connected');
  };

  const handleDecline = () => {
    setCallState('ended');
    setTimeout(() => onClose(), 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-[40px] border-4 border-slate-800 bg-slate-950 p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden flex flex-col items-center justify-between min-h-[520px]">
        {/* Notch / Speaker bar */}
        <div className="h-1.5 w-24 rounded-full bg-slate-800 mb-6" />

        {/* Top Caller Info */}
        <div className="text-center space-y-2 mt-4">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-800 border-2 border-slate-700 text-3xl font-bold shadow-xl">
            👩
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-white mt-2">
            {callerName}
          </h3>
          <p className="text-xs text-emerald-400 font-medium">
            {callState === 'incoming' 
              ? 'Incoming Voice Call...' 
              : `Connected • ${Math.floor(callDuration / 60)}:${String(callDuration % 60).padStart(2, '0')}`}
          </p>
        </div>

        {/* In-Call Script Hint / Audio prompt for user */}
        {callState === 'connected' ? (
          <div className="my-6 w-full rounded-2xl bg-slate-900/90 p-4 border border-slate-800 text-center space-y-2">
            <div className="text-[10px] uppercase font-bold tracking-wider text-rose-400">
              DISCREET EXCUSE SCRIPT
            </div>
            <p className="text-xs text-slate-200 italic leading-relaxed">
              "Hey Priya, dad just pulled up right around the corner. We're waiting in the car for you, come out right now."
            </p>
            <div className="text-[10px] text-slate-400">
              (Use this prompt to politely excuse yourself and walk away)
            </div>
          </div>
        ) : (
          <div className="my-6 text-center text-xs text-slate-400 max-w-xs">
            Use this incoming call simulator to excuse yourself from uncomfortable or unsafe situations.
          </div>
        )}

        {/* Call Action Controls */}
        <div className="w-full pb-4">
          {callState === 'incoming' ? (
            <div className="flex items-center justify-around w-full">
              {/* Decline */}
              <button
                id="btn-fakecall-decline"
                onClick={handleDecline}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40 transition-transform active:scale-95">
                  <PhoneOff className="h-7 w-7" />
                </div>
                <span className="text-xs text-slate-400 font-medium">Decline</span>
              </button>

              {/* Accept */}
              <button
                id="btn-fakecall-accept"
                onClick={handleAnswer}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/40 transition-transform active:scale-95 animate-bounce">
                  <Phone className="h-7 w-7" />
                </div>
                <span className="text-xs text-emerald-400 font-medium">Accept</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <button
                id="btn-fakecall-hangup"
                onClick={handleDecline}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40 transition-transform active:scale-95">
                  <PhoneOff className="h-7 w-7" />
                </div>
                <span className="text-xs text-slate-400 font-medium">End Call</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
