#!/usr/bin/env node
/**
 * Manual client onboarding — provisions Grafana Cloud stack, Slack channel,
 * and updates Supabase client record.
 *
 * Same flow as the Stripe webhook automation, but runnable from CLI.
 *
 * Usage:
 *   node scripts/onboard-client.js <client-id-or-short-name>
 *   node scripts/onboard-client.js NovaPay --dry-run
 *
 * Requires: .env.local with Supabase keys.
 * Optional: GRAFANA_CLOUD_API_KEY, GRAFANA_CLOUD_ORG_SLUG, SLACK_BOT_TOKEN
 */

const { createClient } = require('@supabase/supabase-js')
const { readFileSync, readdirSync } = require('fs')
const { join } = require('path')
require('dotenv').config({ path: '.env.local' })

// ─── Config ───

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const grafanaApiKey = process.env.GRAFANA_CLOUD_API_KEY
const grafanaOrgSlug = process.env.GRAFANA_CLOUD_ORG_SLUG
const slackBotToken = process.env.SLACK_BOT_TOKEN

if (!serviceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Args ───

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const identifier = args.filter((a) => !a.startsWith('--'))[0]

if (!identifier) {
  console.error('Usage: node scripts/onboard-client.js [--dry-run] <client-id-or-short-name>')
  process.exit(1)
}

// ─── Helpers ───

const CLOUD_API = 'https://grafana.com/api'
const SLACK_API = 'https://slack.com/api'

function cloudHeaders() {
  return { Authorization: `Bearer ${grafanaApiKey}`, 'Content-Type': 'application/json' }
}

function slackHeaders() {
  return { Authorization: `Bearer ${slackBotToken}`, 'Content-Type': 'application/json' }
}

function log(icon, step, message) {
  console.log(`  ${icon} [${step}] ${message}`)
}

// ─── Grafana Cloud ───

async function provisionGrafana(client) {
  if (!grafanaApiKey || !grafanaOrgSlug) {
    log('⏭', 'grafana', 'Skipped (GRAFANA_CLOUD_API_KEY not configured)')
    return { skipped: true }
  }

  const slug = client.short_name.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const stackSlug = `vantx-${slug}`

  // 1. Create or find stack
  let stack
  const listRes = await fetch(`${CLOUD_API}/orgs/${grafanaOrgSlug}/instances`, { headers: cloudHeaders() })
  if (!listRes.ok) throw new Error(`List stacks: ${listRes.status}`)
  const { items } = await listRes.json()
  const existing = items?.find((s) => s.slug === stackSlug)

  if (existing) {
    stack = existing
    log('✓', 'grafana-stack', `Stack ${stackSlug} already exists`)
  } else {
    const createRes = await fetch(`${CLOUD_API}/instances`, {
      method: 'POST',
      headers: cloudHeaders(),
      body: JSON.stringify({ name: stackSlug, slug: stackSlug, region: 'us' }),
    })
    if (!createRes.ok) throw new Error(`Create stack: ${createRes.status} ${await createRes.text()}`)
    stack = await createRes.json()
    log('✓', 'grafana-stack', `Stack ${stackSlug} created`)
  }

  // 2. Temp admin key
  const keyRes = await fetch(`${CLOUD_API}/instances/${stack.id}/api/auth/keys`, {
    method: 'POST',
    headers: cloudHeaders(),
    body: JSON.stringify({ name: `vantx-provision-${Date.now()}`, role: 'Admin', secondsToLive: 3600 }),
  })
  if (!keyRes.ok) throw new Error(`Create temp key: ${keyRes.status}`)
  const tempKey = await keyRes.json()
  const instHeaders = { Authorization: `Bearer ${tempKey.key}`, 'Content-Type': 'application/json' }

  // 3. Datasources
  const dsNames = ['Prometheus', 'Loki', 'Tempo']
  const dsExisting = await fetch(`${stack.url}/api/datasources`, { headers: instHeaders })
  const dsList = dsExisting.ok ? await dsExisting.json() : []
  const existingDsNames = new Set(dsList.map((d) => d.name))

  const datasources = [
    { name: 'Prometheus', type: 'prometheus', url: stack.hmInstancePromUrl, isDefault: true, basicAuth: true, basicAuthUser: String(stack.hmInstancePromId), secureJsonData: { basicAuthPassword: grafanaApiKey } },
    { name: 'Loki', type: 'loki', url: stack.hlInstanceUrl, basicAuth: true, basicAuthUser: String(stack.hlInstanceId), secureJsonData: { basicAuthPassword: grafanaApiKey } },
    { name: 'Tempo', type: 'tempo', url: stack.htInstanceUrl, basicAuth: true, basicAuthUser: String(stack.htInstanceId), secureJsonData: { basicAuthPassword: grafanaApiKey } },
  ]

  for (const ds of datasources) {
    if (existingDsNames.has(ds.name)) continue
    await fetch(`${stack.url}/api/datasources`, { method: 'POST', headers: instHeaders, body: JSON.stringify({ ...ds, access: 'proxy' }) })
  }
  log('✓', 'grafana-datasources', 'Prometheus, Loki, Tempo configured')

  // 4. Dashboards
  const dashDir = join(process.cwd(), 'grafana', 'dashboards')
  try {
    const files = readdirSync(dashDir).filter((f) => f.endsWith('.json'))
    for (const f of files) {
      const json = JSON.parse(readFileSync(join(dashDir, f), 'utf-8'))
      await fetch(`${stack.url}/api/dashboards/db`, {
        method: 'POST',
        headers: instHeaders,
        body: JSON.stringify({ dashboard: { ...json, id: null }, folderId: 0, overwrite: true }),
      })
    }
    log('✓', 'grafana-dashboards', `${files.length} dashboards imported`)
  } catch {
    log('✗', 'grafana-dashboards', 'Dashboard directory not found')
  }

  // 5. Alert folder + rules
  await fetch(`${stack.url}/api/folders`, {
    method: 'POST',
    headers: instHeaders,
    body: JSON.stringify({ uid: 'vantx-alerts', title: 'Vantx Alerts' }),
  })

  const alertRules = [
    { title: 'Uptime < 99.9%', labels: { severity: 'critical' } },
    { title: 'P95 Latency > 300ms', labels: { severity: 'warning' } },
    { title: 'Error Rate > 1%', labels: { severity: 'warning' } },
    { title: 'LCP > 2.5s', labels: { severity: 'warning' } },
  ]
  const existingRulesRes = await fetch(`${stack.url}/api/v1/provisioning/alert-rules`, { headers: instHeaders })
  const existingRules = existingRulesRes.ok ? await existingRulesRes.json() : []
  const existingTitles = new Set((existingRules || []).map((r) => r.title))

  for (const rule of alertRules) {
    if (existingTitles.has(rule.title)) continue
    await fetch(`${stack.url}/api/v1/provisioning/alert-rules`, {
      method: 'POST',
      headers: instHeaders,
      body: JSON.stringify({
        ...rule,
        orgID: 1,
        ruleGroup: 'vantx-sre',
        folderUID: 'vantx-alerts',
        condition: 'A',
        for: '5m',
        noDataState: 'NoData',
        execErrState: 'Error',
        data: [{ refId: 'A', queryType: '', relativeTimeRange: { from: 300, to: 0 }, datasourceUid: '__expr__', model: { expression: 'placeholder', type: 'math' } }],
      }),
    })
  }
  log('✓', 'grafana-alerts', `${alertRules.length} alert rules configured`)

  // 6. IRM (on-call)
  try {
    const oncallBase = `${stack.url}/api/v1/oncall`
    const schedulesRes = await fetch(`${oncallBase}/schedules`, { headers: instHeaders })
    const schedules = schedulesRes.ok ? await schedulesRes.json() : { results: [] }
    if (!schedules.results?.find((s) => s.name === 'Vantx SRE On-Call')) {
      await fetch(`${oncallBase}/schedules`, {
        method: 'POST',
        headers: instHeaders,
        body: JSON.stringify({ name: 'Vantx SRE On-Call', type: 'web', time_zone: 'America/Santiago' }),
      })
    }
    log('✓', 'grafana-irm', 'On-call schedule configured')
  } catch {
    log('✗', 'grafana-irm', 'IRM setup failed (OnCall plugin may not be enabled)')
  }

  // 7. Permanent API keys
  const permKeysRes = await fetch(`${CLOUD_API}/instances/${stack.id}/api/auth/keys`, { headers: cloudHeaders() })
  const permKeys = permKeysRes.ok ? await permKeysRes.json() : { items: [] }
  const permKeyNames = new Set((permKeys.items || []).map((k) => k.name))

  if (!permKeyNames.has('vantx-metrics-push')) {
    await fetch(`${CLOUD_API}/instances/${stack.id}/api/auth/keys`, {
      method: 'POST',
      headers: cloudHeaders(),
      body: JSON.stringify({ name: 'vantx-metrics-push', role: 'MetricsPublisher' }),
    })
  }
  if (!permKeyNames.has('vantx-faro-collector')) {
    await fetch(`${CLOUD_API}/instances/${stack.id}/api/auth/keys`, {
      method: 'POST',
      headers: cloudHeaders(),
      body: JSON.stringify({ name: 'vantx-faro-collector', role: 'MetricsPublisher' }),
    })
  }
  log('✓', 'grafana-api-keys', 'Metrics push + Faro collector keys ready')

  // Cleanup temp key
  await fetch(`${CLOUD_API}/instances/${stack.id}/api/auth/keys/${tempKey.id}`, { method: 'DELETE', headers: cloudHeaders() }).catch(() => {})

  return { grafanaUrl: stack.url, orgId: stack.orgId }
}

// ─── Slack ───

async function provisionSlack(client, grafanaUrl) {
  if (!slackBotToken) {
    log('⏭', 'slack', 'Skipped (SLACK_BOT_TOKEN not configured)')
    return { skipped: true }
  }

  const channelName = `vantx-${client.short_name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')}`.slice(0, 80)

  // Find existing channel
  let channelId
  const listRes = await fetch(`${SLACK_API}/conversations.list?types=public_channel&limit=200`, { headers: slackHeaders() })
  const listData = listRes.ok ? await listRes.json() : { ok: false }
  if (listData.ok) {
    const found = listData.channels?.find((c) => c.name === channelName)
    if (found) channelId = found.id
  }

  if (channelId) {
    log('✓', 'slack-channel', `#${channelName} already exists`)
  } else {
    const createRes = await fetch(`${SLACK_API}/conversations.create`, {
      method: 'POST',
      headers: slackHeaders(),
      body: JSON.stringify({ name: channelName, is_private: false }),
    })
    const createData = await createRes.json()
    if (!createData.ok) throw new Error(`Slack create channel: ${createData.error}`)
    channelId = createData.channel.id

    await fetch(`${SLACK_API}/conversations.setTopic`, {
      method: 'POST',
      headers: slackHeaders(),
      body: JSON.stringify({ channel: channelId, topic: `Vantx SRE — ${client.short_name}` }),
    })
    log('✓', 'slack-channel', `#${channelName} created`)
  }

  // Welcome message
  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: 'Welcome to Vantx SRE!' } },
    { type: 'section', text: { type: 'mrkdwn', text: `*${client.name}* — your monitoring stack is ready.\n\nYour Vantx SRE team will post weekly updates, incident alerts, and performance reports here.` } },
    { type: 'divider' },
  ]
  if (grafanaUrl) {
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*Dashboards*\n<${grafanaUrl}|Open Grafana> — RED, USE, k6, Web Vitals, SLO, PostgreSQL` } })
  }
  blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: 'Powered by Vantx — vantx.io' }] })

  const msgRes = await fetch(`${SLACK_API}/chat.postMessage`, {
    method: 'POST',
    headers: slackHeaders(),
    body: JSON.stringify({ channel: channelId, blocks, text: `Welcome to Vantx SRE, ${client.name}!` }),
  })
  const msgData = await msgRes.json()
  if (msgData.ok) {
    log('✓', 'slack-message', 'Welcome message sent')
  } else {
    log('✗', 'slack-message', `Failed: ${msgData.error}`)
  }

  return { channelName }
}

// ─── Main ───

async function main() {
  // Resolve client
  const isUuid = /^[0-9a-f]{8}-/.test(identifier)
  const query = isUuid
    ? supabase.from('clients').select('*').eq('id', identifier).single()
    : supabase.from('clients').select('*').ilike('short_name', identifier).single()

  const { data: client, error } = await query
  if (!client) {
    console.error(`Client not found: ${identifier}`)
    if (error) console.error(error.message)
    process.exit(1)
  }

  console.log(`\n  Onboarding: ${client.name} (${client.short_name})`)
  console.log(`  ID:     ${client.id}`)
  console.log(`  Market: ${client.market}`)
  console.log(`  Status: ${client.status}\n`)

  console.log('  Integrations:')
  console.log(`    Grafana Cloud: ${grafanaApiKey ? 'CONFIGURED' : 'NOT CONFIGURED (will skip)'}`)
  console.log(`    Slack:         ${slackBotToken ? 'CONFIGURED' : 'NOT CONFIGURED (will skip)'}`)
  console.log()

  if (dryRun) {
    console.log('  --dry-run: No changes made.\n')
    process.exit(0)
  }

  console.log('  Running onboarding...\n')

  // Grafana
  let grafanaUrl
  let grafanaOrgId
  try {
    const result = await provisionGrafana(client)
    if (!result.skipped) {
      grafanaUrl = result.grafanaUrl
      grafanaOrgId = result.orgId
    }
  } catch (err) {
    log('✗', 'grafana', `Error: ${err.message}`)
  }

  // Slack
  let slackChannel
  try {
    const result = await provisionSlack(client, grafanaUrl)
    if (!result.skipped) {
      slackChannel = result.channelName
    }
  } catch (err) {
    log('✗', 'slack', `Error: ${err.message}`)
  }

  // Update Supabase
  const update = {}
  if (grafanaOrgId) update.grafana_org_id = String(grafanaOrgId)
  if (slackChannel) update.slack_channel = slackChannel
  update.status = 'active'

  const { error: updateErr } = await supabase.from('clients').update(update).eq('id', client.id)
  if (updateErr) {
    log('✗', 'supabase', `Update failed: ${updateErr.message}`)
  } else {
    log('✓', 'supabase', `Client updated: ${Object.keys(update).join(', ')}`)
  }

  // Summary
  console.log('\n  Done!')
  if (grafanaUrl) console.log(`  Grafana: ${grafanaUrl}`)
  if (slackChannel) console.log(`  Slack:   #${slackChannel}`)
  console.log()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
