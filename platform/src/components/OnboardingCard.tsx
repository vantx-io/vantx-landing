'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

interface Props {
  onDismiss: () => void
}

export function OnboardingCard({ onDismiss }: Props) {
  const t = useTranslations('portal')
  const locale = useLocale()
  const [dismissing, setDismissing] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  async function handleDismiss() {
    setDismissing(true)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ has_onboarded: true }),
      })
      setDismissed(true)
      setTimeout(() => {
        onDismiss()
      }, 300)
    } catch {
      // Silent fail — button re-enables, card stays visible
      setDismissing(false)
    }
  }

  return (
    <div
      className={`bg-brand-accent/[0.08] border border-brand-accent/20 rounded-xl p-6 mb-6 transition-opacity duration-300 ${dismissed ? 'opacity-0' : 'opacity-100'}`}
    >
      <h2 className="text-base font-semibold text-brand-dark">{t('onboarding_heading')}</h2>
      <p className="text-sm text-brand-muted mb-4">{t('onboarding_body')}</p>
      <div className="flex flex-col gap-2">
        <Link href={`/${locale}/portal/tasks`} className="text-sm text-brand-accent font-medium hover:underline">
          {t('onboarding_tasks')} &#8594;
        </Link>
        <Link href={`/${locale}/portal/tests`} className="text-sm text-brand-accent font-medium hover:underline">
          {t('onboarding_tests')} &#8594;
        </Link>
        <Link href={`/${locale}/portal/billing`} className="text-sm text-brand-accent font-medium hover:underline">
          {t('onboarding_billing')} &#8594;
        </Link>
        <Link href={`/${locale}/portal/settings`} className="text-sm text-brand-accent font-medium hover:underline">
          {t('onboarding_settings')} &#8594;
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        disabled={dismissing}
        className="px-4 py-2 mt-4 text-sm font-medium bg-brand-accent text-white rounded-lg hover:bg-brand-accent-hover transition min-h-[44px] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {dismissing && (
          <span className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin inline-block mr-2" />
        )}
        {t('onboarding_dismiss')}
      </button>
    </div>
  )
}
