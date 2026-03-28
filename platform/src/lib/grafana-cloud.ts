// ═══ src/lib/grafana-cloud.ts — Grafana Cloud API client ═══

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import type { Client, OnboardingStepResult, GrafanaStackConfig, GrafanaApiKeys, FaroConfig } from './types'

const CLOUD_API = 'https://grafana.com/api'

function apiKey(): string { return process.env.GRAFANA_CLOUD_API_KEY || '' }
function orgSlug(): string { return process.env.GRAFANA_CLOUD_ORG_SLUG || '' }

function isConfigured(): boolean {
  return !!(process.env.GRAFANA_CLOUD_API_KEY && process.env.GRAFANA_CLOUD_ORG_SLUG)
}

function cloudHeaders(): HeadersInit {
  return { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' }
}

function instanceHeaders(instanceApiKey: string): HeadersInit {
  return { Authorization: `Bearer ${instanceApiKey}`, 'Content-Type': 'application/json' }
}

function skip(step: string): OnboardingStepResult {
  return { step, status: 'skipped', message: 'Grafana Cloud not configured (GRAFANA_CLOUD_API_KEY missing)' }
}

// ─── Stack management ───

async function getExistingStack(stackSlug: string): Promise<GrafanaStackConfig | null> {
  const res = await fetch(`${CLOUD_API}/orgs/${orgSlug()}/instances`, { headers: cloudHeaders() })
  if (!res.ok) throw new Error(`List stacks failed: ${res.status} ${await res.text()}`)
  const { items } = await res.json() as { items: any[] }
  const existing = items?.find((s: any) => s.slug === stackSlug)
  if (!existing) return null
  return mapStack(existing)
}

async function createStack(clientSlug: string): Promise<{ config: GrafanaStackConfig; created: boolean }> {
  const stackSlug = `vantx-${clientSlug}`
  const existing = await getExistingStack(stackSlug)
  if (existing) return { config: existing, created: false }

  const res = await fetch(`${CLOUD_API}/instances`, {
    method: 'POST',
    headers: cloudHeaders(),
    body: JSON.stringify({ name: stackSlug, slug: stackSlug, region: 'us' }),
  })
  if (!res.ok) throw new Error(`Create stack failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return { config: mapStack(data), created: true }
}

function mapStack(data: any): GrafanaStackConfig {
  return {
    stackSlug: data.slug,
    stackId: data.id,
    orgId: data.orgId,
    grafanaUrl: data.url,
    prometheusUrl: data.hmInstancePromUrl,
    lokiUrl: data.hlInstanceUrl,
    tempoUrl: data.htInstanceUrl,
    prometheusUserId: data.hmInstancePromId,
    lokiUserId: data.hlInstanceId,
    tempoUserId: data.htInstanceId,
  }
}

// ─── Instance API key (temporary, for provisioning) ───

async function createInstanceApiKey(stackId: number, name: string): Promise<{ id: number; key: string }> {
  const res = await fetch(`${CLOUD_API}/instances/${stackId}/api/auth/keys`, {
    method: 'POST',
    headers: cloudHeaders(),
    body: JSON.stringify({ name, role: 'Admin', secondsToLive: 3600 }),
  })
  if (!res.ok) throw new Error(`Create instance API key failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return { id: data.id, key: data.key }
}

async function deleteInstanceApiKey(stackId: number, keyId: number): Promise<void> {
  await fetch(`${CLOUD_API}/instances/${stackId}/api/auth/keys/${keyId}`, {
    method: 'DELETE',
    headers: cloudHeaders(),
  })
}

// ─── Datasources ───

async function createDatasources(stack: GrafanaStackConfig, instanceKey: string): Promise<void> {
  const headers = instanceHeaders(instanceKey)
  const baseUrl = stack.grafanaUrl

  // Check existing
  const existing = await fetch(`${baseUrl}/api/datasources`, { headers })
  const dsList = existing.ok ? ((await existing.json()) as any[]) : []
  const existingNames = new Set(dsList.map((d: any) => d.name))

  const datasources = [
    {
      name: 'Prometheus', type: 'prometheus', url: stack.prometheusUrl,
      access: 'proxy', isDefault: true,
      basicAuth: true, basicAuthUser: String(stack.prometheusUserId),
      secureJsonData: { basicAuthPassword: apiKey() },
    },
    {
      name: 'Loki', type: 'loki', url: stack.lokiUrl,
      access: 'proxy', basicAuth: true, basicAuthUser: String(stack.lokiUserId),
      secureJsonData: { basicAuthPassword: apiKey() },
    },
    {
      name: 'Tempo', type: 'tempo', url: stack.tempoUrl,
      access: 'proxy', basicAuth: true, basicAuthUser: String(stack.tempoUserId),
      secureJsonData: { basicAuthPassword: apiKey() },
    },
  ]

  for (const ds of datasources) {
    if (existingNames.has(ds.name)) continue
    const res = await fetch(`${baseUrl}/api/datasources`, {
      method: 'POST', headers, body: JSON.stringify(ds),
    })
    if (!res.ok) {
      const text = await res.text()
      if (!text.includes('already exists')) throw new Error(`Create datasource ${ds.name} failed: ${res.status} ${text}`)
    }
  }
}

// ─── Faro ───

async function activateFaro(stack: GrafanaStackConfig, instanceKey: string): Promise<FaroConfig> {
  const headers = instanceHeaders(instanceKey)

  // Check if Faro app exists
  const checkRes = await fetch(`${stack.grafanaUrl}/api/frontend/settings`, { headers })
  if (checkRes.ok) {
    const settings = await checkRes.json() as any
    if (settings?.faroUrl) {
      return {
        appKey: settings.faroAppKey || stack.stackSlug,
        collectorUrl: settings.faroUrl,
        sdkSnippet: buildFaroSnippet(settings.faroUrl, stack.stackSlug),
      }
    }
  }

  // Enable Faro via Cloud API
  const res = await fetch(`${CLOUD_API}/instances/${stack.stackId}`, {
    method: 'POST',
    headers: cloudHeaders(),
    body: JSON.stringify({ config: { faro: { enabled: true } } }),
  })

  const collectorUrl = `https://faro-collector-us-central1.grafana.net/collect/${stack.stackSlug}`
  return {
    appKey: stack.stackSlug,
    collectorUrl,
    sdkSnippet: buildFaroSnippet(collectorUrl, stack.stackSlug),
  }
}

function buildFaroSnippet(collectorUrl: string, appName: string): string {
  return [
    `import { initializeFaro } from '@grafana/faro-web-sdk';`,
    `initializeFaro({`,
    `  url: '${collectorUrl}',`,
    `  app: { name: '${appName}', version: '1.0.0', environment: 'production' }`,
    `});`,
  ].join('\n')
}

// ─── IRM (On-call) ───

async function activateIRM(stack: GrafanaStackConfig, instanceKey: string): Promise<{ scheduleId: string; escalationId: string }> {
  const headers = instanceHeaders(instanceKey)
  const oncallBase = `${stack.grafanaUrl}/api/v1/oncall`

  // Create schedule (idempotent check)
  const schedulesRes = await fetch(`${oncallBase}/schedules`, { headers })
  const schedules = schedulesRes.ok ? ((await schedulesRes.json()) as any) : { results: [] }
  let schedule = schedules.results?.find((s: any) => s.name === 'Vantx SRE On-Call')

  if (!schedule) {
    const res = await fetch(`${oncallBase}/schedules`, {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'Vantx SRE On-Call', type: 'web', time_zone: 'America/Santiago' }),
    })
    if (res.ok) schedule = await res.json()
  }

  // Create escalation chain
  const chainsRes = await fetch(`${oncallBase}/escalation_chains`, { headers })
  const chains = chainsRes.ok ? ((await chainsRes.json()) as any) : { results: [] }
  let chain = chains.results?.find((c: any) => c.name === 'Vantx Default Escalation')

  if (!chain) {
    const res = await fetch(`${oncallBase}/escalation_chains`, {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'Vantx Default Escalation' }),
    })
    if (res.ok) chain = await res.json()
  }

  // Link escalation policy
  if (schedule && chain) {
    await fetch(`${oncallBase}/escalation_policies`, {
      method: 'POST', headers,
      body: JSON.stringify({
        escalation_chain_id: chain.id,
        step: 0,
        type: 'notify_on_call_from_schedule',
        notify_on_call_from_schedule: schedule.id,
      }),
    })
  }

  return {
    scheduleId: schedule?.id || 'unknown',
    escalationId: chain?.id || 'unknown',
  }
}

