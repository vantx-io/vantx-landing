# Testing Patterns

**Analysis Date:** 2026-03-20

## Test Framework

**Automated Unit/Integration Tests:**
- None present. No Jest, Vitest, Playwright, Cypress, or any other test runner is installed.
- No `*.test.*` or `*.spec.*` files exist anywhere in the codebase.
- No test scripts in `package.json` beyond `"lint": "next lint"` and `"type-check": "tsc --noEmit"`.

**Static Analysis (de facto quality gates):**
- TypeScript compiler: `tsc --noEmit` via `npm run type-check`
- ESLint via `next lint` (eslint-config-next defaults)

**Performance/Load Testing Framework (k6):**
- k6 is used as the primary "testing" tool — it validates production-like behavior, not unit logic
- Scenarios located at `08-k6-framework/vantix-k6/scenarios/`
- Library shared across all scenarios at `08-k6-framework/vantix-k6/lib/`

**Run Commands (k6):**
```bash
CLIENT=novapay k6 run scenarios/uptime.js        # Uptime check (1 min interval via cron)
CLIENT=novapay k6 run scenarios/synthetic.js     # Critical flow check (5 min interval)
CLIENT=novapay k6 run scenarios/load-stress.js   # Load/stress/spike test (monthly)
SCENARIO=baseline k6 run scenarios/load-stress.js  # Override scenario type
```

**Run Commands (static checks):**
```bash
npm run lint         # ESLint via Next.js
npm run type-check   # TypeScript strict type checking
```

## Test File Organization

**Location:**
- No co-located test files
- k6 scenarios live in `08-k6-framework/vantix-k6/scenarios/` — separate from the Next.js platform
- k6 results written to `08-k6-framework/vantix-k6/results/` as JSON files

**Naming (k6):**
- Scenario files: `{scope}.js` (e.g., `uptime.js`, `synthetic.js`, `load-stress.js`)
- Result files: `{client}-{type}-latest.json` or `{client}-{type}-{date}.json`

**Structure:**
```
08-k6-framework/vantix-k6/
├── scenarios/
│   ├── uptime.js          # Health check, 1 VU, 1 iteration
│   ├── synthetic.js       # Critical user journey, 1 VU, 1 iteration
│   └── load-stress.js     # Load/stress/spike, configurable VUs and stages
├── lib/
│   ├── checks.js          # Reusable check functions
│   ├── metrics.js         # Custom Prometheus metric definitions + threshold builder
│   └── config.js          # Dynamic client config loader
├── clients/
│   ├── _template.js       # Template for new client configs
│   └── novapay.js         # NovaPay client config
└── scripts/
    ├── push-to-supabase.js    # Push results to DB
    ├── generate-weekly.js     # Aggregate weekly metrics
    └── aggregate-monthly.js   # Aggregate monthly evaluation
```

## k6 Scenario Structure

**Suite Organization:**
```javascript
// All scenarios follow this shape:
export const options = {
  vus: 1,
  iterations: 1,
  thresholds: buildThresholds(config.slos),  // SLO-driven thresholds
  tags: clientTags(config, { scenario: 'synthetic' }),
};

export default function () {
  // Test body
}

export function handleSummary(data) {
  // Output JSON result to stdout + results file
  return {
    stdout: JSON.stringify(result) + '\n',
    [`results/${config.short}-synthetic-latest.json`]: JSON.stringify(result, null, 2),
  };
}
```

**Key patterns:**
- `export const options` — declares VUs, stages, thresholds, tags
- `export default function` — the test body (runs per VU per iteration)
- `export function handleSummary(data)` — post-test result serialization to JSON
- Config is injected via `CLIENT` env var, loaded from `lib/config.js`

## Mocking

**Framework:** None (no mocking library)

**k6 approach:**
- No mocks — all k6 scenarios hit real or staging endpoints
- Synthetic user credentials are env vars (e.g., `NOVAPAY_SYNTHETIC_USER`, `NOVAPAY_SYNTHETIC_PASS`)
- Test data uses hardcoded payload values (e.g., `merchant_id: "test-merchant-001"`)

