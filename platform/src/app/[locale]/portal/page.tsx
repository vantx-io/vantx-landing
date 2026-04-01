'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { MonthlyMetrics, WeeklyMetrics, Report, Task } from '@/lib/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { SkeletonCard, SkeletonText, SkeletonChart } from '@/components/skeletons'
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary'
import { OnboardingCard } from '@/components/OnboardingCard'

function MetricCard({ label, value, unit, prev, good, vsPrev }: { label: string; value: number; unit: string; prev?: number; good?: 'up' | 'down'; vsPrev: string }) {
  const delta = prev ? ((value - prev) / prev * 100).toFixed(1) : null
  const isGood = good === 'up' ? value >= (prev || 0) : value <= (prev || Infinity)
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 flex-1 min-w-[160px]">
      <div className="text-xs text-gray-500 font-semibold tracking-wide mb-2">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-brand-dark font-mono">{value}</span>
        <span className="text-sm text-gray-400">{unit}</span>
      </div>
      {delta && (
        <div className={`text-xs mt-1.5 font-semibold ${isGood ? 'text-brand-green' : 'text-brand-red'}`}>
          {isGood ? '↑' : '↓'} {Number(delta) > 0 ? '+' : ''}{delta}% {vsPrev}
        </div>
      )}
    </div>
  )
}

function Badge({ text, color }: { text: string; color: string }) {
  return <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: color + '18', color }}>{text}</span>
}

const priorityColors: Record<string, string> = { critical: '#C0392B', high: '#E67E22', medium: '#2E75B6', low: '#999' }
const statusColors: Record<string, string> = { open: '#2E75B6', in_progress: '#E67E22', completed: '#27AE60', waiting_client: '#8E44AD' }

export default function DashboardPage() {
  const [current, setCurrent] = useState<MonthlyMetrics | null>(null)
  const [previous, setPrevious] = useState<MonthlyMetrics | null>(null)
  const [weekly, setWeekly] = useState<WeeklyMetrics[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [clientName, setClientName] = useState('')
  const [loading, setLoading] = useState(true)
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null)
  const supabase = createClient()
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('users').select('client_id, has_onboarded').eq('id', user.id).single()
      if (!profile?.client_id) return
      setHasOnboarded(profile.has_onboarded ?? true)
      const cid = profile.client_id

      const { data: client } = await supabase.from('clients').select('name').eq('id', cid).single()
      if (client) setClientName(client.name)

      const { data: months } = await supabase.from('monthly_metrics').select('*').eq('client_id', cid).order('month', { ascending: false }).limit(2)
      if (months?.[0]) setCurrent(months[0] as MonthlyMetrics)
      if (months?.[1]) setPrevious(months[1] as MonthlyMetrics)

      const { data: weeks } = await supabase.from('weekly_metrics').select('*').eq('client_id', cid).order('week_start', { ascending: true }).limit(8)
      if (weeks) setWeekly(weeks as WeeklyMetrics[])

      const { data: reps } = await supabase.from('reports').select('*').eq('client_id', cid).order('published_at', { ascending: false }).limit(5)
      if (reps) setReports(reps as Report[])

      const { data: tks } = await supabase.from('tasks').select('*').eq('client_id', cid).neq('status', 'cancelled').order('created_at', { ascending: false }).limit(5)
      if (tks) setTasks(tks as Task[])
    }
    load().finally(() => setLoading(false))
  }, [])

  async function handleDismissOnboarding() {
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ has_onboarded: true }),
      })
      setHasOnboarded(true)
    } catch {
      // Silent fail — card stays visible, user can retry
    }
  }

  if (loading) return (
    <div>
      <div className="h-8 bg-gray-200 rounded w-48 mb-1 animate-pulse" />
      <div className="h-4 bg-gray-100 rounded w-64 mb-6 animate-pulse" />
      <div className="flex gap-4 mb-6 flex-wrap">
        <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <SkeletonChart height={180} /><SkeletonChart height={180} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SkeletonText lines={5} /><SkeletonText lines={5} />
      </div>
    </div>
  )

  const c = current, p = previous

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-1">{t('title')}</h1>
      <p className="text-sm text-gray-500 mb-6">{t('summary', { clientName })}</p>

      {hasOnboarded === false && <OnboardingCard onDismiss={handleDismissOnboarding} />}

      <SectionErrorBoundary fallbackTitle={tc('error_section')} fallbackBody={tc('error_section_body')} fallbackRetry={tc('error_retry')}>
        {c && (
          <div className="flex gap-4 mb-6 flex-wrap">
            <MetricCard label="UPTIME" value={c.uptime_pct || 0} unit="%" prev={p?.uptime_pct || undefined} good="up" vsPrev={tc('vs_previous')} />
            <MetricCard label="P95 LATENCY" value={c.p95_latency_ms || 0} unit="ms" prev={p?.p95_latency_ms || undefined} good="down" vsPrev={tc('vs_previous')} />
            <MetricCard label="ERROR RATE" value={c.error_rate_pct || 0} unit="%" prev={p?.error_rate_pct || undefined} good="down" vsPrev={tc('vs_previous')} />
            <MetricCard label="PEAK TPS" value={c.peak_tps || 0} unit="tps" prev={p?.peak_tps || undefined} good="up" vsPrev={tc('vs_previous')} />
            <MetricCard label="LIGHTHOUSE" value={c.lighthouse_score || 0} unit="/100" prev={p?.lighthouse_score || undefined} good="up" vsPrev={tc('vs_previous')} />
          </div>
        )}

        {weekly.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="text-sm font-bold text-brand-dark mb-4">{t('charts.peak_tps')}</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weekly.map(w => ({ name: w.week_start.slice(5), tps: w.peak_tps }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="tps" fill="#2E75B6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="text-sm font-bold text-brand-dark mb-4">{t('charts.latency_p95')}</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={weekly.map(w => ({ name: w.week_start.slice(5), p95: w.p95_latency_ms }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="p95" stroke="#E67E22" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </SectionErrorBoundary>

      <SectionErrorBoundary fallbackTitle={tc('error_section')} fallbackBody={tc('error_section_body')} fallbackRetry={tc('error_retry')}>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-sm font-bold text-brand-dark mb-4">{t('recent_reports')}</h3>
            {reports.map(r => (
              <div key={r.id} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-[13px] font-semibold text-brand-dark">{r.title}</div>
                  <div className="text-[11px] text-gray-400">{r.period}</div>
                </div>
                <div className="flex gap-2">
                  {r.loom_url && <a href={r.loom_url} target="_blank" className="px-2.5 py-1 rounded-md border border-gray-200 text-[11px] hover:bg-gray-50">🎥 {tc('loom')}</a>}
                  <a href={r.file_url} className="px-2.5 py-1 rounded-md bg-brand-accent text-white text-[11px] hover:bg-brand-accent/90">⬇ {r.file_type.toUpperCase()}</a>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-sm font-bold text-brand-dark mb-4">{t('active_tasks')}</h3>
            {tasks.filter(t => t.status !== 'completed').map(t => (
              <div key={t.id} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-[13px] font-semibold text-brand-dark">{t.title}</div>
                  <div className="flex gap-1.5 mt-1">
                    <Badge text={t.priority.toUpperCase()} color={priorityColors[t.priority]} />
                    <Badge text={t.status.replace('_', ' ').toUpperCase()} color={statusColors[t.status]} />
                  </div>
                </div>
                <div className="text-[11px] text-gray-400">{t.due_date}</div>
              </div>
            ))}
          </div>
        </div>
      </SectionErrorBoundary>
    </div>
  )
}
