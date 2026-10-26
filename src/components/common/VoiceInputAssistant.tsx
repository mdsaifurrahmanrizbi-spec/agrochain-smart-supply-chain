import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Languages, Mic, MicOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

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
type VoiceField = { element: HTMLInputElement | HTMLTextAreaElement; rect: DOMRect };

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const isVoiceEditable = (element: Element): element is HTMLInputElement | HTMLTextAreaElement => {
  if (element instanceof HTMLTextAreaElement) {
    return !element.disabled && !element.readOnly && element.getAttribute('aria-hidden') !== 'true';
  }
  if (!(element instanceof HTMLInputElement)) return false;
  if (element.disabled || element.readOnly || element.getAttribute('aria-hidden') === 'true') return false;
  return ['text', 'search', 'tel', 'url', 'email'].includes(element.type);
};

const fieldKey = (element: HTMLInputElement | HTMLTextAreaElement) => {
  if (!element.dataset.voiceFieldId) {
    element.dataset.voiceFieldId = `voice-${Math.random().toString(36).slice(2)}`;
  }
  return element.dataset.voiceFieldId;
};

export const VoiceInputAssistant: React.FC = () => {
  const { language: appLanguage, voiceLocale } = useLanguage();
  const [fields, setFields] = useState<VoiceField[]>([]);
  const [activeField, setActiveField] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [language, setLanguage] = useState<VoiceLanguage>('en-US');
  const [isListening, setIsListening] = useState(false);
  const [notice, setNotice] = useState('');
  const [interimText, setInterimText] = useState('');
  const [panelField, setPanelField] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const activeFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => { setLanguage(voiceLocale); }, [voiceLocale]);

  const refreshFields = useCallback(() => {
    const next: VoiceField[] = Array.from(document.querySelectorAll('input, textarea'))
      .filter((element): element is HTMLInputElement | HTMLTextAreaElement => isVoiceEditable(element))
      .filter((element) => !element.closest('[data-voice-assistant-ignore]'))
      .map((element) => {
        if (!element.dataset.voicePaddingApplied) {
          element.dataset.voiceOriginalPaddingRight = element.style.paddingRight;
          const computedPadding = Number.parseFloat(window.getComputedStyle(element).paddingRight) || 0;
          element.style.paddingRight = `${computedPadding + 34}px`;
          element.dataset.voicePaddingApplied = 'true';
        }
        return { element, rect: element.getBoundingClientRect() };
      })
      .filter(({ element, rect }) => {
        if (rect.width <= 0 || rect.height <= 0) return false;
        // Do not leave a microphone floating over a sticky header when its
        // input has scrolled underneath that header. Only show the control
        // when the input itself is actually visible at its center point.
        const x = Math.min(window.innerWidth - 1, Math.max(0, rect.left + Math.min(24, rect.width / 2)));
        const y = Math.min(window.innerHeight - 1, Math.max(0, rect.top + rect.height / 2));
        if (rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) return false;
        const topElement = document.elementFromPoint(x, y);
        return topElement === element || (topElement !== null && element.contains(topElement));
      });
    setFields(next);
  }, []);

  useEffect(() => {
    let frame = 0;
    const scheduleRefresh = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(refreshFields);
    };
    refreshFields();
    const observer = new MutationObserver(scheduleRefresh);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'readonly', 'type', 'aria-hidden'] });
    window.addEventListener('resize', scheduleRefresh);
    window.addEventListener('scroll', scheduleRefresh, true);
    const timer = window.setInterval(scheduleRefresh, 1200);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', scheduleRefresh);
      window.removeEventListener('scroll', scheduleRefresh, true);
      window.clearInterval(timer);
      if (frame) cancelAnimationFrame(frame);
      recognitionRef.current?.abort();
      document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-voice-padding-applied="true"]').forEach((element) => {
        element.style.paddingRight = element.dataset.voiceOriginalPaddingRight || '';
        delete element.dataset.voicePaddingApplied;
        delete element.dataset.voiceOriginalPaddingRight;
      });
    };
  }, [refreshFields]);

  const insertTranscript = useCallback((transcript: string) => {
    const element = activeFieldRef.current;
    if (!element || !element.isConnected || element.disabled || element.readOnly) return;
    const start = typeof element.selectionStart === 'number' ? element.selectionStart : element.value.length;
    const end = typeof element.selectionEnd === 'number' ? element.selectionEnd : element.value.length;
    const before = element.value.slice(0, start);
    const after = element.value.slice(end);
    const needsSpace = before.length > 0 && !/\\s$/.test(before) && !/^\\s/.test(transcript);
    const inserted = (needsSpace ? ' ' : '') + transcript;
    const value = before + inserted + after;
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (setter) setter.call(element, value);
    else element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    try {
      const cursor = start + inserted.length;
      element.setSelectionRange(cursor, cursor);
    } catch {
      // Some text input types do not support selection APIs.
    }
    setNotice('Text যোগ হয়েছে। Edit করে submit করতে পারো।');
    refreshFields();
  }, [refreshFields]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText('');
  }, []);

  const startListening = useCallback((element: HTMLInputElement | HTMLTextAreaElement) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setNotice('এই browser voice recognition support করে না। Latest Chrome বা Edge ব্যবহার করুন।');
      return;
    }
    activeFieldRef.current = element;
    setActiveField(element);
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) finalText += transcript;
        else interim += transcript;
      }
      setInterimText(interim);
      if (finalText.trim()) insertTranscript(finalText.trim());
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      setInterimText('');
      const messages: Record<string, string> = {
        'not-allowed': 'Microphone permission দিন, তারপর আবার চেষ্টা করুন.',
        'service-not-allowed': 'Browser microphone access অনুমোদন করছে না.',
        'no-speech': 'কোনো কথা শনাক্ত হয়নি। আবার চেষ্টা করুন.',
        'audio-capture': 'Microphone পাওয়া যাচ্ছে না। Device পরীক্ষা করুন.',
        network: 'Voice recognition service-এ সমস্যা হয়েছে। Internet পরীক্ষা করুন.',
      };
      setNotice(messages[event.error] || 'Voice recognition বন্ধ হয়েছে। আবার চেষ্টা করুন.');
    };
    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };
    recognitionRef.current?.abort();
    recognitionRef.current = recognition;
    setNotice(language === 'bn-BD' ? 'বাংলায় বলুন…' : 'Speak in English…');
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setNotice('Microphone চালু করা যায়নি। আবার চেষ্টা করুন.');
    }
  }, [insertTranscript, language]);

  return (
    <>
      {fields.map(({ element, rect }) => {
        const key = fieldKey(element);
        const isPanelOpen = panelField === element;
        // Track the field's current viewport position. This also keeps the mic
        // aligned with inputs inside sticky headers while the page scrolls.
        const left = rect.right - 35;
        const top = rect.top + Math.max(0, (rect.height - 30) / 2);
        return createPortal(
          <React.Fragment key={key}>
            <button
              type="button"
              data-voice-assistant
              aria-label="এই field-এ voice দিয়ে লিখুন"
              title="Voice to text"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setPanelField((current) => current === element ? null : element);
                setNotice('');
                setActiveField(element);
                activeFieldRef.current = element;
              }}
              style={{ position: 'fixed', top, left, zIndex: 80, width: 30, height: 30 }}
              className={`flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 ${isListening && activeField === element ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
            >
              <Mic className="h-[17px] w-[17px]" />
            </button>
            {isPanelOpen && createPortal(
              <section data-voice-assistant-ignore style={{ position: 'fixed', top: Math.max(8, rect.top - 8), left: Math.max(8, left - 265), transform: 'translateY(-100%)', zIndex: 90, width: 'min(300px, calc(100vw - 24px))' }} className="rounded-xl border border-emerald-100 bg-white p-3 shadow-xl">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Languages className="h-4 w-4 text-emerald-700" /> {appLanguage === 'bn' ? 'ভয়েস ইনপুট' : 'Voice input'}
                  <select aria-label="Voice language" value={language} disabled={isListening} onChange={(event) => setLanguage(event.target.value as VoiceLanguage)} className="ml-auto rounded-md border border-slate-200 bg-white px-2 py-1 text-xs">
                    <option value="bn-BD">বাংলা</option>
                    <option value="en-US">English</option>
                  </select>
                </div>
                <p className="mb-2 text-xs text-slate-600">{appLanguage === 'bn' ? 'এই ঘরে কথা বলুন। পরে লেখাটি সম্পাদনা করতে পারবেন।' : 'Speak into this field. You can edit the text afterward.'}</p>
                {interimText && <p className="mb-2 rounded bg-emerald-50 p-2 text-xs text-emerald-900">{interimText}</p>}
                {notice && <p role="status" aria-live="polite" className="mb-2 text-xs text-slate-600">{notice}</p>}
                <div className="flex gap-2">
                  {!isListening ? (
                    <button type="button" onClick={() => startListening(element)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"><Mic className="h-4 w-4" /> {appLanguage === 'bn' ? 'কথা বলা শুরু করুন' : 'Start speaking'}</button>
                  ) : (
                    <button type="button" onClick={stopListening} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"><MicOff className="h-4 w-4" /> {appLanguage === 'bn' ? 'থামুন' : 'Stop'}</button>
                  )}
                  <button type="button" onClick={() => { stopListening(); setPanelField(null); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">{appLanguage === 'bn' ? 'বন্ধ করুন' : 'Close'}</button>
                </div>
                <p className="mt-2 text-[10px] leading-4 text-slate-400">{appLanguage === 'bn' ? 'ব্রাউজার সমর্থন ও মাইক্রোফোনের অনুমতি প্রয়োজন।' : 'Browser support and microphone permission required.'}</p>
              </section>,
              document.body
            )}
          </React.Fragment>,
          document.body
        );
      })}
    </>
  );
};
