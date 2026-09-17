import { 
  ActivityCategory,
  AlertIncident, 
  AlertState, 
  AuthorityAgency, 
  EmergencyContact, 
  LocationPoint, 
  SafetyCheckInEvent,
  SafetyCheckInSession,
  SafetySettings, 
  TriggerSource, 
  UserProfile 
} from '../types';
import { audioService } from './audioService';
import { locationService } from './locationService';

const STORAGE_KEYS = {
  USER_PROFILE: 'aegis_user_profile',
  CONTACTS: 'aegis_emergency_contacts',
  SETTINGS: 'aegis_safety_settings',
  ACTIVE_INCIDENT: 'aegis_active_incident',
  CHECKIN_SESSION: 'aegis_safety_checkin',
};

const DEFAULT_PROFILE: UserProfile = {
  id: 'user-priya-01',
  name: 'Priya Sharma',
  email: 'priya.sharma@safenet.org',
  phone: '+1 (555) 234-5678',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  bloodGroup: 'O+ Positive',
  medicalNotes: 'Asthmatic, carries inhaler. No known antibiotic allergies.',
  emergencyPasscode: '1234',
  authProvider: 'google',
  isLoggedIn: true,
  role: 'user',
  address: '420 Pine Hill Ave, Apt 3B, San Francisco, CA',
  emergencyMessageCustom: 'EMERGENCY: I need immediate assistance! Here is my live GPS location. Please alert local authorities if I do not respond.',
};

const DEFAULT_CONTACTS: EmergencyContact[] = [
  {
    id: 'c-1',
    name: 'Sunita Sharma (Mother)',
    relationship: 'Mother',
    phone: '+1 (555) 892-1200',
    email: 'sunita.sharma@example.com',
    isPrimary: true,
    receiveSms: true,
    receiveCall: true,
    receiveLiveLocation: true,
    status: 'active',
  },
  {
    id: 'c-2',
    name: 'Maya Patel (Sister / Guardian)',
    relationship: 'Sister',
    phone: '+1 (555) 761-4433',
    email: 'maya.patel@guardian.org',
    isPrimary: true,
    receiveSms: true,
    receiveCall: true,
    receiveLiveLocation: true,
    status: 'active',
  },
  {
    id: 'c-3',
    name: 'Dr. Aarav Mehta (Family Friend)',
    relationship: 'Family Friend / Doctor',
    phone: '+1 (555) 349-8812',
    email: 'aarav.m@clinic.health',
    isPrimary: false,
    receiveSms: true,
    receiveCall: false,
    receiveLiveLocation: true,
    status: 'active',
  },
];

const DEFAULT_AUTHORITIES: AuthorityAgency[] = [
  {
    id: 'auth-police',
    name: 'Local Emergency Police Dispatch (911 / 112)',
    agencyType: 'police',
    phone: '911',
    status: 'standby',
  },
  {
    id: 'auth-women',
    name: 'National Women Safety Response Cell (1091)',
    agencyType: 'women_helpline',
    phone: '1091',
    status: 'standby',
  },
  {
    id: 'auth-medical',
    name: 'Emergency Medical & Trauma Ambulance',
    agencyType: 'medical',
    phone: '108',
    status: 'standby',
  },
  {
    id: 'auth-patrol',
    name: 'Transit & Metro Security Patrol Network',
    agencyType: 'patrol',
    phone: '112-2',
    status: 'standby',
  },
];

const DEFAULT_SETTINGS: SafetySettings = {
  voiceTriggerEnabled: true,
  voiceKeywords: ['help', 'emergency', 'save me', 'police', 'sos', 'danger'],
  voiceSensitivity: 75,
  countdownSeconds: 3,
  loudSirenEnabled: true,
  autoFlashStrobe: true,
  autoRecordAudio: true,
  walkWithMeEnabled: false,
  walkWithMeDurationMinutes: 15,
  fakeCallDelaySeconds: 10,
  bleAutoReconnect: true,
};

