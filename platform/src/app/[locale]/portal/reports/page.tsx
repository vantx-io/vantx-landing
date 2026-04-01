'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { Report } from '@/lib/types'
import { SkeletonText } from '@/components/skeletons'
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary'

const typeIcons: Record<string, string> = { checkup: '🔍', monthly: '📊', weekly: '📋', evaluation: '⚡', incident_rca: '🚨', capacity_plan: '📈' }

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const t = useTranslations('reports')
  const tc = useTranslations('common')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('users').select('client_id').eq('id', user.id).single()
      if (!profile?.client_id) return
      const { data } = await supabase.from('reports').select('*').eq('client_id', profile.client_id).order('published_at', { ascending: false })
      if (data) setReports(data as Report[])
    }
    load().finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div>
      <div className="h-8 bg-gray-200 rounded w-40 mb-6 animate-pulse" />
      <SkeletonText lines={4} />
    </div>
  )

  const filtered = filter === 'all' ? reports : reports.filter(r => r.type === filter)
  const filters: [string, string][] = [
    ['all', t('filters.all')],
    ['monthly', t('filters.monthly')],
    ['weekly', t('filters.weekly')],
    ['checkup', t('filters.checkup')],
    ['evaluation', t('filters.evaluation')],
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-6">{t('title')}</h1>
      <div className="flex gap-2 mb-5">
        {filters.map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition ${
              filter === k ? 'border-brand-accent bg-blue-50 text-brand-accent font-bold' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
            {v}
          </button>
        ))}
      </div>
      <SectionErrorBoundary fallbackTitle={tc('error_section')} fallbackBody={tc('error_section_body')} fallbackRetry={tc('error_retry')}>
        {filtered.map(r => (
          <div key={r.id} className="bg-white rounded-xl px-5 py-4 border border-gray-100 mb-2.5 flex justify-between items-center hover:shadow-sm transition">
            <div className="flex gap-3 items-center">
              <span className="text-2xl">{typeIcons[r.type] || '📄'}</span>
              <div>
                <div className="text-[14px] font-semibold text-brand-dark">{r.title}</div>
                <div className="text-[12px] text-gray-400">{r.period} · {r.published_at?.slice(0, 10)}</div>
              </div>
            </div>
            <div className="flex gap-2">
              {r.loom_url && <a href={r.loom_url} target="_blank" className="px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] hover:bg-gray-50 transition">🎥 {t('watch_video')}</a>}
              <a href={r.file_url} className="px-3 py-1.5 rounded-lg bg-brand-accent text-white text-[12px] font-semibold hover:bg-brand-accent/90 transition">
                ⬇ {r.file_type.toUpperCase()}
              </a>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-gray-400 text-center py-12">{t('empty')}</p>}
      </SectionErrorBoundary>
    </div>
  )
}
