'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { Service } from '@/lib/types'
import { SkeletonText } from '@/components/skeletons'
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary'

const catIcons: Record<string, string> = { core: '🔵', addon: '🟢', training: '📚' }

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [market, setMarket] = useState<'LATAM' | 'US'>('LATAM')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const t = useTranslations('services')
  const tc = useTranslations('common')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('users').select('client_id').eq('id', user.id).single()
        if (profile?.client_id) {
          const { data: client } = await supabase.from('clients').select('market').eq('id', profile.client_id).single()
          if (client) setMarket(client.market as 'LATAM' | 'US')
        }
      }
      const { data } = await supabase.from('services').select('*').order('sort_order')
      if (data) setServices(data as Service[])
    }
    load().finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div>
      <div className="h-8 bg-gray-200 rounded w-48 mb-1 animate-pulse" />
      <div className="h-4 bg-gray-100 rounded w-72 mb-6 animate-pulse" />
      <SkeletonText lines={3} className="mb-8" />
      <SkeletonText lines={3} className="mb-8" />
      <SkeletonText lines={3} />
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-1">{t('title')}</h1>
      <p className="text-sm text-gray-500 mb-6">{t('subtitle', { market })}</p>
      <SectionErrorBoundary fallbackTitle={tc('error_section')} fallbackBody={tc('error_section_body')} fallbackRetry={tc('error_retry')}>
        {(['core', 'addon', 'training'] as const).map(cat => {
          const catServices = services.filter(s => s.category === cat)
          if (catServices.length === 0) return null
          return (
            <div key={cat} className="mb-8">
              <h2 className="text-lg font-bold text-brand-dark mb-3">{catIcons[cat]} {t(`categories.${cat}`)}</h2>
              <div className="grid grid-cols-3 gap-3">
                {catServices.map(svc => (
                  <div key={svc.id} className={`bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition flex flex-col ${!svc.is_active ? 'opacity-70' : ''}`} style={{position:'relative'}}>
                    {!svc.is_active && <span className="absolute top-3 right-3 bg-orange-50 text-brand-orange px-2 py-0.5 rounded-full text-[10px] font-semibold">{t('coming_soon')}</span>}
                    <div className="text-[15px] font-bold text-brand-dark mb-1">{svc.name}</div>
                    <div className="text-[13px] text-gray-500 mb-4 flex-1 leading-relaxed">{svc.short_description}</div>
                    {svc.features && (
                      <div className="mb-4">
                        {(svc.features as any[]).slice(0, 4).map((f, i) => (
                          <div key={i} className="flex gap-1.5 text-xs text-gray-600 mb-1">
                            <span className="text-brand-green">✓</span> {f.text}
                          </div>
                        ))}
                        {(svc.features as any[]).length > 4 && <div className="text-xs text-gray-400">{t('more_features', { count: (svc.features as any[]).length - 4 })}</div>}
                      </div>
                    )}
                    <div className="text-xl font-bold font-mono text-brand-accent mb-3">
                      ${(market === 'LATAM' ? svc.price_latam : svc.price_us)?.toLocaleString()}
                      <span className="text-xs text-gray-400 font-normal">{svc.is_recurring ? '/mo' : ''}</span>
                    </div>
                    {svc.delivery_days && <div className="text-xs text-gray-400 mb-3">⏱ {t('delivery_days', { days: svc.delivery_days })}</div>}
                    <button className={`w-full py-2 rounded-lg text-sm font-semibold transition ${svc.is_active ? 'bg-brand-accent text-white hover:bg-brand-accent/90' : 'bg-gray-100 text-gray-500 cursor-not-allowed'}`}>
                      {svc.is_active ? t('request') : t('coming_soon_btn')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </SectionErrorBoundary>
    </div>
  )
}
