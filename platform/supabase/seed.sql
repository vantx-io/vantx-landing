-- ═══════════════════════════════════════
-- SEED: Demo clients, users, and data
-- ═══════════════════════════════════════

-- Clients
INSERT INTO clients (id, name, short_name, email, market, stack, infra, services, slack_channel, is_pilot, status) VALUES
('11111111-1111-1111-1111-111111111111', 'NovaPay SpA', 'NovaPay', 'info@novapay.cl', 'LATAM', 'Java 17 / Spring Boot 3.2 / PostgreSQL 15 / Redis 7', 'AWS EKS 1.28 — 3x m5.xlarge, RDS r6g.xlarge, ElastiCache', ARRAY['payment-gateway','settlement-service','merchant-validation','checkout-web'], '#vantix-novapay', true, 'active'),
('22222222-2222-2222-2222-222222222222', 'ScaleApp Inc', 'ScaleApp', 'info@scaleapp.io', 'US', 'Node.js 20 / Next.js 14 / PostgreSQL 16 / Redis', 'AWS ECS Fargate — 4 tasks, Aurora Serverless v2', ARRAY['api-gateway','user-service','billing-service','web-app'], '#vantix-scaleapp', true, 'active');

-- Subscriptions
INSERT INTO subscriptions (client_id, plan, status, price_monthly, pilot_discount_pct, started_at, current_period_start, current_period_end) VALUES
('11111111-1111-1111-1111-111111111111', 'retainer', 'active', 2100, 25, '2026-03-01', '2026-05-01', '2026-06-01'),
('22222222-2222-2222-2222-222222222222', 'checkup', 'active', 4125, 25, '2026-04-01', '2026-04-01', '2026-04-06');

-- Payments (NovaPay)
INSERT INTO payments (client_id, amount, status, description, paid_at) VALUES
('11111111-1111-1111-1111-111111111111', 2625, 'paid', 'Performance Checkup (piloto -25%)', '2026-03-10'),
('11111111-1111-1111-1111-111111111111', 2100, 'paid', 'Retainer SRE — Marzo 2026', '2026-03-05'),
('11111111-1111-1111-1111-111111111111', 2100, 'paid', 'Retainer SRE — Abril 2026', '2026-04-05'),
('11111111-1111-1111-1111-111111111111', 2100, 'pending', 'Retainer SRE — Mayo 2026', NULL);

-- Test Results (NovaPay)
INSERT INTO test_results (client_id, type, name, date, status, scenarios, breakpoint_vus, breakpoint_tps, max_tps, lcp_ms, lighthouse_score, bundle_size_kb, summary, findings) VALUES
('11111111-1111-1111-1111-111111111111', 'checkup', 'Performance Checkup Inicial', '2026-03-14', 'completed',
 '[{"name":"Smoke","vus":10,"duration":"2m","tps":45,"p50":89,"p95":156,"p99":210,"errors":0.00},{"name":"Ramp-up","vus":200,"duration":"10m","tps":320,"p50":142,"p95":380,"p99":1100,"errors":0.12},{"name":"Stress","vus":500,"duration":"15m","tps":318,"p50":890,"p95":4200,"p99":12400,"errors":8.7}]',
 280, 320, 320, 3800, 54, 2150,
 'Capacidad real limitada a 320 TPS por queries sin índice y connection pool subdimensionado. Gap de 42% vs capacidad esperada.',
 '[{"title":"Queries sin índice settlement-service","severity":"CRITICAL","component":"settlement-service → PostgreSQL","problem":"Sequential scan 2.3M filas","impact":"Limita TPS a 320","action":"CREATE INDEX en (merchant_id, status, created_at)"},{"title":"HikariCP subdimensionado","severity":"CRITICAL","component":"Connection Pool","problem":"Pool=10, necesita 30+","impact":"Timeouts sobre 280 VUs","action":"maximumPoolSize=30, timeout=5000"},{"title":"merchant-validation sin caché","severity":"HIGH","component":"merchant-validation","problem":"8K queries/min datos estáticos","impact":"30% carga BD innecesaria","action":"Caché Redis TTL 1h"}]'
),
('11111111-1111-1111-1111-111111111111', 'evaluation_monthly', 'Evaluación Abril 2026', '2026-04-08', 'completed',
 '[{"name":"Baseline","vus":200,"duration":"10m","tps":510,"p50":95,"p95":195,"p99":320,"errors":0.01},{"name":"Stress","vus":400,"duration":"15m","tps":508,"p50":140,"p95":310,"p99":680,"errors":0.08},{"name":"Stress High","vus":600,"duration":"10m","tps":495,"p50":420,"p95":890,"p99":2100,"errors":2.1}]',
 550, 510, 510, 3600, 58, 2150,
 'Post-fixes: throughput +59% (320→510 TPS). Nuevo breakpoint a 550 VUs. Web performance pendiente mejora.',
 '[]'
),
('11111111-1111-1111-1111-111111111111', 'evaluation_monthly', 'Evaluación Mayo 2026', '2026-05-10', 'scheduled',
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
);

