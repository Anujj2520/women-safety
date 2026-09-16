import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  Lock, 
  Mail, 
  ArrowRight, 
  Check, 
  Sparkles,
  User,
  ShieldAlert
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (provider: 'google' | 'apple' | 'email', name?: string, email?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleOAuthClick = (provider: 'google' | 'apple') => {
    setIsProcessing(true);
    // Simulate OAuth handshake
    setTimeout(() => {
      setIsProcessing(false);
      onLoginSuccess(
        provider,
        provider === 'google' ? 'Priya Sharma' : 'Priya Apple-ID',
        provider === 'google' ? 'priya.sharma@safenet.org' : 'priya.apple@icloud.com'
      );
      onClose();
    }, 600);
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onLoginSuccess(
        'email',
        nameInput.trim() || emailInput.split('@')[0],
        emailInput.trim()
      );
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-lg shadow-rose-500/20">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {authMode === 'login' ? 'Secure Guardian Access' : 'Create Safety Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            OAuth-protected emergency dispatch credentials & encrypted GPS telemetry
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <button
            id="btn-oauth-google"
            onClick={() => handleOAuthClick('google')}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800/80 px-4 py-3 text-xs font-bold text-white transition-all shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.1-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
            <span>{isProcessing ? 'Authenticating...' : 'Continue with Google OAuth'}</span>
          </button>

          <button
            id="btn-oauth-apple"
            onClick={() => handleOAuthClick('apple')}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800/80 px-4 py-3 text-xs font-bold text-white transition-all shadow-sm"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.8c.62-.77 1.05-1.84.93-2.91-1 .04-2.17.67-2.82 1.44-.57.67-1.07 1.77-.94 2.82 1.12.09 2.21-.58 2.83-1.35z" />
            </svg>
            <span>Continue with Apple ID</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-slate-900 px-3 text-slate-500 font-bold tracking-wider">
              Or email magic link
            </span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          {authMode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Your Name
              </label>
              <input
                id="input-auth-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Priya Sharma"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <input
              id="input-auth-email"
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="you@safenet.org"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
            />
          </div>

          <button
            id="btn-submit-email-auth"
            type="submit"
            disabled={isProcessing}
            className="w-full rounded-xl bg-rose-600 hover:bg-rose-500 py-3 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
          >
            <span>{authMode === 'login' ? 'Sign In Securely' : 'Create Free Account'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Quick Demo Personas */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2 text-center">
            Instant Test Profile Sign-in:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onLoginSuccess('google', 'Priya Sharma (Protected User)', 'priya.sharma@safenet.org');
                onClose();
              }}
              className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-left hover:border-slate-700 transition-colors"
            >
              <div className="text-xs font-bold text-rose-300 flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>Priya (User)</span>
              </div>
              <div className="text-[10px] text-slate-400">Emergency Holder</div>
            </button>

            <button
              onClick={() => {
                onLoginSuccess('google', 'Sunita Sharma (Guardian)', 'sunita.guardian@family.net');
                onClose();
              }}
              className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-left hover:border-slate-700 transition-colors"
            >
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                <span>Sunita (Guardian)</span>
              </div>
              <div className="text-[10px] text-slate-400">Trusted Cloud Monitor</div>
            </button>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="mt-4 text-center text-xs text-slate-400">
          {authMode === 'login' ? (
            <span>
              Don't have a safety profile?{' '}
              <button
                onClick={() => setAuthMode('signup')}
                className="font-bold text-rose-400 hover:text-rose-300"
              >
                Sign Up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => setAuthMode('login')}
                className="font-bold text-rose-400 hover:text-rose-300"
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