// ─── Dashboards ───

function loadDashboardJsons(): { uid: string; json: any }[] {
  const dir = join(process.cwd(), 'grafana', 'dashboards')
  try {
    return readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const json = JSON.parse(readFileSync(join(dir, f), 'utf-8'))
        return { uid: json.uid || f.replace('.json', ''), json }
      })
  } catch {
    return []
  }
}

async function importDashboards(stack: GrafanaStackConfig, instanceKey: string): Promise<string[]> {
  const headers = instanceHeaders(instanceKey)
  const dashboards = loadDashboardJsons()
  const imported: string[] = []

  for (const { uid, json } of dashboards) {
    const res = await fetch(`${stack.grafanaUrl}/api/dashboards/db`, {
      method: 'POST', headers,
      body: JSON.stringify({ dashboard: { ...json, id: null }, folderId: 0, overwrite: true }),
    })
    if (res.ok) imported.push(uid)
  }

  return imported
}

// ─── Alert rules ───

async function createAlertRules(stack: GrafanaStackConfig, instanceKey: string): Promise<void> {
  const headers = instanceHeaders(instanceKey)
  const rulesUrl = `${stack.grafanaUrl}/api/v1/provisioning/alert-rules`

  // Check existing rules
  const existingRes = await fetch(rulesUrl, { headers })
  const existingRules = existingRes.ok ? ((await existingRes.json()) as any[]) : []
  const existingTitles = new Set(existingRules.map((r: any) => r.title))

  const rules = [
    {
      title: 'Uptime < 99.9%',
      ruleGroup: 'vantx-sre',
      folderUID: 'vantx-alerts',
      condition: 'A',
      data: [{ refId: 'A', queryType: '', relativeTimeRange: { from: 300, to: 0 },
        datasourceUid: '__expr__',
        model: { expression: '1 - avg(up{})', type: 'math' } }],
      for: '5m',
      labels: { severity: 'critical' },
    },
    {
      title: 'P95 Latency > 300ms',
      ruleGroup: 'vantx-sre',
      folderUID: 'vantx-alerts',
      condition: 'A',
      data: [{ refId: 'A', queryType: '', relativeTimeRange: { from: 300, to: 0 },
        datasourceUid: '__expr__',
        model: { expression: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 0.3', type: 'math' } }],
      for: '5m',
      labels: { severity: 'warning' },
    },
    {
      title: 'Error Rate > 1%',
      ruleGroup: 'vantx-sre',
      folderUID: 'vantx-alerts',
      condition: 'A',
      data: [{ refId: 'A', queryType: '', relativeTimeRange: { from: 300, to: 0 },
        datasourceUid: '__expr__',
        model: { expression: 'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.01', type: 'math' } }],
      for: '5m',
      labels: { severity: 'warning' },
    },
    {
      title: 'LCP > 2.5s',
      ruleGroup: 'vantx-sre',
      folderUID: 'vantx-alerts',
      condition: 'A',
      data: [{ refId: 'A', queryType: '', relativeTimeRange: { from: 600, to: 0 },
        datasourceUid: '__expr__',
        model: { expression: 'avg(lcp_seconds) > 2.5', type: 'math' } }],
      for: '10m',
      labels: { severity: 'warning' },
    },
  ]

  // Create folder first
  await fetch(`${stack.grafanaUrl}/api/folders`, {
    method: 'POST', headers,
    body: JSON.stringify({ uid: 'vantx-alerts', title: 'Vantx Alerts' }),
  })

  for (const rule of rules) {
    if (existingTitles.has(rule.title)) continue
    await fetch(rulesUrl, {
      method: 'POST', headers,
      body: JSON.stringify({ ...rule, orgID: 1, noDataState: 'NoData', execErrState: 'Error' }),
    })
  }
}

// ─── Permanent API keys ───

async function createPermanentApiKeys(stackId: number): Promise<GrafanaApiKeys> {
  const keys: GrafanaApiKeys = { metricsPublishKey: '', faroCollectorKey: '' }

  // Check existing keys
  const existingRes = await fetch(`${CLOUD_API}/instances/${stackId}/api/auth/keys`, { headers: cloudHeaders() })
  const existingKeys = existingRes.ok ? ((await existingRes.json()) as any) : { items: [] }
  const existingNames = new Set((existingKeys.items || []).map((k: any) => k.name))

  if (!existingNames.has('vantx-metrics-push')) {
    const res = await fetch(`${CLOUD_API}/instances/${stackId}/api/auth/keys`, {
      method: 'POST', headers: cloudHeaders(),
      body: JSON.stringify({ name: 'vantx-metrics-push', role: 'MetricsPublisher' }),
    })
    if (res.ok) {
      const data = await res.json()
      keys.metricsPublishKey = data.key
    }
  }

  if (!existingNames.has('vantx-faro-collector')) {
    const res = await fetch(`${CLOUD_API}/instances/${stackId}/api/auth/keys`, {
      method: 'POST', headers: cloudHeaders(),
      body: JSON.stringify({ name: 'vantx-faro-collector', role: 'MetricsPublisher' }),
    })
    if (res.ok) {
      const data = await res.json()
      keys.faroCollectorKey = data.key
    }
  }

  return keys
}

// ─── Public API ───

export async function provisionGrafana(client: Pick<Client, 'short_name' | 'id'>): Promise<OnboardingStepResult[]> {
  if (!isConfigured()) {
    return [
      skip('grafana-create-stack'),
      skip('grafana-datasources'),
      skip('grafana-faro'),
      skip('grafana-irm'),
      skip('grafana-dashboards'),
      skip('grafana-alert-rules'),
      skip('grafana-api-keys'),
    ]
  }

  const results: OnboardingStepResult[] = []
  const slug = client.short_name.toLowerCase().replace(/[^a-z0-9]/g, '-')
  let stack: GrafanaStackConfig | null = null
  let tempKey: { id: number; key: string } | null = null

  // 1. Create stack
  try {
    const { config, created } = await createStack(slug)
    stack = config
    results.push({
      step: 'grafana-create-stack',
      status: 'success',
      message: created ? `Stack vantx-${slug} created` : `Stack vantx-${slug} already exists`,
      data: { grafanaUrl: config.grafanaUrl, orgId: config.orgId, stackId: config.stackId },
    })
  } catch (err) {
    results.push({ step: 'grafana-create-stack', status: 'failed', message: String(err) })
    return results
  }

  // 2. Create temporary admin key for instance operations
  try {
    tempKey = await createInstanceApiKey(stack.stackId, `vantx-provisioning-${Date.now()}`)
  } catch (err) {
    results.push({ step: 'grafana-temp-key', status: 'failed', message: String(err) })
    return results
  }

  // 3. Datasources
  try {
    await createDatasources(stack, tempKey.key)
    results.push({ step: 'grafana-datasources', status: 'success', message: 'Prometheus, Loki, Tempo configured' })
  } catch (err) {
    results.push({ step: 'grafana-datasources', status: 'failed', message: String(err) })
  }

  // 4. Faro
  try {
    const faro = await activateFaro(stack, tempKey.key)
    results.push({
      step: 'grafana-faro', status: 'success', message: 'Faro SDK activated',
      data: { sdkSnippet: faro.sdkSnippet, collectorUrl: faro.collectorUrl },
    })
  } catch (err) {
    results.push({ step: 'grafana-faro', status: 'failed', message: String(err) })
  }

  // 5. IRM
  try {
    const irm = await activateIRM(stack, tempKey.key)
    results.push({
      step: 'grafana-irm', status: 'success', message: 'On-call schedule + escalation created',
      data: { scheduleId: irm.scheduleId, escalationId: irm.escalationId },
    })
  } catch (err) {
    results.push({ step: 'grafana-irm', status: 'failed', message: String(err) })
  }

  // 6. Dashboards
  try {
    const imported = await importDashboards(stack, tempKey.key)
    results.push({
      step: 'grafana-dashboards', status: 'success',
      message: `${imported.length} dashboards imported: ${imported.join(', ')}`,
    })
  } catch (err) {
    results.push({ step: 'grafana-dashboards', status: 'failed', message: String(err) })
  }

  // 7. Alert rules
  try {
    await createAlertRules(stack, tempKey.key)
    results.push({ step: 'grafana-alert-rules', status: 'success', message: '4 alert rules configured' })
  } catch (err) {
    results.push({ step: 'grafana-alert-rules', status: 'failed', message: String(err) })
  }

  // 8. Permanent API keys
  try {
    const keys = await createPermanentApiKeys(stack.stackId)
    results.push({
      step: 'grafana-api-keys', status: 'success', message: 'Metrics push + Faro collector keys created',
      data: { hasMetricsKey: !!keys.metricsPublishKey, hasFaroKey: !!keys.faroCollectorKey },
    })
  } catch (err) {
    results.push({ step: 'grafana-api-keys', status: 'failed', message: String(err) })
  }

  // Cleanup temp key
  try { await deleteInstanceApiKey(stack.stackId, tempKey.id) } catch { /* best-effort */ }

  return results
}
