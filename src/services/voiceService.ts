// Voice-activated trigger for hands-free emergency alerts

// TypeScript definitions for Web Speech API
interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

class VoiceTriggerService {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening = false;
  private audioStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private keywords: string[] = ['help', 'emergency', 'save me', 'sos', 'danger', 'alert', 'police'];
  private onTriggerCallback: ((keyword: string) => void) | null = null;
  private onTranscriptCallback: ((transcript: string) => void) | null = null;
  private onVolumeChangeCallback: ((volume: number) => void) | null = null;
  private animFrameId: number | null = null;

  setKeywords(words: string[]) {
    this.keywords = words.map(w => w.toLowerCase().trim()).filter(Boolean);
  }

  getKeywords(): string[] {
    return this.keywords;
  }

  isSupported(): boolean {
    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition || navigator.mediaDevices);
  }

  async startListening(
    onTrigger: (keyword: string) => void,
    onTranscript?: (transcript: string) => void,
    onVolumeChange?: (vol: number) => void
  ): Promise<{ success: boolean; message: string }> {
    if (this.isListening) {
      return { success: true, message: 'Already listening' };
    }

    this.onTriggerCallback = onTrigger;
    if (onTranscript) this.onTranscriptCallback = onTranscript;
    if (onVolumeChange) this.onVolumeChangeCallback = onVolumeChange;

    try {
      // 1. Setup Audio Volume Analyser for UI visual waveform feedback
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          this.audioCtx = new AudioCtxClass();
          const source = this.audioCtx.createMediaStreamSource(this.audioStream);
          this.analyser = this.audioCtx.createAnalyser();
          this.analyser.fftSize = 64;
          source.connect(this.analyser);

          const buffer = new Uint8Array(this.analyser.frequencyBinCount);
          const updateVolume = () => {
            if (!this.isListening || !this.analyser) return;
            this.analyser.getByteFrequencyData(buffer);
            let sum = 0;
            for (let i = 0; i < buffer.length; i++) {
              sum += buffer[i];
            }
            const avg = sum / buffer.length;
            const normalized = Math.min(100, Math.round((avg / 128) * 100));
            this.onVolumeChangeCallback?.(normalized);
            this.animFrameId = requestAnimationFrame(updateVolume);
          };
          this.animFrameId = requestAnimationFrame(updateVolume);
        } catch (streamErr) {
          console.warn('Microphone stream access notice:', streamErr);
        }
      }

      // 2. Setup Speech Recognition
      const win = window as unknown as {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };
      const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

      if (SpeechRec) {
        this.recognition = new SpeechRec();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: SpeechRecognitionEventLike) => {
          let fullTranscript = '';
          for (let i = 0; i < Object.keys(event.results).length; i++) {
            const transcript = event.results[i]?.[0]?.transcript || '';
            fullTranscript += ' ' + transcript;
          }

          const cleaned = fullTranscript.toLowerCase();
          this.onTranscriptCallback?.(cleaned.trim());

          // Keyword check
          for (const keyword of this.keywords) {
            if (cleaned.includes(keyword)) {
              console.log(`Voice trigger detected keyword: "${keyword}"`);
              this.onTriggerCallback?.(keyword);
              break;
            }
          }
        };

        this.recognition.onerror = (e) => {
          console.warn('SpeechRecognition error:', e);
        };

        this.recognition.onend = () => {
          // Restart if still intended to be listening
          if (this.isListening && this.recognition) {
            try {
              this.recognition.start();
            } catch {
              // Ignore restart collision
            }
          }
        };

        this.recognition.start();
      }

      this.isListening = true;
      return { success: true, message: 'Voice detection active. Speak keywords to trigger SOS.' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Microphone access denied or unsupported';
      this.isListening = false;
      return { success: false, message: errorMsg };
    }
  }

  stopListening() {
    this.isListening = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // Ignored
      }
      this.recognition = null;
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.analyser = null;
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

export const voiceTriggerService = new VoiceTriggerService();
