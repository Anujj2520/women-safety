export type AppTab = 'monitor' | 'guardian' | 'wearables' | 'contacts' | 'settings';

export type AlertState = 'normal' | 'countdown' | 'sos_active' | 'silent_active' | 'resolved';

export type TriggerSource = 
  | 'one_tap_sos' 
  | 'voice_trigger' 
  | 'wearable_ble' 
  | 'walk_timer_expired' 
  | 'duress_pin'
  | 'manual_silent';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
  address?: string;
  batteryLevel?: number;
  networkQuality?: '5G' | '4G' | 'Wi-Fi' | 'Satellite' | 'Weak';
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  isPrimary: boolean;
  receiveSms: boolean;
  receiveCall: boolean;
  receiveLiveLocation: boolean;
  status: 'active' | 'alerted' | 'acknowledged' | 'in_transit';
  lastNotifiedAt?: string;
}

export interface AuthorityAgency {
  id: string;
  name: string;
  agencyType: 'police' | 'women_helpline' | 'medical' | 'patrol';
  phone: string;
  status: 'standby' | 'alert_sent' | 'dispatching' | 'en_route' | 'on_scene';
  etaMinutes?: number;
  officerBadge?: string;
}

export interface SafeZone {
  id: string;
  name: string;
  type: 'police_station' | 'hospital' | 'women_center' | 'safe_haven';
  latitude: number;
  longitude: number;
  address: string;
  distanceMeters: number;
  isOpen24x7: boolean;
  phone: string;
}

export interface BleDevice {
  id: string;
  name: string;
  deviceType: 'ring' | 'pendant' | 'smartband' | 'keychain' | 'clip';
  macAddress: string;
  connected: boolean;
  isHardwareWebBle?: boolean;
  batteryLevel: number;
  rssi: number; // dBm (-30 to -90)
  firmwareVersion: string;
  lastSyncTime: string;
  pressAction: 'instant_sos' | 'silent_sos' | 'voice_checkin' | 'safe_ping';
  hapticFeedback: boolean;
  isSimulated?: boolean;
}

export interface AlertIncident {
  id: string;
  triggeredAt: number;
  resolvedAt?: number;
  triggerSource: TriggerSource;
  alertState: AlertState;
  currentLocation: LocationPoint;
  locationTrail: LocationPoint[];
  notifiedContactsCount: number;
  notifiedAuthoritiesCount: number;
  audioRecordingDuration?: number; // seconds
  liveBroadcastUrl: string;
  audioSampleNotes?: string;
  timeline: {
    timestamp: number;
    title: string;
    description: string;
    type: 'trigger' | 'location' | 'sms' | 'call' | 'dispatch' | 'guardian' | 'resolved';
  }[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  bloodGroup: string;
  medicalNotes: string;
  emergencyPasscode: string; // Used to disarm / verify safe
  authProvider: 'google' | 'apple' | 'email' | 'guest';
  isLoggedIn: boolean;
  role: 'user' | 'guardian' | 'authority';
  address: string;
  emergencyMessageCustom: string;
}

export interface SafetySettings {
  voiceTriggerEnabled: boolean;
  voiceKeywords: string[];
  voiceSensitivity: number; // 1-100
  countdownSeconds: number; // 3 or 5 or 0
  loudSirenEnabled: boolean;
  autoFlashStrobe: boolean;
  autoRecordAudio: boolean;
  walkWithMeEnabled: boolean;
  walkWithMeDurationMinutes: number;
  fakeCallDelaySeconds: number;
  bleAutoReconnect: boolean;
}
