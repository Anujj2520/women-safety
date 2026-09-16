import React, { useEffect, useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Radio, 
  Sparkles, 
  Volume2, 
  Info, 
  AlertCircle 
} from 'lucide-react';
import { SafetySettings } from '../types';
import { voiceTriggerService } from '../services/voiceService';

interface VoiceTriggerWidgetProps {
  settings: SafetySettings;
  onVoiceTriggered: (keyword: string) => void;
  onUpdateSettings: (newSettings: Partial<SafetySettings>) => void;
}

export const VoiceTriggerWidget: React.FC<VoiceTriggerWidgetProps> = ({
  settings,
  onVoiceTriggered,
  onUpdateSettings,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [lastHeardTranscript, setLastHeardTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState('Hands-free voice detection ready');
  const [detectedKeyword, setDetectedKeyword] = useState<string | null>(null);

  useEffect(() => {
    voiceTriggerService.setKeywords(settings.voiceKeywords);
  }, [settings.voiceKeywords]);

  const toggleListening = async () => {
    if (isListening) {
      voiceTriggerService.stopListening();
      setIsListening(false);
      setAudioLevel(0);
      setStatusMessage('Voice detection paused');
    } else {
      setStatusMessage('Requesting microphone permission...');
      const res = await voiceTriggerService.startListening(
        (keyword) => {
          setDetectedKeyword(keyword);
          setStatusMessage(`CRITICAL: Trigger phrase "${keyword.toUpperCase()}" detected! Activating SOS...`);
          onVoiceTriggered(keyword);
          setTimeout(() => setDetectedKeyword(null), 3500);
        },
        (transcript) => {
          setLastHeardTranscript(transcript);
        },
        (vol) => {
          setAudioLevel(vol);
        }
      );

      if (res.success) {
        setIsListening(true);
        setStatusMessage('Actively listening for distress keywords...');
      } else {
        setStatusMessage(res.message);
      }
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-lg">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
            isListening 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-md shadow-rose-500/20' 
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            {isListening ? <Mic className="h-4 w-4 animate-pulse" /> : <MicOff className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white tracking-tight">
                Voice-Activated Emergency Trigger
              </h4>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider ${
                isListening 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {isListening ? 'LISTENING LIVE' : 'STANDBY'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Hands-free SOS dispatch if your hands or phone are physically restrained
            </p>
          </div>
        </div>

        {/* Master Toggle */}
        <button
          id="btn-toggle-voice-trigger"
          onClick={toggleListening}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
            isListening
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          {isListening ? (
            <>
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              <span>Disable Mic</span>
            </>
          ) : (
            <>
              <Mic className="h-3.5 w-3.5 text-rose-400" />
              <span>Enable Hands-Free</span>
            </>
          )}
        </button>
      </div>

      {/* Visual Audio Waveform meter */}
      <div className="my-3 rounded-xl bg-slate-950 p-3 border border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Radio className={`h-3 w-3 ${isListening ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
            <span>{statusMessage}</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Signal: {audioLevel}%
          </span>
        </div>

        {/* Visual equalizer bars */}
        <div className="flex h-8 items-end gap-1 px-1">
          {Array.from({ length: 24 }).map((_, i) => {
            const heightMultiplier = isListening ? Math.max(15, (audioLevel * Math.sin(i + 1) + 25) % 100) : 10;
            return (
              <div
                key={i}
                style={{ height: `${heightMultiplier}%` }}
                className={`flex-1 rounded-full transition-all duration-75 ${
                  isListening
                    ? heightMultiplier > 60
                      ? 'bg-rose-500'
                      : heightMultiplier > 35
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                    : 'bg-slate-800'
                }`}
              />
            );
          })}
        </div>

        {lastHeardTranscript && isListening && (
          <div className="mt-2 text-[11px] text-slate-300 font-mono italic bg-slate-900/60 p-1.5 rounded border border-slate-800">
            Detected speech: "{lastHeardTranscript}"
          </div>
        )}
      </div>

      {/* Keywords Chips */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[11px] text-slate-400 font-medium mr-1">
          Trigger words:
        </span>
        {settings.voiceKeywords.map((kw) => (
          <span
            key={kw}
            className={`rounded-lg px-2 py-0.5 text-[11px] font-mono font-medium border transition-colors ${
              detectedKeyword === kw.toLowerCase()
                ? 'bg-rose-500 text-white border-rose-400 animate-bounce'
                : 'bg-slate-800/80 text-rose-300 border-rose-900/30'
            }`}
          >
            "{kw}"
          </span>
        ))}
        
        {/* Quick simulation button for testing */}
        <button
          onClick={() => {
            setDetectedKeyword('help');
            onVoiceTriggered('help');
            setTimeout(() => setDetectedKeyword(null), 3000);
          }}
          className="ml-auto text-[10px] text-slate-400 hover:text-white underline underline-offset-2 flex items-center gap-1"
        >
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span>Simulate "Help" Voice</span>
        </button>
      </div>
    </div>
  );
};