**Next.js approach:**
- No mock layer exists. Pages and API routes are manually tested via the running dev server.

## Fixtures and Factories

**Test Data (k6):**
```javascript
// Client config defines test payloads inline:
body: JSON.stringify({
  merchant_id: "test-merchant-001",
  amount: 10000,
  currency: "CLP",
  description: "Synthetic test payment",
}),
```

**Seed Data (Next.js dev):**
- `scripts/seed-demo.js` populates Supabase with demo data for local development
- Run via `npm run db:seed`

**Location:**
- k6 payloads: inline in `clients/novapay.js` and `clients/_template.js`
- DB seed: `07-plataforma/vantix-platform/scripts/seed-demo.js`

## Coverage

**Requirements:** None enforced — no coverage tooling configured

**View Coverage:**
- Not applicable (no unit test runner)

## Test Types

**Unit Tests:**
- Not present

**Integration Tests:**
- Not present as automated tests
- Manual testing via local dev server + Supabase local instance

**Performance Tests (k6):**

_Uptime (health check):_
- Scope: Single health endpoint per client
- Frequency: Every 1 minute via cron
- Pass criteria: HTTP 200, response < 5s
- Metrics: `vantix_uptime_check`, `vantix_uptime_latency`, `vantix_uptime_errors`

_Synthetic monitoring:_
- Scope: Full critical user journey (multi-step flow)
- Frequency: Every 5 minutes via cron
- Pass criteria: Each step matches `expectedStatus`, p95 < SLO target
- Metrics: `vantix_synthetic_duration`, `vantix_synthetic_step_duration`, `vantix_synthetic_errors`, `vantix_synthetic_up`
- Token chaining: Supports extracting values from one step response for use in next step path

_Load/stress test:_
- Scope: Weighted random selection across defined endpoints
- Frequency: Monthly (manual trigger)
- Scenarios: `baseline` (constant VUs), `stress` (ramping VUs), `spike` (sudden spike)
- Pass criteria: SLO-driven thresholds for p95/p99 latency and error rate
- Metrics: `vantix_load_tps`, `vantix_load_p95`, `vantix_load_errors`, `vantix_load_breakpoint_vus`

## SLO Threshold Pattern

Thresholds are generated dynamically from the client config `slos` object:

```javascript
// lib/metrics.js
export function buildThresholds(slos) {
  return {
    http_req_duration: [
      { threshold: `p(95)<${slos.latency_p95_ms}`, abortOnFail: false },
      { threshold: `p(99)<${slos.latency_p99_ms}`, abortOnFail: false },
    ],
    http_req_failed: [
      { threshold: `rate<${slos.error_rate / 100}`, abortOnFail: false },
    ],
  };
}
```

Default SLO targets (from `clients/novapay.js`):
- `latency_p95_ms: 300`
- `latency_p99_ms: 800`
- `error_rate: 0.1` (percent)
- `availability: 99.9` (percent)

## Check Patterns

**k6 inline checks:**
```javascript
const passed = check(res, {
  [`${step.name}: status ${step.expectedStatus}`]: (r) => r.status === step.expectedStatus,
});
```

**Reusable checks (lib/checks.js):**
```javascript
export function checkHealth(res) {
  return check(res, {
    'health: status 200': (r) => r.status === 200,
    'health: response < 5s': (r) => r.timings.duration < 5000,
  });
}
```

**Adding a New Client:**
1. Copy `clients/_template.js` to `clients/{client-slug}.js`
2. Fill in `baseUrl`, `healthEndpoint`, `syntheticFlow`, `loadTest`, `slos`, `tags`
3. Register the client in `lib/config.js` (import + add to `clients` registry object)
4. Run with `CLIENT={slug} k6 run scenarios/uptime.js`

---

*Testing analysis: 2026-03-20*
