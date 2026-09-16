import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  ShieldCheck, 
  KeyRound, 
  Mic, 
  Volume2, 
  Bell, 
  Save, 
  Check, 
  Plus, 
  Trash2, 
  LogIn, 
  LogOut, 
  Sparkles,
  Lock,
  HeartPulse
} from 'lucide-react';
import { SafetySettings, UserProfile } from '../types';

interface ProfileSettingsViewProps {
  userProfile: UserProfile;
  settings: SafetySettings;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onUpdateSettings: (updates: Partial<SafetySettings>) => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  userProfile,
  settings,
  onUpdateProfile,
  onUpdateSettings,
  onOpenAuthModal,
  onLogout,
}) => {
  // Local form state
  const [name, setName] = useState(userProfile.name);
  const [phone, setPhone] = useState(userProfile.phone);
  const [bloodGroup, setBloodGroup] = useState(userProfile.bloodGroup);
  const [medicalNotes, setMedicalNotes] = useState(userProfile.medicalNotes);
  const [emergencyPasscode, setEmergencyPasscode] = useState(userProfile.emergencyPasscode);
  const [emergencyMessage, setEmergencyMessage] = useState(userProfile.emergencyMessageCustom);
  const [newKeyword, setNewKeyword] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      phone,
      bloodGroup,
      medicalNotes,
      emergencyPasscode,
      emergencyMessageCustom: emergencyMessage,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    const word = newKeyword.trim().toLowerCase();
    if (!settings.voiceKeywords.includes(word)) {
      onUpdateSettings({
        voiceKeywords: [...settings.voiceKeywords, word],
      });
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (wordToRemove: string) => {
    onUpdateSettings({
      voiceKeywords: settings.voiceKeywords.filter(w => w !== wordToRemove),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-md">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Profile & Safety System Settings
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Medical identity, secure disarm PIN, hands-free voice triggers, and OAuth credentials
              </p>
            </div>
          </div>

          {saveSuccess && (
            <div className="rounded-xl bg-emerald-950/80 border border-emerald-800/80 px-4 py-2 text-xs font-bold text-emerald-300 flex items-center gap-1.5 animate-in fade-in">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>Settings Saved Successfully!</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account & Medical Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Profile Form */}
          <form onSubmit={handleSaveProfile} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">
                  Personal & Emergency Medical ID
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Pushed to dispatchers during SOS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Legal Name
                </label>
                <input
                  id="input-profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Emergency Mobile Phone
                </label>
                <input
                  id="input-profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Blood Group (Crucial for First Responders)
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                >
                  <option value="O+ Positive">O+ Positive</option>
                  <option value="O- Negative">O- Negative</option>
                  <option value="A+ Positive">A+ Positive</option>
                  <option value="A- Negative">A- Negative</option>
                  <option value="B+ Positive">B+ Positive</option>
                  <option value="B- Negative">B- Negative</option>
                  <option value="AB+ Positive">AB+ Positive</option>
                  <option value="AB- Negative">AB- Negative</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Secure Disarm PIN (To Cancel SOS)
                </label>
                <div className="relative">
                  <input
                    id="input-profile-passcode"
                    type="password"
                    maxLength={6}
                    value={emergencyPasscode}
                    onChange={(e) => setEmergencyPasscode(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white font-mono tracking-widest focus:border-rose-500 focus:outline-none"
                  />
                  <Lock className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Prevents attackers from coercing cancellation without code
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Allergies & Vital Medical Conditions
              </label>
              <textarea
                rows={2}
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                placeholder="e.g. Asthma (carries inhaler in purse), Penicillin allergy..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Custom Emergency SMS Message
              </label>
              <textarea
                rows={2}
                value={emergencyMessage}
                onChange={(e) => setEmergencyMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-none font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                id="btn-save-profile-settings"
                type="submit"
                className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-rose-600/30"
              >
                <Save className="h-4 w-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>

          {/* Voice Trigger Settings */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">
                  Hands-Free Voice Alert Configuration
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              When microphone is active, saying any of the keywords below triggers an instant emergency alert hands-free.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                placeholder="Add custom trigger phrase (e.g. 'Aura SOS', 'Red Code')..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1 border border-slate-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add Word</span>
              </button>
            </div>

            {/* Keyword Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {settings.voiceKeywords.map((word) => (
                <span
                  key={word}
                  className="rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1 text-xs font-mono text-rose-300 flex items-center gap-2"
                >
                  <span>"{word}"</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(word)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: OAuth Authentication & Alert Protocols */}
        <div className="space-y-6">
          {/* OAuth Authentication Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  OAuth Authentication
                </h3>
              </div>
              <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold">
                SECURE AUTH
              </span>
            </div>

            {userProfile.isLoggedIn ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-slate-950 p-3 border border-slate-800">
                  <img
                    src={userProfile.avatar}
                    alt={userProfile.name}
                    referrerPolicy="no-referrer"
                    className="h-10 w-10 rounded-full border border-slate-700 object-cover"
                  />
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-white truncate">
                      {userProfile.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {userProfile.email}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold uppercase mt-0.5">
                      Signed in with {userProfile.authProvider}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={onOpenAuthModal}
                    className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 py-2 border border-slate-700"
                  >
                    Switch Account
                  </button>
                  <button
                    onClick={onLogout}
                    className="rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-xs font-semibold text-slate-400 py-2 px-3 border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-center py-2">
                <p className="text-xs text-slate-400">
                  Sign in with Google OAuth or Apple ID to synchronize your emergency guardian network securely across all devices.
                </p>
                <button
                  id="btn-settings-open-auth"
                  onClick={onOpenAuthModal}
                  className="w-full rounded-xl bg-rose-600 hover:bg-rose-500 py-2.5 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In with OAuth</span>
                </button>
              </div>
            )}
          </div>

          {/* Alarm & Siren Preferences */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Bell className="h-4 w-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">
                Alarm & Alert Protocols
              </h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-start justify-between gap-3 text-xs text-slate-300 cursor-pointer">
                <div>
                  <span className="font-semibold text-white block">Loud Emergency Siren</span>
                  <span className="text-[11px] text-slate-400">
                    Sounds high-frequency 100dB oscillating alarm to deter attackers
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.loudSirenEnabled}
                  onChange={(e) => onUpdateSettings({ loudSirenEnabled: e.target.checked })}
                  className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 mt-1"
                />
              </label>

              <label className="flex items-start justify-between gap-3 text-xs text-slate-300 cursor-pointer">
                <div>
                  <span className="font-semibold text-white block">Auto Record Ambient Audio</span>
                  <span className="text-[11px] text-slate-400">
                    Captures 60s ambient microphone audio buffer sent to guardian cloud
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoRecordAudio}
                  onChange={(e) => onUpdateSettings({ autoRecordAudio: e.target.checked })}
                  className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 mt-1"
                />
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  SOS Arming Countdown Grace Period
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 3, 5].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => onUpdateSettings({ countdownSeconds: sec })}
                      className={`rounded-xl border py-1.5 text-xs font-bold transition-all ${
                        settings.countdownSeconds === sec
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {sec === 0 ? 'Instant (0s)' : `${sec} Seconds`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
