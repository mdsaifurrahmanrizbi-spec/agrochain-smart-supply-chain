import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Languages, Mic, MicOff, X } from 'lucide-react';

type SpeechAlternative = { transcript: string };
type SpeechResult = { isFinal: boolean; length: number; [index: number]: SpeechAlternative };
type SpeechResultList = { length: number; [index: number]: SpeechResult };
type SpeechRecognitionEventLike = { resultIndex: number; results: SpeechResultList };
type SpeechRecognitionErrorLike = { error: string };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type VoiceLanguage = 'bn-BD' | 'en-US';

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const isVoiceEditable = (element: EventTarget | Element | null): element is HTMLInputElement | HTMLTextAreaElement => {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return false;
  if (element.disabled || element.readOnly || element.getAttribute('aria-hidden') === 'true') return false;
  if (element instanceof HTMLTextAreaElement) return true;
  return ['text', 'search', 'tel', 'url', 'email'].includes(element.type);
};

export const VoiceInputAssistant: React.FC = () => {
  const [target, setTarget] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<VoiceLanguage>('bn-BD');
  const [interimText, setInterimText] = useState('');
  const [notice, setNotice] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const targetRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const listeningRef = useRef(false);

  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const element = event.target;
      if (isVoiceEditable(element)) {
        targetRef.current = element;
        setTarget(element);
        setNotice('');
      } else if (element instanceof HTMLElement && !element.closest('[data-voice-assistant]')) {
        // Keep the last editable field available when the user opens the floating microphone.
      }
    };
    const onSelectionChange = () => {
      const active = document.activeElement;
      if (isVoiceEditable(active)) {
        targetRef.current = active;
        setTarget(active);
      }
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('selectionchange', onSelectionChange);
      listeningRef.current = false;
      recognitionRef.current?.abort();
    };
  }, []);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    setIsListening(false);
    recognitionRef.current?.stop();
  }, []);

  const insertTranscript = useCallback((transcript: string) => {
    const element = targetRef.current;
    if (!element || !element.isConnected || element.disabled || element.readOnly) {
      setNotice('আগে যে text field-এ লিখতে চান, সেটিতে ক্লিক করুন।');
      return;
    }

    const start = typeof element.selectionStart === 'number' ? element.selectionStart : element.value.length;
    const end = typeof element.selectionEnd === 'number' ? element.selectionEnd : element.value.length;
    const before = element.value.slice(0, start);
    const after = element.value.slice(end);
    const needsSpace = before.length > 0 && !/\s$/.test(before) && !/^\s/.test(transcript);
    const inserted = (needsSpace ? ' ' : '') + transcript;
    const nextValue = before + inserted + after;
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (setter) setter.call(element, nextValue);
    else element.value = nextValue;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    const cursor = start + inserted.length;
    try { element.setSelectionRange(cursor, cursor); } catch { /* Some input types do not expose a text selection. */ }
    setNotice('Voice text যোগ হয়েছে—চাইলে edit করে submit করুন।');
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setNotice('এই browser-এ voice recognition support নেই। Chrome বা Edge-এর latest version ব্যবহার করুন।');
      setIsOpen(true);
      return;
    }
    const activeTarget = targetRef.current;
    if (!activeTarget || !activeTarget.isConnected) {
      setNotice('প্রথমে একটি text field-এ ক্লিক করুন, তারপর microphone চাপুন।');
      setIsOpen(true);
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) finalText += text;
        else interim += text;
      }
      setInterimText(interim);
      if (finalText.trim()) insertTranscript(finalText.trim());
    };
    recognition.onerror = (event) => {
      listeningRef.current = false;
      setIsListening(false);
      setInterimText('');
      const messages: Record<string, string> = {
        'not-allowed': 'Microphone permission দিন, তারপর আবার চেষ্টা করুন।',
        'service-not-allowed': 'Browser microphone access অনুমোদন করছে না। Site permission পরীক্ষা করুন।',
        'no-speech': 'কোনো কথা শনাক্ত হয়নি। আবার চেষ্টা করুন।',
        'audio-capture': 'Microphone পাওয়া যাচ্ছে না। Device connection পরীক্ষা করুন।',
        network: 'Voice recognition service-এ সমস্যা হয়েছে। Internet সংযোগ পরীক্ষা করুন।',
      };
      setNotice(messages[event.error] || 'Voice recognition বন্ধ হয়েছে। আবার চেষ্টা করুন।');
    };
    recognition.onend = () => {
      listeningRef.current = false;
      setIsListening(false);
      setInterimText('');
    };
    recognitionRef.current = recognition;
    listeningRef.current = true;
    setIsListening(true);
    setIsOpen(true);
    setNotice(language === 'bn-BD' ? 'বাংলায় বলুন…' : 'Speak in English…');
    try {
      recognition.start();
    } catch {
      listeningRef.current = false;
      setIsListening(false);
      setNotice('Microphone চালু করা যায়নি। আবার চেষ্টা করুন।');
    }
  }, [insertTranscript, language]);

  if (!target && !isOpen) return null;

  return (
    <div data-voice-assistant className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-2 print:hidden">
      {isOpen && (
        <section className="w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-3 bg-emerald-800 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full ${isListening ? 'bg-rose-500' : 'bg-white/15'}`}>
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </span>
              <div>
                <p className="text-sm font-bold">AgroChain Voice Input</p>
                <p className="text-[11px] text-emerald-100">বাংলা ও English</p>
              </div>
            </div>
            <button type="button" onClick={() => { stopListening(); setIsOpen(false); }} aria-label="Close voice input" className="rounded-lg p-1.5 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3 p-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Languages className="h-4 w-4 text-emerald-700" />
              Voice language
              <select value={language} disabled={isListening} onChange={(event) => setLanguage(event.target.value as VoiceLanguage)} className="ml-auto rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs">
                <option value="bn-BD">বাংলা</option>
                <option value="en-US">English</option>
              </select>
            </label>
            <p className="text-xs leading-5 text-slate-600">যে text field-এ লিখতে চান, সেটিতে ক্লিক করে microphone চাপুন। কথা শেষ হলে Stop করুন; text edit করে তারপর submit করুন।</p>
            {interimText && <div className="rounded-lg bg-emerald-50 p-2 text-xs text-emerald-900"><span className="font-semibold">শুনছি: </span>{interimText}</div>}
            {notice && <p role="status" aria-live="polite" className="rounded-lg bg-slate-50 p-2 text-xs leading-5 text-slate-600">{notice}</p>}
            <div className="flex gap-2">
              {!isListening ? (
                <button type="button" onClick={startListening} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800">
                  <Mic className="h-4 w-4" /> Start speaking
                </button>
              ) : (
                <button type="button" onClick={stopListening} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">
                  <MicOff className="h-4 w-4" /> Stop listening
                </button>
              )}
            </div>
            <p className="text-[10px] leading-4 text-slate-400">Voice recognition depends on browser support and internet access. Microphone permission is required.</p>
          </div>
        </section>
      )}
      <button type="button" onClick={() => setIsOpen((value) => !value)} aria-label="Open AgroChain voice input" title="Voice to text" className="flex h-12 items-center gap-2 rounded-full bg-emerald-700 px-4 text-sm font-bold text-white shadow-lg ring-4 ring-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400">
        <Mic className="h-5 w-5" />
        <span>Voice to Text</span>
      </button>
    </div>
  );
};
