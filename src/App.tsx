import React, { useEffect, useState } from 'react';
import { 
  AppTab, 
  AlertState, 
  UserProfile, 
  SafetySettings, 
  EmergencyContact, 
  AuthorityAgency, 
  BleDevice, 
  LocationPoint, 
  AlertIncident 
} from './types';
import { safetyStore } from './services/safetyStore';
import { bleManager } from './services/bleService';
import { locationService } from './services/locationService';
import { Navbar } from './components/Navbar';
import { SosTrigger } from './components/SosTrigger';
import { VoiceTriggerWidget } from './components/VoiceTriggerWidget';
import { LiveMap } from './components/LiveMap';
import { GuardianDashboard } from './components/GuardianDashboard';
import { WearableManager } from './components/WearableManager';
import { EmergencyContactsView } from './components/EmergencyContactsView';
import { ProfileSettingsView } from './components/ProfileSettingsView';
import { AuthModal } from './components/AuthModal';
import { FakeCallModal } from './components/FakeCallModal';
import { WalkWithMeModal } from './components/WalkWithMeModal';
import { SafetyCheckInManager } from './components/SafetyCheckInManager';
import { 
  Shield, 
  Radio, 
  PhoneCall, 
  Footprints, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Watch, 
  Activity, 
  Volume2, 
  VolumeX,
  Lock,
  Timer
} from 'lucide-react';
import { audioService } from './services/audioService';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('monitor');
  const [alertState, setAlertState] = useState<AlertState>(safetyStore.getAlertState());
  const [userProfile, setUserProfile] = useState<UserProfile>(safetyStore.getUserProfile());
  const [settings, setSettings] = useState<SafetySettings>(safetyStore.getSettings());
  const [contacts, setContacts] = useState<EmergencyContact[]>(safetyStore.getContacts());
  const [authorities, setAuthorities] = useState<AuthorityAgency[]>(safetyStore.getAuthorities());
  const [activeIncident, setActiveIncident] = useState<AlertIncident | null>(safetyStore.getActiveIncident());
  const [countdownRemaining, setCountdownRemaining] = useState<number>(safetyStore.getCountdownRemaining());
  const [bleDevices, setBleDevices] = useState<BleDevice[]>(bleManager.getDevices());
  const [currentLocation, setCurrentLocation] = useState<LocationPoint>(locationService.getCurrentLocation());

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isFakeCallOpen, setIsFakeCallOpen] = useState(false);
  const [isWalkWithMeOpen, setIsWalkWithMeOpen] = useState(false);

  // Subscribe to safetyStore changes
  useEffect(() => {
    const unsubStore = safetyStore.subscribe(() => {
      setAlertState(safetyStore.getAlertState());
      setUserProfile(safetyStore.getUserProfile());
      setSettings(safetyStore.getSettings());
      setContacts(safetyStore.getContacts());
      setAuthorities(safetyStore.getAuthorities());
      setActiveIncident(safetyStore.getActiveIncident());
      setCountdownRemaining(safetyStore.getCountdownRemaining());
    });

    const unsubBle = bleManager.onDevicesChange((devs) => {
      setBleDevices(devs);
    });

    const unsubBleTrigger = bleManager.onTrigger((dev, action) => {
      if (action === 'instant_sos') {
        safetyStore.triggerSOS('wearable_ble', true, false);
      } else if (action === 'silent_sos') {
        safetyStore.triggerSOS('wearable_ble', true, true);
      } else {
        // Safe check-in ping
        console.log('Wearable check-in ping received');
      }
    });

    const unsubLoc = locationService.onLocationChange((loc) => {
      setCurrentLocation(loc);
    });

    return () => {
      unsubStore();
      unsubBle();
      unsubBleTrigger();
      unsubLoc();
    };
  }, []);

  const handleVoiceTriggered = (keyword: string) => {
    safetyStore.triggerSOS('voice_trigger', false, false);
  };

  const handleTriggerSos = (instant = false, silent = false) => {
    safetyStore.triggerSOS('one_tap_sos', instant, silent);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white font-sans">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertState={alertState}
        userProfile={userProfile}
        bleDevices={bleDevices}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => safetyStore.logout()}
        onOpenFakeCall={() => setIsFakeCallOpen(true)}
        onOpenWalkWithMe={() => setIsWalkWithMeOpen(true)}
        onTriggerSosQuick={() => safetyStore.triggerSOS('one_tap_sos', false, false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* TAB 1: SOS Monitor & Live Control Center */}
        {activeTab === 'monitor' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Quick Status Bar */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Emergency Alert System
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">
                      ARMED & MONITORING
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    Protected User: <span className="text-white font-bold">{userProfile.name}</span> • Medical ID: {userProfile.bloodGroup}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-tab-fake-call"
                  onClick={() => setIsFakeCallOpen(true)}
                  className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-sky-300 flex items-center gap-1.5 transition-colors"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-sky-400" />
                  <span>Fake Call Exit</span>
                </button>

                <button
                  id="btn-tab-checkin"
                  onClick={() => setActiveTab('checkin')}
                  className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-rose-300 flex items-center gap-1.5 transition-colors"
                >
                  <Timer className="h-3.5 w-3.5 text-rose-400" />
                  <span>Check-in Timer</span>
                </button>

                <button
                  id="btn-tab-walk-with-me"
                  onClick={() => setIsWalkWithMeOpen(true)}
                  className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 transition-colors"
                >
                  <Footprints className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Journey Guard</span>
                </button>
              </div>
            </div>

            {/* Proactive Safety Check-in Widget (Countdown / Quick Safe Trigger) */}
            <SafetyCheckInManager
              contacts={contacts}
              currentLocation={currentLocation}
              isCompactCard={true}
              onOpenSosMonitor={() => setActiveTab('checkin')}
            />

            {/* Central SOS Action Trigger Section */}
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 sm:p-8 shadow-2xl">
              <SosTrigger
                alertState={alertState}
                activeIncident={activeIncident}
                countdownRemaining={countdownRemaining}
                settings={settings}
                onTriggerSos={handleTriggerSos}
                onCancelCountdown={() => safetyStore.cancelCountdown()}
                onResolveSos={(pin) => safetyStore.resolveSOS(pin)}
                onToggleSiren={() => safetyStore.toggleSiren()}
              />
            </div>

            {/* Voice-Activated Hands-Free Widget */}
            <VoiceTriggerWidget
              settings={settings}
              onVoiceTriggered={handleVoiceTriggered}
              onUpdateSettings={(newSettings) => safetyStore.updateSettings(newSettings)}
            />

            {/* Live Interactive Map with Telemetry & Safe Zones */}
            <LiveMap
              currentLocation={currentLocation}
              isEmergencyActive={alertState === 'sos_active' || alertState === 'silent_active'}
              locationTrail={activeIncident?.locationTrail}
            />
          </div>
        )}

        {/* TAB 2: Guardian Cloud Dashboard */}
        {activeTab === 'guardian' && (
          <div className="animate-in fade-in duration-200">
            <GuardianDashboard
              userProfile={userProfile}
              alertState={alertState}
              activeIncident={activeIncident}
              currentLocation={currentLocation}
              contacts={contacts}
              authorities={authorities}
              onTriggerRemoteAlarm={() => safetyStore.toggleSiren()}
            />
          </div>
        )}

        {/* TAB: Safety Check-in Manager */}
        {activeTab === 'checkin' && (
          <div className="animate-in fade-in duration-200">
            <SafetyCheckInManager
              contacts={contacts}
              currentLocation={currentLocation}
              onOpenSosMonitor={() => setActiveTab('monitor')}
            />
          </div>
        )}

        {/* TAB 3: Wearables & Bluetooth Low Energy */}
        {activeTab === 'wearables' && (
          <div className="animate-in fade-in duration-200">
            <WearableManager
              devices={bleDevices}
              onTriggerAction={(dev, action) => {
                if (action === 'instant_sos') {
                  safetyStore.triggerSOS('wearable_ble', true, false);
                } else if (action === 'silent_sos') {
                  safetyStore.triggerSOS('wearable_ble', true, true);
                }
              }}
            />
          </div>
        )}

        {/* TAB 4: Emergency Contacts & Authorities */}
        {activeTab === 'contacts' && (
          <div className="animate-in fade-in duration-200">
            <EmergencyContactsView
              contacts={contacts}
              authorities={authorities}
              onAddContact={(c) => safetyStore.addContact(c)}
              onUpdateContact={(id, updates) => safetyStore.updateContact(id, updates)}
              onDeleteContact={(id) => safetyStore.deleteContact(id)}
            />
          </div>
        )}

        {/* TAB 5: Profile & Safety Settings */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in duration-200">
            <ProfileSettingsView
              userProfile={userProfile}
              settings={settings}
              onUpdateProfile={(updates) => safetyStore.updateUserProfile(updates)}
              onUpdateSettings={(updates) => safetyStore.updateSettings(updates)}
              onOpenAuthModal={() => setIsAuthOpen(true)}
              onLogout={() => safetyStore.logout()}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-rose-500" />
            <span className="font-semibold text-slate-300">Women Safety & Emergency Alert System</span>
            <span>•</span>
            <span className="text-slate-400">Bluetooth Low Energy Wearable & Cloud Guardian Node</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>24/7 Helpline: 1091 / 911</span>
            <span>•</span>
            <span className="text-emerald-400">End-to-End Encrypted Telemetry</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(provider, name, email) => {
          safetyStore.loginWithOAuth(provider, name, email);
        }}
      />

      <FakeCallModal
        isOpen={isFakeCallOpen}
        onClose={() => setIsFakeCallOpen(false)}
      />

      <WalkWithMeModal
        isOpen={isWalkWithMeOpen}
        onClose={() => setIsWalkWithMeOpen(false)}
        onTriggerSosAuto={() => {
          safetyStore.triggerSOS('walk_timer_expired', true, false);
          setIsWalkWithMeOpen(false);
        }}
        userPasscode={userProfile.emergencyPasscode}
      />
    </div>
  );
}
