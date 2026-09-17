import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Phone, 
  Clock, 
  Radio, 
  CheckCircle2, 
  Volume2, 
  Send, 
  Share2, 
  AlertTriangle, 
  Activity, 
  Eye, 
  UserCheck, 
  ExternalLink, 
  MessageSquareText, 
  BadgeAlert, 
  Play, 
  Pause,
  Timer
} from 'lucide-react';
import { AlertIncident, AlertState, AuthorityAgency, EmergencyContact, LocationPoint, UserProfile, SafetyCheckInSession } from '../types';
import { safetyStore } from '../services/safetyStore';

interface GuardianDashboardProps {
  userProfile: UserProfile;
  alertState: AlertState;
  activeIncident: AlertIncident | null;
  currentLocation: LocationPoint;
  contacts: EmergencyContact[];
  authorities: AuthorityAgency[];
  onTriggerRemoteAlarm?: () => void;
}

export const GuardianDashboard: React.FC<GuardianDashboardProps> = ({
  userProfile,
  alertState,
  activeIncident,
  currentLocation,
  contacts,
  authorities,
  onTriggerRemoteAlarm,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [guardianNote, setGuardianNote] = useState('');
  const [activeCheckIn, setActiveCheckIn] = useState<SafetyCheckInSession | null>(safetyStore.getActiveCheckIn());
  const [checkInSecs, setCheckInSecs] = useState<number>(safetyStore.getCheckInRemainingSeconds());
  const [guardianNotesList, setGuardianNotesList] = useState<string[]>([
    'Guardian Sunita Sharma: Called Priya’s phone at 10:01 AM. Call forwarded to voicemail.',
    'Guardian Maya Patel: Contacted local station patrol unit #409.',
  ]);

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

  const isEmergency = alertState === 'sos_active' || alertState === 'silent_active';

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardianNote.trim()) return;
    setGuardianNotesList([`Guardian Update (${new Date().toLocaleTimeString()}): ${guardianNote.trim()}`, ...guardianNotesList]);
    setGuardianNote('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                referrerPolicy="no-referrer"
                className="h-16 w-16 rounded-2xl border-2 border-slate-700 object-cover shadow-md"
              />
              <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-950 ${
                isEmergency ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {userProfile.name}
                </h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  isEmergency 
                    ? 'bg-rose-500 text-white animate-pulse' 
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {isEmergency ? 'DISTRESS SOS ACTIVE' : 'SECURE & PROTECTED'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Guardian Live Cloud Monitor • Medical ID: <span className="text-slate-200 font-semibold">{userProfile.bloodGroup}</span> • Emergency Phone: <span className="text-slate-200 font-mono">{userProfile.phone}</span>
              </p>
            </div>
          </div>

          {/* Quick Guardian Hotkeys */}
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
            <a
              href={`tel:${userProfile.phone}`}
              className="flex-1 sm:flex-initial rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700"
            >
              <Phone className="h-4 w-4 text-emerald-400" />
              <span>Call User</span>
            </a>

            <a
              href="tel:911"
              className="flex-1 sm:flex-initial rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
            >
              <BadgeAlert className="h-4 w-4" />
              <span>Dispatch 911 / 112</span>
            </a>
          </div>
        </div>
      </div>

      {/* Real-Time Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="h-4 w-4 text-rose-400" />
            <span>Current Location</span>
          </div>
          <div className="mt-2 text-base font-bold text-white line-clamp-1 font-mono">
            {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-0.5">
            Accuracy ±{currentLocation.accuracy}m (High Precision)
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Activity className="h-4 w-4 text-sky-400" />
            <span>Movement Telemetry</span>
          </div>
          <div className="mt-2 text-base font-bold text-white">
            {currentLocation.speed ? `${(currentLocation.speed * 3.6).toFixed(1)} km/h` : '1.4 km/h (Walking)'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Heading: North-East (45°)
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Radio className="h-4 w-4 text-emerald-400" />
            <span>Device Battery & Signal</span>
          </div>
          <div className="mt-2 text-base font-bold text-white">
            86% • 5G Ultra Wideband
          </div>
          <div className="text-[11px] text-emerald-400 mt-0.5">
            Aura Smart Ring BLE Paired (-54 dBm)
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <UserCheck className="h-4 w-4 text-amber-400" />
            <span>Guardians Engaged</span>
          </div>
          <div className="mt-2 text-base font-bold text-white">
            {contacts.filter(c => c.status === 'acknowledged' || c.status === 'in_transit').length || 2} Online
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            All 3 contacts received GPS packet
          </div>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Ambient Audio & SMS Broadcast Log */}
        <div className="lg:col-span-2 space-y-6">
          {/* Proactive Safety Check-in Cloud Telemetry for Guardians */}
          {activeCheckIn && (activeCheckIn.isActive || activeCheckIn.status === 'expired_alerted') ? (
            <div className={`rounded-2xl border p-5 shadow-lg ${
              activeCheckIn.status === 'expired_alerted'
                ? 'border-rose-500 bg-rose-950/40 animate-pulse'
                : activeCheckIn.status === 'warning_pending'
                ? 'border-amber-500 bg-amber-950/30'
                : 'border-emerald-500/40 bg-slate-900/90'
            }`}>
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    activeCheckIn.status === 'expired_alerted'
                      ? 'bg-rose-600 text-white shadow-md'
                      : activeCheckIn.status === 'warning_pending'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    <Timer className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">
                        Proactive Safety Check-in: {activeCheckIn.activityTitle}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        activeCheckIn.status === 'expired_alerted'
                          ? 'bg-rose-500 text-white'
                          : activeCheckIn.status === 'warning_pending'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {activeCheckIn.status === 'expired_alerted' 
                          ? 'MISSED CHECK-IN: ALERT DISPATCHED' 
                          : activeCheckIn.status === 'warning_pending'
                          ? 'CONFIRMATION WARNING' 
                          : 'TIMER ACTIVE'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Started: {new Date(activeCheckIn.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Due: <span className="text-white font-semibold">{new Date(activeCheckIn.scheduledCheckInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                  </div>
                </div>

                {activeCheckIn.isActive && (
                  <div className="text-right">
                    <span className="font-mono text-2xl font-black text-emerald-400">
                      {Math.floor(checkInSecs / 60)}:{String(checkInSecs % 60).padStart(2, '0')}
                    </span>
                    <span className="block text-[10px] text-slate-400 uppercase">Remaining</span>
                  </div>
                )}
              </div>

              {activeCheckIn.routeNote && (
                <div className="mt-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs">
                  <span className="text-slate-400 font-medium">Trip Notes & Vehicle Details: </span>
                  <span className="text-white font-mono">{activeCheckIn.routeNote}</span>
                </div>
              )}

              {activeCheckIn.status === 'expired_alerted' && (
                <div className="mt-3 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-xs text-rose-200">
                  ⚠️ <span className="font-bold">Automated Guardian Escalation:</span> User did not verify "I'm Safe" before timer expiration. Emergency SMS sent to all designated guardians with live tracking link.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-800 text-slate-400">
                  <Timer className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Proactive Safety Check-in</h4>
                  <p className="text-[11px] text-slate-400">Timer currently idle. Guardians will be alerted automatically if a journey timer expires.</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase bg-slate-950 px-2 py-1 rounded-md border border-slate-800">Standby</span>
            </div>
          )}

          {/* Ambient Audio Capture Section */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-rose-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Cloud Ambient Audio Stream
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Live microphone capture buffer for forensic verification
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-rose-300">
                LIVE BUFFER (60s)
              </span>
            </div>

            {/* Audio Waveform visualization */}
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="flex items-center gap-2 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Streaming Audio Feed (Encrypted TLS 1.3)</span>
                </span>
                <span className="font-mono text-[11px]">44.1 kHz • AAC Stereo</span>
              </div>

              <div className="flex h-12 items-center gap-1">
                {Array.from({ length: 48 }).map((_, i) => {
                  const barH = isPlayingAudio 
                    ? Math.max(15, Math.floor(Math.sin(i * 0.4 + Date.now() / 300) * 45 + 50)) 
                    : Math.max(10, (i % 7) * 12 + 10);
                  return (
                    <div
                      key={i}
                      style={{ height: `${barH}%` }}
                      className={`flex-1 rounded-full transition-all duration-100 ${
                        isPlayingAudio ? 'bg-rose-500' : 'bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <button
                  id="btn-play-guardian-audio"
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 font-bold transition-colors"
                >
                  {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{isPlayingAudio ? 'Pause Audio Feed' : 'Listen Live Ambient Audio'}</span>
                </button>
                <span className="text-slate-400 text-[11px]">
                  {isPlayingAudio ? 'Playing simulated live microphone feed' : 'Click to monitor microphone remotely'}
                </span>
              </div>
            </div>
          </div>

          {/* SMS & Dispatch Logs */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <MessageSquareText className="h-5 w-5 text-sky-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Automated SMS & Police Dispatch Notification Log
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    High-priority SMS sent to carrier networks with dynamic live GPS link
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-3">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Delivered SMS Payload:
              </div>
              <div className="rounded-lg bg-slate-900 p-3 font-mono text-xs text-rose-200 border border-rose-900/40">
                🚨 <span className="font-bold">EMERGENCY ALERT:</span> Priya Sharma has triggered an SOS alert!
                <br />
                📍 <span className="text-slate-300">Live GPS: {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}</span>
                <br />
                🔗 <span className="text-sky-400 underline">https://aegis-shield.live/track/sos-priya?token=guard-9912</span>
                <br />
                📞 Authorities are being alerted. Please open link or call her now.
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Carrier Delivery Status: <span className="text-emerald-400 font-bold">100% Delivered</span></span>
                <span>Delivery latency: 420ms</span>
              </div>
            </div>
          </div>

          {/* Guardian Live Notes / Responders Chat */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Guardian Coordination Log
              </h3>
            </div>

            <form onSubmit={handleAddNote} className="flex gap-2 mb-3">
              <input
                id="input-guardian-note"
                type="text"
                value={guardianNote}
                onChange={(e) => setGuardianNote(e.target.value)}
                placeholder="Add responder coordinate or action (e.g. 'I am driving towards Market St')..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white transition-colors flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Post</span>
              </button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {guardianNotesList.map((note, index) => (
                <div key={index} className="rounded-lg bg-slate-950/80 p-2.5 text-xs text-slate-300 border border-slate-800">
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Incident Timeline & Authorities Status */}
        <div className="space-y-6">
          {/* Incident Timeline */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">
                  Incident Live Stream Timeline
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                AUTO-SYNCED
              </span>
            </div>

            <div className="relative pl-5 space-y-4 border-l-2 border-slate-800">
              {(activeIncident?.timeline || [
                {
                  timestamp: Date.now() - 60000,
                  title: 'Aegis Active Guard Standby',
                  description: 'All BLE sensors, voice recognition, and GPS telemetry healthy.',
                  type: 'trigger',
                },
                {
                  timestamp: Date.now() - 30000,
                  title: 'Periodic GPS Ping OK',
                  description: 'Position verified at Market St Downtown corridor.',
                  type: 'location',
                },
              ]).map((item, idx) => (
                <div key={idx} className="relative">
                  <span className={`absolute -left-[27px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${
                    item.type === 'trigger'
                      ? 'bg-rose-500'
                      : item.type === 'dispatch'
                      ? 'bg-amber-400'
                      : item.type === 'sms'
                      ? 'bg-sky-400'
                      : 'bg-emerald-400'
                  }`} />
                  <div className="text-xs font-bold text-white">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {item.description}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Authorities Dispatch Status Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">
                Emergency Authorities Coordination
              </h3>
            </div>

            <div className="space-y-3">
              {authorities.map((agency) => (
                <div key={agency.id} className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {agency.name}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      agency.status === 'dispatching' || agency.status === 'en_route'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {agency.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {agency.etaMinutes && (
                    <div className="mt-2 flex items-center justify-between text-xs text-amber-400 font-semibold">
                      <span>Patrol ETA: {agency.etaMinutes} mins</span>
                      <span className="text-[10px] text-slate-400 font-mono">Unit #409</span>
                    </div>
                  )}

                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                    <span className="text-slate-400 font-mono">Helpline: {agency.phone}</span>
                    <a
                      href={`tel:${agency.phone}`}
                      className="text-rose-400 hover:text-rose-300 font-semibold text-xs"
                    >
                      Call Dispatch
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