-- Monthly Metrics (NovaPay)
INSERT INTO monthly_metrics (client_id, month, uptime_pct, p50_latency_ms, p95_latency_ms, p99_latency_ms, error_rate_pct, peak_tps, avg_tps, incidents_p1, incidents_p2, optimizations_count, alerts_active, alerts_false_positive_pct, lcp_ms, lighthouse_score, capacity_headroom_pct) VALUES
('11111111-1111-1111-1111-111111111111', '2026-03-01', 99.91, 142, 380, 1100, 0.12, 320, 180, 0, 0, 0, 6, 12.0, 3800, 54, 78),
('11111111-1111-1111-1111-111111111111', '2026-04-01', 99.97, 95, 195, 420, 0.03, 510, 210, 0, 1, 4, 12, 3.8, 3600, 58, 143);

-- Weekly Metrics (NovaPay - April)
INSERT INTO weekly_metrics (client_id, week_start, week_end, uptime_pct, p95_latency_ms, error_rate_pct, peak_tps, incidents, anomalies, optimizations, status) VALUES
('11111111-1111-1111-1111-111111111111', '2026-03-31', '2026-04-04', 99.98, 198, 0.03, 290, 0, ARRAY[]::text[], ARRAY['Post-fix index verification'], 'healthy'),
('11111111-1111-1111-1111-111111111111', '2026-04-07', '2026-04-11', 99.99, 187, 0.02, 312, 0, ARRAY['Slow query nocturna 890ms','Redis hit rate bajó a 87%'], ARRAY['Slow query optimizada: 890ms→45ms','Redis TTL 1h→2h'], 'healthy'),
('11111111-1111-1111-1111-111111111111', '2026-04-14', '2026-04-18', 99.94, 210, 0.08, 385, 1, ARRAY['Spike tráfico campaña marketing'], ARRAY['HPA minReplicas 3→4','Alerta p95>300ms agregada'], 'warning'),
('11111111-1111-1111-1111-111111111111', '2026-04-21', '2026-04-25', 99.99, 192, 0.02, 305, 0, ARRAY[]::text[], ARRAY['Slow query log configurado'], 'healthy'),
('11111111-1111-1111-1111-111111111111', '2026-04-28', '2026-05-02', 99.99, 189, 0.01, 298, 0, ARRAY[]::text[], ARRAY[]::text[], 'healthy');

-- Reports (NovaPay)
INSERT INTO reports (client_id, type, title, period, file_url, file_type, loom_url, published_at) VALUES
('11111111-1111-1111-1111-111111111111', 'checkup', 'Performance Checkup — NovaPay', 'Marzo 2026', '/reports/novapay-checkup-marzo2026.pdf', 'pdf', 'https://loom.com/share/demo-checkup', '2026-03-14'),
('11111111-1111-1111-1111-111111111111', 'monthly', 'Informe Mensual — Abril 2026', 'Abril 2026', '/reports/novapay-monthly-abril2026.pdf', 'pdf', 'https://loom.com/share/demo-monthly', '2026-05-05'),
('11111111-1111-1111-1111-111111111111', 'weekly', 'Reporte Semanal S14', '7-11 Abril 2026', '/reports/novapay-weekly-s14.pdf', 'pdf', NULL, '2026-04-14'),
('11111111-1111-1111-1111-111111111111', 'weekly', 'Reporte Semanal S15', '14-18 Abril 2026', '/reports/novapay-weekly-s15.pdf', 'pdf', NULL, '2026-04-21'),
('11111111-1111-1111-1111-111111111111', 'evaluation', 'Evaluación Performance Abril', 'Abril 2026', '/reports/novapay-eval-abril2026.xlsx', 'xlsx', NULL, '2026-04-12');

-- Tasks (NovaPay)
INSERT INTO tasks (client_id, title, description, type, priority, status, due_date) VALUES
('11111111-1111-1111-1111-111111111111', 'Code splitting checkout', 'Implementar code splitting por ruta en checkout-web. Reemplazar moment.js con date-fns. Target: bundle < 500KB, LCP < 2.0s.', 'optimization', 'high', 'in_progress', '2026-05-15'),
('11111111-1111-1111-1111-111111111111', 'Instrumentar Datadog en settlement-service', 'Agregar Datadog APM tracing a settlement-service para correlación e2e.', 'optimization', 'medium', 'open', '2026-05-20'),
('11111111-1111-1111-1111-111111111111', 'Definir SLOs formales', 'Definir SLOs para availability (99.9%), latency p95 (<300ms), error rate (<0.1%). Configurar error budget tracking.', 'deliverable', 'medium', 'open', '2026-05-30'),
('11111111-1111-1111-1111-111111111111', 'Investigar spike latencia 18/04', 'RCA del incidente P2 del 18 de abril. Spike por campaña marketing no comunicada.', 'incident', 'high', 'completed', '2026-04-19');

-- Task Comments (inserted by seed-demo.js after auth users are created)

-- Incidents (NovaPay)
INSERT INTO incidents (client_id, severity, title, description, duration_minutes, impact, root_cause, resolution, preventive_action, started_at, resolved_at) VALUES
('11111111-1111-1111-1111-111111111111', 'P2', 'Spike latencia por campaña marketing', 'p95 subió a 1200ms durante 4 minutos', 4, '0.3% requests con timeout', 'Spike 3x tráfico por campaña email no comunicada. HikariCP pool saturado momentáneamente.', 'EKS autoscaler agregó 2 pods en 90s. Tráfico se distribuyó.', 'Canal Slack #novapay-marketing-alerts. Pre-escalado HPA minReplicas 3→4.', '2026-04-18 14:22:00+00', '2026-04-18 14:26:00+00');
