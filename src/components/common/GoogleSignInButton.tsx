import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void; ux_mode?: 'popup'; auto_select?: boolean }) => void;
          renderButton: (element: HTMLElement, options: Record<string, string | number | boolean>) => void;
          cancel: () => void;
        };
      };
    };
  }
}

type Props = {
  mode: 'signin' | 'signup';
  buttonText?: 'signin_with' | 'continue_with';
  language: 'en' | 'bn';
  disabled?: boolean;
  onCredential: (credential: string) => Promise<void>;
  onError: (message: string) => void;
};

const messages = {
  en: { loading: 'Loading Google…', unavailable: 'Google sign-in is not configured. Please use email and password.', network: 'Google sign-in could not connect. Check your internet and try again.', cancelled: 'Google sign-in was cancelled. Please try again.' },
  bn: { loading: 'Google চালু হচ্ছে…', unavailable: 'Google sign-in সেটআপ করা নেই। ইমেইল ও পাসওয়ার্ড ব্যবহার করুন।', network: 'Google sign-in সংযোগ করা যায়নি। ইন্টারনেট পরীক্ষা করে আবার চেষ্টা করুন।', cancelled: 'Google sign-in বাতিল হয়েছে। আবার চেষ্টা করুন।' },
};

export const GoogleSignInButton: React.FC<Props> = ({ mode, buttonText, language, disabled = false, onCredential, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const credentialHandlerRef = useRef(onCredential);
  const errorHandlerRef = useRef(onError);
  credentialHandlerRef.current = onCredential;
  errorHandlerRef.current = onError;
  const [loading, setLoading] = useState(true);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    let cancelled = false;
    const target = containerRef.current;
    if (!target) return;
    if (!clientId) {
      setLoading(false);
      errorHandlerRef.current(messages[language].unavailable);
      return;
    }

    const render = () => {
      if (cancelled || !target || !window.google?.accounts?.id) return;
      target.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: clientId,
        ux_mode: 'popup',
        callback: (response) => {
          if (!response.credential) {
            errorHandlerRef.current(messages[language].cancelled);
            return;
          }
          void credentialHandlerRef.current(response.credential).catch((error: unknown) => {
            const message = error instanceof Error ? error.message : '';
            if (language === 'bn') {
              if (/Please sign in with your email and password|not available for this role/i.test(message)) errorHandlerRef.current('এই ভূমিকার জন্য Google ব্যবহার করা যাবে না। ইমেইল ও পাসওয়ার্ড দিয়ে সাইন ইন করুন।');
              else if (/verified|email/i.test(message)) errorHandlerRef.current('Google ইমেইল যাচাই করা যায়নি। যাচাইকৃত Google অ্যাকাউন্ট ব্যবহার করুন।');
              else if (/cancel|popup|closed/i.test(message)) errorHandlerRef.current(messages.bn.cancelled);
              else errorHandlerRef.current(messages.bn.network);
            } else {
              if (message) errorHandlerRef.current(message);
              else errorHandlerRef.current(messages.en.network);
            }
          });
        },
      });
      const buttonWidth = Math.min(320, Math.floor(target.getBoundingClientRect().width || 320));
      window.google.accounts.id.renderButton(target, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: mode === 'signup' ? 'signup_with' : (buttonText || 'continue_with'),
        shape: 'rect',
        logo_alignment: 'left',
        width: buttonWidth,
        locale: language === 'bn' ? 'bn' : 'en',
      });
      setLoading(false);
    };

    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity-services="true"]');
    if (window.google?.accounts?.id) {
      render();
    } else if (existing) {
      existing.addEventListener('load', render, { once: true });
      existing.addEventListener('error', () => { if (!cancelled) { setLoading(false); errorHandlerRef.current(messages[language].network); } }, { once: true });
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentityServices = 'true';
      script.onload = render;
      script.onerror = () => { if (!cancelled) { setLoading(false); onError(messages[language].network); } };
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (target) target.replaceChildren();
    };
  }, [clientId, language, mode]);

  return (
    <div className="flex w-full justify-center">
      {loading && <div className="mb-2 text-center text-xs text-slate-500" role="status">{messages[language].loading}</div>}
      <div ref={containerRef} className={disabled ? 'pointer-events-none w-full max-w-[320px] opacity-60' : 'w-full max-w-[320px]'} aria-label={mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'} />
    </div>
  );
};
