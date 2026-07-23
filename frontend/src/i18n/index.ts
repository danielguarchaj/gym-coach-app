import { createContext, useContext, useState, type ReactNode, createElement } from 'react'
import es from './es.json'
import en from './en.json'

type Locale = 'es' | 'en'

// Use es as canonical shape; en is a partial placeholder until translated
const catalogs: Record<Locale, Record<string, unknown>> = { es, en }

function resolve(obj: Record<string, unknown>, key: string): string {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part]
    return undefined
  }, obj) as string ?? key
}

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const stored = (localStorage.getItem('locale') as Locale) ?? 'es'
  const [locale, setLocaleState] = useState<Locale>(stored)

  function setLocale(l: Locale) {
    localStorage.setItem('locale', l)
    setLocaleState(l)
  }

  function t(key: string): string {
    return resolve(catalogs[locale] as unknown as Record<string, unknown>, key)
  }

  return createElement(I18nContext.Provider, { value: { locale, setLocale, t } }, children)
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used inside I18nProvider')
  return ctx
}
