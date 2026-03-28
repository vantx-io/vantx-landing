'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

const dashboardIds = ['red', 'use', 'pg', 'k6', 'cwv', 'slo', 'faro', 'incidents'] as const
const dashboardPaths: Record<string, string> = {
  red: '/d/vantix-red/red-overview',
  use: '/d/vantix-use/use-metrics',
  pg: '/d/vantix-pg/postgresql',
  k6: '/d/vantix-k6/k6-results',
  cwv: '/d/vantix-cwv/web-vitals',
  slo: '/d/vantix-slo/slo-compliance',
  faro: '/d/vantix-faro/frontend-observability',
  incidents: '/d/vantix-incidents/incident-overview',
}
const dashboardColors: Record<string, string> = {
  red: '#1B6B4A', use: '#16A34A', pg: '#7C3AED', k6: '#B45309',
  cwv: '#DC2626', slo: '#1A1A17', faro: '#0D9488', incidents: '#E11D48',
}
const timeRangeValues = [
  { key: '1h', value: 'now-1h' },
  { key: '6h', value: 'now-6h' },
  { key: '24h', value: 'now-24h' },
  { key: '7d', value: 'now-7d' },
  { key: '30d', value: 'now-30d' },
  { key: 'custom', value: 'custom' },
]

export default function GrafanaPage() {
  const [activeId, setActiveId] = useState<string>('red')
  const [timeRange, setTimeRange] = useState('now-6h')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [testId, setTestId] = useState('')
  const grafanaUrl = process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://localhost:3001'
  const t = useTranslations('grafana')

  const isCustom = timeRange === 'custom'
  const from = isCustom && customFrom ? new Date(customFrom).getTime() : timeRange
  const to = isCustom && customTo ? new Date(customTo).getTime() : 'now'
  const activePath = dashboardPaths[activeId]
  const activeColor = dashboardColors[activeId]
  const activeName = t(`dashboards.${activeId}.name`)

  let iframeSrc = `${grafanaUrl}${activePath}?orgId=1&kiosk&theme=dark&from=${from}&to=${to}`
  if (testId.trim()) iframeSrc += `&var-testrun=${encodeURIComponent(testId.trim())}`

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-1">{t('title')}</h1>
      <p className="text-sm text-brand-muted mb-6">{t('subtitle')}</p>

      <div className="grid grid-cols-4 gap-2 mb-5">
        {dashboardIds.map(id => (
          <button key={id} onClick={() => setActiveId(id)}
            className={`text-left p-3 rounded-xl border transition ${
              activeId === id
                ? 'border-brand-accent bg-brand-accent/5 shadow-sm'
                : 'border-gray-200/60 bg-brand-surface hover:border-gray-300'
            }`}>
            <div className="flex gap-2 items-center mb-0.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dashboardColors[id] }} />
              <span className="text-[13px] font-semibold text-brand-dark truncate">{t(`dashboards.${id}.name`)}</span>
            </div>
            <p className="text-[11px] text-brand-muted truncate">{t(`dashboards.${id}.desc`)}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4 p-3 bg-brand-surface border border-gray-200/60 rounded-xl">
        <div className="flex items-center gap-1">
          {timeRangeValues.map(tr => (
            <button key={tr.key} onClick={() => setTimeRange(tr.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                timeRange === tr.value
                  ? 'bg-brand-accent text-white'
                  : 'text-brand-muted hover:bg-gray-100'
              }`}>
              {t(`time_ranges.${tr.key}`)}
            </button>
          ))}
        </div>

        {isCustom && (
          <div className="flex items-center gap-2 ml-2">
            <input type="datetime-local" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-brand-dark bg-white focus:outline-none focus:ring-1 focus:ring-brand-accent/30" />
            <span className="text-xs text-brand-muted">{t('date_separator')}</span>
            <input type="datetime-local" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-brand-dark bg-white focus:outline-none focus:ring-1 focus:ring-brand-accent/30" />
          </div>
        )}

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <div className="flex items-center gap-2">
          <label className="text-xs text-brand-muted whitespace-nowrap">{t('test_id')}</label>
          <input type="text" value={testId} onChange={e => setTestId(e.target.value)}
            placeholder="ej: run_2026-04-08_novapay"
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-brand-dark bg-white w-52 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/30" />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-200/60">
        <div className="flex items-center justify-between px-4 py-2.5 bg-brand-sidebar">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: activeColor }} />
            <span className="text-white text-sm font-semibold">{activeName}</span>
          </div>
          <a href={`${grafanaUrl}${activePath}?orgId=1`} target="_blank"
            className="text-xs text-brand-accent hover:underline">
            {t('open_in_grafana')}
          </a>
        </div>
        <iframe src={iframeSrc} width="100%" height="620" frameBorder="0"
          className="bg-[#0d1117]" title={activeName} />
      </div>
    </div>
  )
}
