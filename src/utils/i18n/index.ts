import { createSignal, createMemo } from 'solid-js';
import { zhCN } from './zh-CN';
import { en } from './en';

export type LanguageType = 'zh-CN' | 'en';

const [currentLang, setCurrentLangSignal] = createSignal<LanguageType>(
  (localStorage.getItem('trwm-lang') as LanguageType) || 'zh-CN'
);

const languages = {
  'zh-CN': zhCN,
  'en': en,
};

export { currentLang };

export function setLanguage(lang: LanguageType) {
  localStorage.setItem('trwm-lang', lang);
  setCurrentLangSignal(lang);
}

// Translate utility
export function t(keyPath: string, params?: Record<string, string | number>): string {
  const lang = currentLang();
  const dict = languages[lang] as any;
  
  if (!dict) return keyPath;

  const parts = keyPath.split('.');
  let current: any = dict;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      // Fallback to English if not found in active language
      let fallback: any = languages['en'];
      for (const fPart of parts) {
        if (fallback && typeof fallback === 'object' && fPart in fallback) {
          fallback = fallback[fPart];
        } else {
          return keyPath;
        }
      }
      current = fallback;
      break;
    }
  }

  if (typeof current !== 'string') {
    return keyPath;
  }

  let text = current;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }
  }

  return text;
}
