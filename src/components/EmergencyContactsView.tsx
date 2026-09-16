import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  X 
} from 'lucide-react';
import { AuthorityAgency, EmergencyContact } from '../types';

interface EmergencyContactsViewProps {
  contacts: EmergencyContact[];
  authorities: AuthorityAgency[];
  onAddContact: (contact: Omit<EmergencyContact, 'id' | 'status'>) => void;
  onUpdateContact: (id: string, updates: Partial<EmergencyContact>) => void;
  onDeleteContact: (id: string) => void;
}

export const EmergencyContactsView: React.FC<EmergencyContactsViewProps> = ({
  contacts,
  authorities,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [testSentId, setTestSentId] = useState<string | null>(null);

  // Add Contact Form State
  const [newName, setNewName] = useState('');
  const [newRelationship, setNewRelationship] = useState('Parent');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [receiveSms, setReceiveSms] = useState(true);
  const [receiveCall, setReceiveCall] = useState(true);

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    onAddContact({
      name: newName.trim(),
      relationship: newRelationship,
      phone: newPhone.trim(),
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '')}@guardian.org`,
      isPrimary,
      receiveSms,
      receiveCall,
      receiveLiveLocation: true,
    });

    // Reset
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setShowAddModal(false);
  };

  const handleSendTestPing = (contact: EmergencyContact) => {
    setTestSentId(contact.id);
    setTimeout(() => setTestSentId(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-md">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Emergency Guardians & Authorities
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Manage personal emergency contacts and official dispatch hotlines that receive live SOS alerts
              </p>
            </div>
          </div>

          <button
            id="btn-open-add-contact"
            onClick={() => setShowAddModal(true)}
            className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-rose-600/30"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Trusted Guardian</span>
          </button>
        </div>
      </div>

      {/* Grid: Guardians and Authorities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Personal Emergency Contacts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Trusted Personal Guardians</span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                {contacts.length} Active
              </span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Notified via instant SMS & Automated Voice Call
            </span>
          </div>

          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm">
                    {contact.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {contact.name}
                      </span>
                      {contact.isPrimary && (
                        <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                          PRIMARY GUARDIAN
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {contact.relationship} • <span className="font-mono text-slate-300">{contact.phone}</span>
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span className={`flex items-center gap-1 ${contact.receiveSms ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <CheckCircle2 className="h-3 w-3" />
                        <span>SMS Alerts</span>
                      </span>
                      <span className={`flex items-center gap-1 ${contact.receiveCall ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Phone Auto-Call</span>
                      </span>
                      <span className="flex items-center gap-1 text-sky-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Live GPS Stream</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleSendTestPing(contact)}
                    disabled={testSentId === contact.id}
                    className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
                    title="Send simulated test ping SMS to this contact"
                  >
                    <Send className="h-3.5 w-3.5 text-sky-400" />
                    <span>{testSentId === contact.id ? 'Test Sent!' : 'Test Alert'}</span>
                  </button>

                  <a
                    href={`tel:${contact.phone}`}
                    className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 p-2 text-slate-300 hover:text-white transition-colors"
                    title="Call Contact"
                  >
                    <Phone className="h-4 w-4" />
                  </a>

                  <button
                    onClick={() => onDeleteContact(contact.id)}
                    className="rounded-xl bg-slate-800 hover:bg-rose-900/40 border border-slate-700 p-2 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Remove Contact"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* SMS Notification Template Preview */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Automated SMS Dispatch Format Preview
            </h4>
            <div className="rounded-xl bg-slate-950 p-3 text-xs font-mono text-slate-300 border border-slate-800/80">
              "🚨 AEGIS EMERGENCY: Priya Sharma has triggered an SOS alert. Live location link: https://aegis-shield.live/track/sos-123. Battery: 86%. Authorities notified."
            </div>
          </div>
        </div>

        {/* Right Col: Authorities Hotlines */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span>Emergency Authorities Hotlines</span>
          </h3>

          <div className="space-y-3">
            {authorities.map((agency) => (
              <div
                key={agency.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-md space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {agency.name}
                    </h4>
                    <span className="text-[11px] font-mono text-rose-400 font-bold">
                      Hotline: {agency.phone}
                    </span>
                  </div>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase font-semibold text-slate-400">
                    {agency.agencyType.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-400">
                    24/7 Rapid Response Active
                  </span>
                  <a
                    href={`tel:${agency.phone}`}
                    className="rounded-lg bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    <span>Call Now</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">
              Automated Dispatch Protocol:
            </p>
            When an SOS alert is confirmed, Aegis Shield transmits your GPS coordinates, audio recording buffer, and medical dossier directly to nearest municipal dispatch.
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <UserPlus className="h-5 w-5 text-rose-400" />
                <span>Add Emergency Contact</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  id="input-new-contact-name"
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Maya Sharma"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Relationship
                  </label>
                  <select
                    value={newRelationship}
                    onChange={(e) => setNewRelationship(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                  >
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Sister">Sister</option>
                    <option value="Brother">Brother</option>
                    <option value="Partner">Partner</option>
                    <option value="Friend">Friend</option>
                    <option value="Colleague">Colleague</option>
                    <option value="Doctor">Doctor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    id="input-new-contact-phone"
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="guardian@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                  />
                  <span>Designate as Primary Guardian (First to be dialed)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={receiveSms}
                    onChange={(e) => setReceiveSms(e.target.checked)}
                    className="rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                  />
                  <span>Send Immediate SMS with Live GPS Tracking Link</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={receiveCall}
                    onChange={(e) => setReceiveCall(e.target.checked)}
                    className="rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                  />
                  <span>Initiate Automated Emergency Voice Dispatch Call</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-slate-700 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-new-contact"
                  type="submit"
                  className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 py-2.5 text-xs font-bold text-white transition-colors"
                >
                  Save Guardian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