class SafetyStore {
  private userProfile: UserProfile;
  private contacts: EmergencyContact[];
  private authorities: AuthorityAgency[] = [...DEFAULT_AUTHORITIES];
  private settings: SafetySettings;
  private alertState: AlertState = 'normal';
  private activeIncident: AlertIncident | null = null;
  private countdownTimer: number | null = null;
  private countdownRemaining = 3;
  private audioRecordTimer: number | null = null;
  private activeCheckIn: SafetyCheckInSession | null = null;
  private checkInTicker: number | null = null;

  private listeners: (() => void)[] = [];

  constructor() {
    this.userProfile = this.loadFromStorage(STORAGE_KEYS.USER_PROFILE, DEFAULT_PROFILE);
    this.contacts = this.loadFromStorage(STORAGE_KEYS.CONTACTS, DEFAULT_CONTACTS);
    this.settings = this.loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    this.activeCheckIn = this.loadFromStorage<SafetyCheckInSession | null>(STORAGE_KEYS.CHECKIN_SESSION, null);

    this.startCheckInTicker();

    // Listen to location changes to update active incident trail
    locationService.onLocationChange((point) => {
      if (this.activeIncident && (this.alertState === 'sos_active' || this.alertState === 'silent_active')) {
        this.activeIncident.currentLocation = point;
        this.activeIncident.locationTrail.push(point);
        // Trim trail if overly long
        if (this.activeIncident.locationTrail.length > 50) {
          this.activeIncident.locationTrail.shift();
        }
        this.notify();
      }
      if (this.activeCheckIn && this.activeCheckIn.isActive) {
        this.activeCheckIn.lastKnownLocation = point;
      }
    });
  }

  subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn(`Failed reading storage for ${key}`, e);
    }
    return fallback;
  }

  private saveToStorage(key: string, data: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Storage quota or sandboxed
    }
  }

  // Getters
  getUserProfile(): UserProfile {
    return this.userProfile;
  }

  getContacts(): EmergencyContact[] {
    return this.contacts;
  }

  getAuthorities(): AuthorityAgency[] {
    return this.authorities;
  }

  getSettings(): SafetySettings {
    return this.settings;
  }

  getAlertState(): AlertState {
    return this.alertState;
  }

  getActiveIncident(): AlertIncident | null {
    return this.activeIncident;
  }

  getCountdownRemaining(): number {
    return this.countdownRemaining;
  }

  getActiveCheckIn(): SafetyCheckInSession | null {
    return this.activeCheckIn;
  }

  getCheckInRemainingSeconds(): number {
    if (!this.activeCheckIn || !this.activeCheckIn.isActive) return 0;
    const diff = Math.max(0, Math.floor((this.activeCheckIn.scheduledCheckInAt - Date.now()) / 1000));
    return diff;
  }

  // Trigger SOS flow
  triggerSOS(source: TriggerSource, instant = false, silent = false) {
    if (this.alertState === 'sos_active' || this.alertState === 'silent_active') {
      return; // Already active
    }

    if (!instant && !silent && this.settings.countdownSeconds > 0) {
      this.alertState = 'countdown';
      this.countdownRemaining = this.settings.countdownSeconds;
      this.notify();

      audioService.playCountdownBeep(700);

      this.countdownTimer = window.setInterval(() => {
        this.countdownRemaining -= 1;
        if (this.countdownRemaining > 0) {
          audioService.playCountdownBeep(700 + (this.settings.countdownSeconds - this.countdownRemaining) * 150);
          this.notify();
        } else {
          this.clearCountdown();
          this.activateEmergency(source, silent);
        }
      }, 1000);
    } else {
      this.clearCountdown();
      this.activateEmergency(source, silent);
    }
  }

  cancelCountdown() {
    this.clearCountdown();
    this.alertState = 'normal';
    this.notify();
  }

  private clearCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  // Activate Emergency Incident
  private activateEmergency(source: TriggerSource, silent: boolean) {
    locationService.startLiveTracking();
    const loc = locationService.getCurrentLocation();
    const incidentId = `INC-${Date.now().toString(36).toUpperCase()}`;

    this.alertState = silent ? 'silent_active' : 'sos_active';

    // Start siren if configured and not in silent mode
    if (!silent && this.settings.loudSirenEnabled) {
      audioService.startEmergencySiren();
    } else {
      audioService.playDiscreetChirp();
    }

    const liveShareUrl = `https://aegis-shield.live/track/${incidentId}?key=guard-${Math.random().toString(36).substring(2, 8)}`;

    const newIncident: AlertIncident = {
      id: incidentId,
      triggeredAt: Date.now(),
      triggerSource: source,
      alertState: this.alertState,
      currentLocation: loc,
      locationTrail: [loc],
      notifiedContactsCount: this.contacts.filter(c => c.receiveSms || c.receiveCall).length,
      notifiedAuthoritiesCount: this.authorities.length,
      liveBroadcastUrl: liveShareUrl,
      audioRecordingDuration: 0,
      audioSampleNotes: 'Live 60s ambient audio buffer streaming to Guardian Cloud...',
      timeline: [
        {
          timestamp: Date.now(),
          title: `Emergency SOS Alert Triggered [${source.replace(/_/g, ' ').toUpperCase()}]`,
          description: `Discreet trigger initiated. User position captured at ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}. Accuracy: ±${loc.accuracy}m.`,
          type: 'trigger',
        },
        {
          timestamp: Date.now() + 400,
          title: `Automated SMS & High-Priority Alerts Sent`,
          description: `Emergency SMS and automated voice phone dispatch sent to ${this.contacts.length} trusted contacts with encrypted live map URL.`,
          type: 'sms',
        },
        {
          timestamp: Date.now() + 800,
          title: `Police & Women Helpline Cell Notified`,
          description: `Telemetry and identity package pushed to Emergency Dispatcher. Standby priority raised to Tier 1 High Alert.`,
          type: 'dispatch',
        }
      ]
    };

    // Mark contacts as alerted
    this.contacts = this.contacts.map((c, idx) => ({
      ...c,
      status: idx === 0 ? 'acknowledged' : 'alerted',
      lastNotifiedAt: 'Just now',
    }));

    // Mark authorities
    this.authorities = this.authorities.map(a => ({
      ...a,
      status: a.agencyType === 'police' ? 'dispatching' : 'alert_sent',
      etaMinutes: a.agencyType === 'police' ? 6 : 9,
      officerBadge: a.agencyType === 'police' ? 'Patrol #409 (Unit 12)' : undefined,
    }));

    this.activeIncident = newIncident;
    this.notify();

    // Start incident audio timer simulation
    this.audioRecordTimer = window.setInterval(() => {
      if (this.activeIncident && (this.alertState === 'sos_active' || this.alertState === 'silent_active')) {
        this.activeIncident.audioRecordingDuration = (this.activeIncident.audioRecordingDuration || 0) + 1;
        
        // At 15 seconds, simulate officer dispatch update
        if (this.activeIncident.audioRecordingDuration === 15) {
          this.activeIncident.timeline.push({
            timestamp: Date.now(),
            title: 'Officer Dispatched & En Route',
            description: 'Police Patrol Unit #409 has accepted location tracking and is en route. Estimated arrival in 5 minutes.',
            type: 'dispatch',
          });
          this.authorities = this.authorities.map(a => 
            a.agencyType === 'police' ? { ...a, status: 'en_route', etaMinutes: 5 } : a
          );
        }

        // At 30 seconds, simulate guardian response
        if (this.activeIncident.audioRecordingDuration === 30) {
          this.activeIncident.timeline.push({
            timestamp: Date.now(),
            title: 'Guardian Sunita Sharma joined Live Stream',
            description: 'Primary contact Sunita Sharma opened cloud tracker and initiated two-way audio bridge.',
            type: 'guardian',
          });
          this.contacts = this.contacts.map((c, i) => i === 0 ? { ...c, status: 'in_transit' } : c);
        }

        this.notify();
      }
    }, 1000);
  }

  // Safe Resolution / Disarm SOS
  resolveSOS(passcode: string): { success: boolean; message: string } {
    if (passcode.trim() !== this.userProfile.emergencyPasscode.trim()) {
      return { success: false, message: 'Invalid safety passcode! Disarm rejected.' };
    }

    audioService.stopEmergencySiren();
    if (this.audioRecordTimer) {
      clearInterval(this.audioRecordTimer);
      this.audioRecordTimer = null;
    }

    if (this.activeIncident) {
      this.activeIncident.resolvedAt = Date.now();
      this.activeIncident.alertState = 'resolved';
      this.activeIncident.timeline.push({
        timestamp: Date.now(),
        title: 'Emergency Resolved / Disarmed',
        description: `Verified safe by user with correct authorization PIN. All authorities and guardians notified of safety resolution.`,
        type: 'resolved',
      });
    }

    this.alertState = 'resolved';
    this.authorities = this.authorities.map(a => ({ ...a, status: 'standby', etaMinutes: undefined }));
    this.contacts = this.contacts.map(c => ({ ...c, status: 'active' }));
    this.notify();

    setTimeout(() => {
      if (this.alertState === 'resolved') {
        this.alertState = 'normal';
        this.activeIncident = null;
        this.notify();
      }
    }, 4000);

    return { success: true, message: 'Emergency alert disarmed and cancelled successfully. Guardians updated.' };
  }

  toggleSiren() {
    if (audioService.isSirenActive()) {
      audioService.stopEmergencySiren();
    } else {
      audioService.startEmergencySiren();
    }
    this.notify();
  }

  // Update Settings
  updateSettings(newSettings: Partial<SafetySettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveToStorage(STORAGE_KEYS.SETTINGS, this.settings);
    this.notify();
  }

  // Update User Profile
  updateUserProfile(updates: Partial<UserProfile>) {
    this.userProfile = { ...this.userProfile, ...updates };
    this.saveToStorage(STORAGE_KEYS.USER_PROFILE, this.userProfile);
    this.notify();
  }

  // OAuth Login / Logout
  loginWithOAuth(provider: 'google' | 'apple' | 'email', customName?: string, customEmail?: string) {
    const name = customName || (provider === 'google' ? 'Priya Sharma' : provider === 'apple' ? 'Priya S.' : 'Priya User');
    const email = customEmail || (provider === 'google' ? 'priya.sharma@safenet.org' : 'priya.apple@icloud.com');

    this.userProfile = {
      ...this.userProfile,
      name,
      email,
      authProvider: provider,
      isLoggedIn: true,
    };
    this.saveToStorage(STORAGE_KEYS.USER_PROFILE, this.userProfile);
    this.notify();
  }

  logout() {
    this.userProfile = {
      ...this.userProfile,
      isLoggedIn: false,
      authProvider: 'guest',
    };
    this.saveToStorage(STORAGE_KEYS.USER_PROFILE, this.userProfile);
    this.notify();
  }

  // Contact CRUD
  addContact(contact: Omit<EmergencyContact, 'id' | 'status'>) {
    const newContact: EmergencyContact = {
      ...contact,
      id: `c-${Date.now()}`,
      status: 'active',
    };
    this.contacts = [...this.contacts, newContact];
    this.saveToStorage(STORAGE_KEYS.CONTACTS, this.contacts);
    this.notify();
  }

  updateContact(id: string, updates: Partial<EmergencyContact>) {
    this.contacts = this.contacts.map(c => c.id === id ? { ...c, ...updates } : c);
    this.saveToStorage(STORAGE_KEYS.CONTACTS, this.contacts);
    this.notify();
  }

  deleteContact(id: string) {
    this.contacts = this.contacts.filter(c => c.id !== id);
    this.saveToStorage(STORAGE_KEYS.CONTACTS, this.contacts);
    this.notify();
  }

  // Safety Check-in Engine
  private startCheckInTicker() {
    if (this.checkInTicker) {
      clearInterval(this.checkInTicker);
    }
    this.checkInTicker = window.setInterval(() => {
      if (!this.activeCheckIn || !this.activeCheckIn.isActive) return;

      const remainingMs = this.activeCheckIn.scheduledCheckInAt - Date.now();
      const graceMs = (this.activeCheckIn.gracePeriodSeconds || 60) * 1000;

      // When remaining time <= grace period (e.g. 60s) and status is still 'active'
      if (remainingMs <= graceMs && remainingMs > 0) {
        if (this.activeCheckIn.status === 'active') {
          this.activeCheckIn.status = 'warning_pending';
          audioService.playCountdownBeep(650);
          this.activeCheckIn.history.push({
            id: `evt-${Date.now()}`,
            timestamp: Date.now(),
            type: 'warning',
            message: `Check-in timer expires in ${Math.ceil(remainingMs / 1000)} seconds! Please tap "I'm Safe" to avoid alerting emergency contacts.`,
            location: locationService.getCurrentLocation(),
          });
          this.saveToStorage(STORAGE_KEYS.CHECKIN_SESSION, this.activeCheckIn);
          this.notify();
        }
      }

      // When remaining time <= 0, timer has expired without manual "I'm Safe" confirmation!
      if (remainingMs <= 0) {
        if (this.activeCheckIn.status === 'active' || this.activeCheckIn.status === 'warning_pending') {
          this.handleCheckInExpiry();
        }
      }
    }, 1000);
  }

  // Handle Missed Check-in Escalation
  private handleCheckInExpiry() {
    if (!this.activeCheckIn) return;

    this.activeCheckIn.status = 'expired_alerted';
    this.activeCheckIn.isActive = false;
    audioService.playOverdueBuzzer();

    const loc = locationService.getCurrentLocation();
    this.activeCheckIn.lastKnownLocation = loc;

    // Identify designated emergency contacts / guardians
    const designatedContacts = this.activeCheckIn.notifyAllGuardians
      ? this.contacts
      : this.contacts.filter(c => this.activeCheckIn?.designatedContactIds.includes(c.id));

    const notifiedNames = designatedContacts.map(c => c.name).join(', ') || 'All Primary Contacts';

    // Mark designated contacts as alerted with missed check-in status
    this.contacts = this.contacts.map(c => {
      const isDesignated = this.activeCheckIn?.notifyAllGuardians || this.activeCheckIn?.designatedContactIds.includes(c.id);
      if (isDesignated) {
        return {
          ...c,
          status: 'alerted',
          lastNotifiedAt: `Missed Check-in Alert: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        };
      }
      return c;
    });
    this.saveToStorage(STORAGE_KEYS.CONTACTS, this.contacts);

    // Record in check-in history
    this.activeCheckIn.history.push({
      id: `evt-${Date.now()}`,
      timestamp: Date.now(),
      type: 'expired_alerted',
      message: `🚨 MISSED CHECK-IN ALERT! User failed to confirm "I'm Safe" for "${this.activeCheckIn.activityTitle}". Emergency SMS with live GPS dispatched to: ${notifiedNames}.`,
      location: loc,
    });
    this.saveToStorage(STORAGE_KEYS.CHECKIN_SESSION, this.activeCheckIn);

    // If autoEscalateToSos is enabled, trigger SOS
    if (this.activeCheckIn.autoEscalateToSos) {
      this.triggerSOS('safety_checkin_expired', true, false);
      if (this.activeIncident) {
        this.activeIncident.timeline.unshift({
          timestamp: Date.now(),
          title: '🚨 Missed Safety Check-in Escalation',
          description: `Scheduled timer for "${this.activeCheckIn.activityTitle}" expired without user confirmation. Designated emergency contacts notified.`,
          type: 'trigger',
        });
      }
    }

    this.notify();
  }

  // User manually confirms "I'm Safe"
  confirmSafe(note?: string) {
    if (!this.activeCheckIn) return;

    this.activeCheckIn.status = 'safe_confirmed';
    this.activeCheckIn.isActive = false;
    this.activeCheckIn.lastCheckedInAt = Date.now();
    audioService.playSafeChirp();

    const confirmationMsg = note && note.trim()
      ? `User confirmed: "I'm Safe (${note.trim()})"`
      : `User manually confirmed: "I'm Safe!" Check-in verified securely.`;

    this.activeCheckIn.history.push({
      id: `evt-${Date.now()}`,
      timestamp: Date.now(),
      type: 'safe_confirmed',
      message: confirmationMsg,
      location: locationService.getCurrentLocation(),
    });

    // If contacts had been alerted by missed check-in, update them to safe
    this.contacts = this.contacts.map(c => ({
      ...c,
      status: 'active',
      lastNotifiedAt: `Verified Safe: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    }));
    this.saveToStorage(STORAGE_KEYS.CONTACTS, this.contacts);

    this.saveToStorage(STORAGE_KEYS.CHECKIN_SESSION, this.activeCheckIn);
    this.notify();
  }

  // Extend active check-in timer
  extendCheckIn(additionalMinutes: number) {
    if (!this.activeCheckIn) return;

    const addedMs = additionalMinutes * 60 * 1000;
    // If was expired, extend from now; otherwise extend from scheduledCheckInAt
    const baseTime = this.activeCheckIn.scheduledCheckInAt > Date.now() 
      ? this.activeCheckIn.scheduledCheckInAt 
      : Date.now();

    this.activeCheckIn.scheduledCheckInAt = baseTime + addedMs;
    this.activeCheckIn.durationMinutes += additionalMinutes;
    this.activeCheckIn.status = 'active';
    this.activeCheckIn.isActive = true;

    audioService.playDiscreetChirp();

    const timeStr = new Date(this.activeCheckIn.scheduledCheckInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.activeCheckIn.history.push({
      id: `evt-${Date.now()}`,
      timestamp: Date.now(),
      type: 'extended',
      message: `Timer extended by +${additionalMinutes} mins. Next check-in due at ${timeStr}.`,
      location: locationService.getCurrentLocation(),
    });

    this.saveToStorage(STORAGE_KEYS.CHECKIN_SESSION, this.activeCheckIn);
    this.notify();
  }

  // Start new safety check-in session
  startCheckIn(params: {
    activityTitle: string;
    activityCategory: ActivityCategory;
    durationMinutes: number;
    routeNote?: string;
    designatedContactIds?: string[];
    notifyAllGuardians?: boolean;
    gracePeriodSeconds?: number;
    autoEscalateToSos?: boolean;
  }) {
    const now = Date.now();
    const scheduledCheckInAt = now + params.durationMinutes * 60 * 1000;
    const currentLocation = locationService.getCurrentLocation();

    const newSession: SafetyCheckInSession = {
      id: `chk-${Date.now().toString(36).toUpperCase()}`,
      isActive: true,
      activityTitle: params.activityTitle || 'Safety Check-in',
      activityCategory: params.activityCategory || 'custom',
      routeNote: params.routeNote,
      durationMinutes: params.durationMinutes,
      startedAt: now,
      scheduledCheckInAt,
      status: 'active',
      designatedContactIds: params.designatedContactIds || this.contacts.map(c => c.id),
      notifyAllGuardians: params.notifyAllGuardians ?? true,
      gracePeriodSeconds: params.gracePeriodSeconds || 60,
      autoEscalateToSos: params.autoEscalateToSos ?? true,
      lastKnownLocation: currentLocation,
      history: [
        {
          id: `evt-${Date.now()}`,
          timestamp: now,
          type: 'started',
          message: `Safety Check-in initiated for "${params.activityTitle}". Timer set to ${params.durationMinutes} min(s). Due at ${new Date(scheduledCheckInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          location: currentLocation,
        }
      ],
    };

    this.activeCheckIn = newSession;
    audioService.playDiscreetChirp();
    this.saveToStorage(STORAGE_KEYS.CHECKIN_SESSION, this.activeCheckIn);
    this.startCheckInTicker();
    this.notify();
  }

  // Cancel safety check-in
  cancelCheckIn(reason?: string) {
    if (!this.activeCheckIn) return;

    this.activeCheckIn.status = 'cancelled';
    this.activeCheckIn.isActive = false;
    this.activeCheckIn.history.push({
      id: `evt-${Date.now()}`,
      timestamp: Date.now(),
      type: 'cancelled',
      message: reason || 'Check-in session ended by user.',
      location: locationService.getCurrentLocation(),
    });

    this.saveToStorage(STORAGE_KEYS.CHECKIN_SESSION, this.activeCheckIn);
    this.notify();
  }
}

export const safetyStore = new SafetyStore();
