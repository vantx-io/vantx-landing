'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { TestResult, TestScenario } from '@/lib/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { SkeletonCard } from '@/components/skeletons'
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary'

function Badge({ text, color }: { text: string; color: string }) {
  return <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: color + '18', color }}>{text}</span>
}
const statusColors: Record<string, string> = { completed: '#27AE60', scheduled: '#2E75B6', running: '#E67E22', failed: '#C0392B' }

export default function TestsPage() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [selected, setSelected] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const t = useTranslations('tests')
  const tc = useTranslations('common')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('users').select('client_id').eq('id', user.id).single()
      if (!profile?.client_id) return
      const { data } = await supabase.from('test_results').select('*').eq('client_id', profile.client_id).order('date', { ascending: false })
      if (data) setTests(data as TestResult[])
    }
    load().finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div>
      <div className="h-8 bg-gray-200 rounded w-56 mb-1 animate-pulse" />
      <div className="h-4 bg-gray-100 rounded w-80 mb-6 animate-pulse" />
      <div className="space-y-3">
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-1">{t('title')}</h1>
      <p className="text-sm text-gray-500 mb-6">{t('subtitle')}</p>

      <SectionErrorBoundary fallbackTitle={tc('error_section')} fallbackBody={tc('error_section_body')} fallbackRetry={tc('error_retry')}>
        {tests.map(tr => (
          <div key={tr.id} onClick={() => setSelected(selected?.id === tr.id ? null : tr)}
            className="bg-white rounded-xl p-6 border border-gray-100 mb-3 cursor-pointer hover:shadow-md transition">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex gap-2 items-center mb-1">
                  <span className="text-lg">{tr.type === 'checkup' ? '🔍' : '⚡'}</span>
                  <span className="text-base font-bold text-brand-dark">{tr.name}</span>
                  <Badge text={tr.status.toUpperCase()} color={statusColors[tr.status]} />
                </div>
                <div className="text-sm text-gray-500">{tr.date}</div>
                {tr.summary && <p className="text-sm text-gray-600 mt-2 max-w-2xl">{tr.summary}</p>}
              </div>
              {tr.status === 'completed' && (
                <div className="flex gap-6 items-center">
                  {tr.max_tps && <div className="text-center"><div className="text-xl font-bold font-mono text-brand-accent">{tr.max_tps}</div><div className="text-[11px] text-gray-400">Max TPS</div></div>}
                  {tr.lighthouse_score && <div className="text-center"><div className="text-xl font-bold font-mono" style={{ color: tr.lighthouse_score >= 80 ? '#27AE60' : '#E67E22' }}>{tr.lighthouse_score}</div><div className="text-[11px] text-gray-400">Lighthouse</div></div>}
                  {tr.breakpoint_vus && <div className="text-center"><div className="text-xl font-bold font-mono text-brand-dark">{tr.breakpoint_vus}</div><div className="text-[11px] text-gray-400">Breakpoint VUs</div></div>}
                </div>
              )}
            </div>

            {selected?.id === tr.id && tr.scenarios && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-bold text-brand-dark mb-4">{t('results_by_scenario')}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-brand-dark text-white text-left">
                        <th className="px-3 py-2 rounded-tl-lg">{t('table.scenario')}</th>
                        <th className="px-3 py-2">{t('table.vus')}</th>
                        <th className="px-3 py-2">{t('table.tps')}</th>
                        <th className="px-3 py-2">{t('table.p50')}</th>
                        <th className="px-3 py-2">{t('table.p95')}</th>
                        <th className="px-3 py-2">{t('table.p99')}</th>
                        <th className="px-3 py-2 rounded-tr-lg">{t('table.errors')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(tr.scenarios as TestScenario[]).map((s, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="px-3 py-2 font-semibold">{s.name}</td>
                          <td className="px-3 py-2">{s.vus}</td>
                          <td className="px-3 py-2 font-mono font-bold text-brand-accent">{s.tps}</td>
                          <td className="px-3 py-2 font-mono">{s.p50}ms</td>
                          <td className="px-3 py-2 font-mono" style={{ color: s.p95 > 500 ? '#C0392B' : s.p95 > 300 ? '#E67E22' : '#27AE60' }}>{s.p95}ms</td>
                          <td className="px-3 py-2 font-mono" style={{ color: s.p99 > 1000 ? '#C0392B' : '#333' }}>{s.p99}ms</td>
                          <td className="px-3 py-2 font-mono" style={{ color: s.errors > 1 ? '#C0392B' : s.errors > 0.1 ? '#E67E22' : '#27AE60' }}>{s.errors}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(tr.scenarios as TestScenario[]).map(s => ({ name: s.name, TPS: s.tps, 'p95 (ms)': s.p95 }))}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="tps" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="lat" orientation="right" tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="tps" dataKey="TPS" fill="#2E75B6" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="lat" dataKey="p95 (ms)" fill="#E67E22" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {tr.findings && (tr.findings as any[]).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-bold text-brand-dark mb-3">{t('findings')}</h3>
                    {(tr.findings as any[]).map((f, i) => (
                      <div key={i} className="flex gap-3 mb-3 p-3 rounded-lg bg-gray-50">
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded h-fit ${f.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : f.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {f.severity}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-brand-dark">{f.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{f.component} — {f.problem}</div>
                          <div className="text-xs text-brand-green font-semibold mt-1">{t('action')}: {f.action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </SectionErrorBoundary>
    </div>
  )
}
