-- ═══════════════════════════════════════════════════════
-- VANTIX CONSULTING — SUPABASE SCHEMA
-- Portal de clientes, suscripciones, resultados, tareas
-- ═══════════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══ CLIENTS ═══
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  email TEXT NOT NULL,
  market TEXT NOT NULL CHECK (market IN ('US', 'LATAM')),
  stack TEXT,
  infra TEXT,
  services TEXT[],
  logo_url TEXT,
  grafana_org_id TEXT,
  slack_channel TEXT,
  trello_board_id TEXT,
  is_pilot BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'prospect')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ USERS (linked to Supabase Auth) ═══
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'client' CHECK (role IN ('admin', 'engineer', 'seller', 'client')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ SUBSCRIPTIONS ═══
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  plan TEXT NOT NULL CHECK (plan IN ('checkup', 'retainer', 'retainer_perf', 'oaas_baseline', 'oaas_gestion', 'fractional_2d', 'fractional_4d', 'custom')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'trial', 'pending')),
  price_monthly NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  pilot_discount_pct NUMERIC(5,2) DEFAULT 0,
  commitment_months INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ PAYMENTS ═══
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  subscription_id UUID REFERENCES subscriptions(id),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  description TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ PERFORMANCE TEST RESULTS ═══
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  type TEXT NOT NULL CHECK (type IN ('load_test', 'web_performance', 'checkup', 'evaluation_monthly')),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed', 'scheduled')),
  -- Load test metrics
  scenarios JSONB, -- [{name, vus, duration, tps, p50, p95, p99, errors}]
  breakpoint_vus INTEGER,
  breakpoint_tps INTEGER,
  max_tps INTEGER,
  -- Web performance metrics
  lcp_ms INTEGER,
  fid_ms INTEGER,
  cls NUMERIC(5,3),
  lighthouse_score INTEGER,
  bundle_size_kb INTEGER,
  tti_ms INTEGER,
  -- SLO compliance
  slo_compliance JSONB, -- {uptime: {target, actual, pass}, latency: {...}, ...}
  -- General
  summary TEXT,
  findings JSONB, -- [{title, severity, component, problem, impact, action}]
  report_url TEXT,
  loom_url TEXT,
  raw_data_url TEXT,
  k6_script_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ MONTHLY METRICS (trending) ═══
CREATE TABLE monthly_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  month DATE NOT NULL, -- first day of month
  uptime_pct NUMERIC(6,3),
  p50_latency_ms INTEGER,
  p95_latency_ms INTEGER,
  p99_latency_ms INTEGER,
  error_rate_pct NUMERIC(6,3),
  peak_tps INTEGER,
  avg_tps INTEGER,
  incidents_p1 INTEGER DEFAULT 0,
  incidents_p2 INTEGER DEFAULT 0,
  incidents_p3 INTEGER DEFAULT 0,
  optimizations_count INTEGER DEFAULT 0,
  alerts_active INTEGER,
  alerts_false_positive_pct NUMERIC(5,2),
  lcp_ms INTEGER,
  lighthouse_score INTEGER,
  capacity_headroom_pct NUMERIC(5,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, month)
);

-- ═══ WEEKLY METRICS ═══
CREATE TABLE weekly_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  uptime_pct NUMERIC(6,3),
  p95_latency_ms INTEGER,
  error_rate_pct NUMERIC(6,3),
  peak_tps INTEGER,
  incidents INTEGER DEFAULT 0,
  anomalies TEXT[],
  optimizations TEXT[],
  status TEXT DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, week_start)
);

-- ═══ REPORTS (downloadable) ═══
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  test_result_id UUID REFERENCES test_results(id),
  type TEXT NOT NULL CHECK (type IN ('checkup', 'monthly', 'weekly', 'evaluation', 'incident_rca', 'capacity_plan')),
  title TEXT NOT NULL,
  period TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'pdf' CHECK (file_type IN ('pdf', 'docx', 'xlsx', 'pptx')),
  file_size_bytes INTEGER,
  loom_url TEXT,
  is_draft BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ TASKS / REQUESTS ═══
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'request' CHECK (type IN ('request', 'incident', 'optimization', 'investigation', 'deliverable')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_client', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES users(id),
  trello_card_id TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ COMMENTS (on tasks) ═══
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ INCIDENTS ═══
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  severity TEXT NOT NULL CHECK (severity IN ('P1', 'P2', 'P3')),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  impact TEXT,
  root_cause TEXT,
  resolution TEXT,
  preventive_action TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  rca_report_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ SERVICES CATALOG ═══
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  category TEXT CHECK (category IN ('core', 'addon', 'training')),
  price_us NUMERIC(10,2),
  price_latam NUMERIC(10,2),
  price_pilot_us NUMERIC(10,2),
  price_pilot_latam NUMERIC(10,2),
  delivery_days INTEGER,
  is_recurring BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  features JSONB, -- [{text: "..."}]
  sla JSONB, -- [{metric, target, measurement, penalty}]
  sort_order INTEGER DEFAULT 0
);

-- ═══ TUTORIALS ═══
CREATE TABLE tutorials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT CHECK (category IN ('interpretar_resultados', 'load_testing', 'web_performance', 'observability', 'capacity_planning', 'getting_started')),
  content_md TEXT NOT NULL,
  loom_url TEXT,
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  reading_time_min INTEGER,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ ROW LEVEL SECURITY ═══
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Clients can only see their own data
CREATE POLICY "Users see own client data" ON clients FOR SELECT
  USING (id = (SELECT client_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users see own subscriptions" ON subscriptions FOR SELECT
  USING (client_id = (SELECT client_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users see own payments" ON payments FOR SELECT
  USING (client_id = (SELECT client_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users see own test results" ON test_results FOR SELECT
  USING (client_id = (SELECT client_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users see own reports" ON reports FOR SELECT
  USING (client_id = (SELECT client_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users see own tasks" ON tasks FOR SELECT
  USING (client_id = (SELECT client_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can comment on own tasks" ON task_comments FOR ALL
  USING (task_id IN (SELECT id FROM tasks WHERE client_id = (SELECT client_id FROM users WHERE id = auth.uid())));

-- Admins/engineers see everything
CREATE POLICY "Admins see all clients" ON clients FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer'));

CREATE POLICY "Admins see all tasks" ON tasks FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer'));

-- Public read for services and tutorials
CREATE POLICY "Anyone can read services" ON services FOR SELECT USING (true);
CREATE POLICY "Anyone can read tutorials" ON tutorials FOR SELECT USING (is_published = true);

-- ═══ SEED DATA: SERVICES ═══
INSERT INTO services (name, slug, description, short_description, category, price_us, price_latam, price_pilot_us, price_pilot_latam, delivery_days, is_recurring, features, sla, sort_order) VALUES
('Performance Checkup', 'checkup', 'Evaluación completa de performance en 5 días. Arquitectura, monitoreo, prueba de carga, web performance, y roadmap priorizado.', 'Evaluación completa en 5 días', 'core', 5500, 3500, 4125, 2625, 5, false,
 '[{"text":"Review de arquitectura e infraestructura"},{"text":"Análisis de monitoreo actual"},{"text":"Prueba de carga + web performance"},{"text":"Heat map de bottlenecks"},{"text":"Roadmap priorizado"},{"text":"Informe PDF + video Loom"}]',
 '[{"metric":"Entrega","target":"5 días hábiles","penalty":"10% dcto/día atraso"}]', 1),

('Retainer Performance Mensual', 'retainer', 'Monitoreo proactivo, evaluación de performance mensual, optimización continua, soporte ante incidentes. 100% async.', 'Tu equipo SRE dedicado, async', 'core', 4500, 2800, 3375, 2100, null, true,
 '[{"text":"Revisión semanal + reporte async"},{"text":"Evaluación de performance mensual"},{"text":"Optimización proactiva continua"},{"text":"Soporte incidentes mismo día hábil"},{"text":"Video Loom mensual"},{"text":"Capacity planning"},{"text":"Knowledge base actualizada"}]',
 '[{"metric":"Reporte semanal","target":"Cada lunes"},{"metric":"Soporte incidentes","target":"Mismo día hábil"},{"metric":"Evaluación mensual","target":"Primeros 10 días del mes"}]', 2),

('Consultoría de Observabilidad (Standalone)', 'observability', 'Implementación de stack de observabilidad: OpenTelemetry, Grafana, Prometheus. Dashboards, alertas, SLOs.', 'Stack de observabilidad profesional', 'addon', 15000, 9500, 11250, 7125, 20, false,
 '[{"text":"Diseño de arquitectura de observabilidad"},{"text":"Instrumentación OpenTelemetry (hasta 5 servicios)"},{"text":"10-15 dashboards Grafana"},{"text":"Alertas tiered + runbooks"},{"text":"Workshop de training 2h"},{"text":"30 días soporte post-entrega"}]',
 '[{"metric":"Entrega","target":"20 días hábiles","penalty":"10% crédito/semana atraso"}]', 3),

('Load Testing Sprint', 'load-testing', 'Sprint de 2-3 semanas de prueba de carga completa con k6. Diseño, ejecución, y reporte.', 'Prueba de carga profesional con k6', 'addon', 8500, 5500, 6375, 4125, 15, false,
 '[{"text":"Diseño de escenarios"},{"text":"Scripts k6 production-ready"},{"text":"Dashboards Grafana real-time"},{"text":"3 ciclos: baseline + stress + spike"},{"text":"Informe 20-40 págs"},{"text":"1 re-test incluido"}]',
 '[{"metric":"Entrega","target":"15 días hábiles","penalty":"10% crédito/semana"}]', 4),

('Web Performance Audit', 'web-perf', 'Auditoría completa de Core Web Vitals, Lighthouse, bundle analysis, y plan de optimización.', 'Core Web Vitals + Lighthouse audit', 'addon', 3000, 2000, 2250, 1500, 5, false,
 '[{"text":"Core Web Vitals analysis"},{"text":"Lighthouse deep dive"},{"text":"Bundle analysis + tree shaking plan"},{"text":"Rendering performance"},{"text":"CDN/caching optimization"},{"text":"Roadmap priorizado"}]', null, 5),

('Training: Interpretación de Resultados', 'training-results', 'Workshop de 2 horas sobre cómo leer e interpretar métricas de performance, dashboards, y resultados de load testing.', 'Aprende a leer tus métricas', 'training', 1500, 1000, 1125, 750, 1, false,
 '[{"text":"Cómo leer métricas de latencia (p50/p95/p99)"},{"text":"Interpretar resultados de k6"},{"text":"Core Web Vitals: qué significan y cómo mejorarlos"},{"text":"Dashboards Grafana: qué mirar"},{"text":"SLOs/SLIs: definición y tracking"},{"text":"Grabación incluida"}]', null, 6),

('Training: k6 para tu equipo', 'training-k6', 'Workshop de 3 horas sobre k6: desde lo básico hasta escenarios avanzados, thresholds, y CI/CD integration.', 'Load testing con k6 hands-on', 'training', 2000, 1200, 1500, 900, 1, false,
 '[{"text":"k6 desde cero: instalación y primer script"},{"text":"Escenarios avanzados: ramp-up, spike, soak"},{"text":"Thresholds y checks automáticos"},{"text":"Data feeders y parametrización"},{"text":"Integración CI/CD (GitHub Actions)"},{"text":"Grafana + k6 real-time"},{"text":"Grabación incluida"}]', null, 7),

('Observability Baseline', 'oaas-baseline', 'Implementación de stack de observabilidad en 3-4 semanas: auditoría, instrumentación OpenTelemetry, dashboards Grafana opinionados, alertas útiles, y SLOs alineados al negocio.', 'De caótico a funcional en 3 semanas', 'core', 15000, 9500, 11250, 7125, 20, false,
 '[{"text":"Auditoría de stack actual"},{"text":"Instrumentación OpenTelemetry (hasta 5 servicios)"},{"text":"10-15 dashboards Grafana opinionados"},{"text":"Alert rules tiered + runbooks"},{"text":"SLOs + error budget + burn rate alerting"},{"text":"Telemetry strategy document"},{"text":"Call kick-off + call entrega (15 min c/u)"}]',
 '[{"metric":"Entrega","target":"3-4 semanas","penalty":"10% crédito/semana atraso"}]', 8),

('Observability Gestión Continua', 'oaas-gestion', 'Gestión mensual de tu stack de observabilidad. Review de alertas, onboarding servicios, optimización de costos de telemetría, mejora continua de instrumentación.', 'Tu observabilidad mejora cada mes', 'core', 5500, 3500, 4125, 2625, null, true,
 '[{"text":"Review mensual de alertas (false positives, gaps)"},{"text":"Onboarding de nuevos servicios"},{"text":"Optimización de costos de telemetría"},{"text":"Mejora continua de instrumentación"},{"text":"Workshop trimestral (2h, grabado)"},{"text":"Video meet mensual opcional"},{"text":"Soporte por Slack"}]',
 '[{"metric":"Review alertas","target":"Mensual"},{"metric":"Workshop","target":"Trimestral"}]', 9),

('Fractional Performance & SRE (2 días/sem)', 'fractional-2d', 'Senior Performance Engineer / SRE embebido con tu equipo 2 días por semana. Load testing, profiling, QA automation, SRE practices, training hands-on.', 'Senior SRE embebido 2 días/semana', 'core', 6500, 4000, 4875, 3000, null, true,
 '[{"text":"Embebido 2 días/semana (remoto)"},{"text":"Load testing + profiling + optimization"},{"text":"QA automation (Playwright, k6)"},{"text":"SLOs, incident response, postmortems"},{"text":"Training hands-on para tu equipo"},{"text":"Acceso directo por Slack"},{"text":"Onboarding en 1 semana"}]',
 '[{"metric":"Disponibilidad","target":"2 días/semana"},{"metric":"Respuesta Slack","target":"Mismo día hábil"}]', 10),

('Fractional Performance & SRE (4 días/sem)', 'fractional-4d', 'Senior Performance Engineer / SRE embebido con tu equipo 4 días por semana. Dedicación casi full-time, máximo impacto en reliability y performance.', 'Senior SRE embebido 4 días/semana', 'core', 11000, 7000, 8250, 5250, null, true,
 '[{"text":"Embebido 4 días/semana (remoto)"},{"text":"Todo lo del plan 2d/sem"},{"text":"Chaos engineering (si madurez lo permite)"},{"text":"CI/CD performance gates"},{"text":"Mentoring 1:1 para engineers"},{"text":"Participación en planning + PR reviews"},{"text":"Architecture decision records"}]',
 '[{"metric":"Disponibilidad","target":"4 días/semana"},{"metric":"Respuesta Slack","target":"Mismo día"}]', 11),

('Training: SRE Practices', 'training-sre', 'Workshop de 3 horas sobre prácticas SRE: SLOs/SLIs, incident response, postmortems blameless, error budgets, on-call rotation.', 'SLOs + incidents + on-call', 'training', 2500, 1500, 1875, 1125, 1, false,
 '[{"text":"SLOs / SLIs: definición práctica"},{"text":"Error budgets y burn rate"},{"text":"Incident response framework"},{"text":"Postmortems blameless"},{"text":"On-call rotation design"},{"text":"Grabación incluida"}]', null, 12),

('Training: Grafana + OpenTelemetry', 'training-grafana-otel', 'Workshop de 4 horas sobre instrumentación con OpenTelemetry y dashboards Grafana. Hands-on con tu stack real.', 'Instrumentación + dashboards hands-on', 'training', 3000, 2000, 2250, 1500, 1, false,
 '[{"text":"OpenTelemetry: traces, métricas, logs"},{"text":"Instrumentación de servicios (Java, Node, Python)"},{"text":"Grafana: dashboards desde cero"},{"text":"Prometheus queries (PromQL)"},{"text":"Alerting rules + notification channels"},{"text":"Práctica con tu stack real"},{"text":"Grabación incluida"}]', null, 13);

-- ═══ SEED DATA: TUTORIALS ═══
INSERT INTO tutorials (title, slug, category, content_md, difficulty, reading_time_min, sort_order) VALUES
('Cómo interpretar latencia p50, p95 y p99', 'interpretar-latencia', 'interpretar_resultados',
'## ¿Qué significa p50, p95 y p99?

Los percentiles de latencia te dicen cuánto tiempo tardan las requests de tus usuarios:

- **p50 (mediana)**: El 50% de las requests son más rápidas que este valor. Es tu "experiencia típica".
- **p95**: El 95% son más rápidas. Este es el valor que más importa para SLOs.
- **p99**: El 99% son más rápidas. Muestra los peores casos (colas, timeouts, retries).

## ¿Por qué el promedio no sirve?

El promedio esconde los outliers. Si 99 requests tardan 100ms y 1 tarda 10,000ms, el promedio es 199ms — parece OK. Pero el p99 es 10,000ms — un usuario está sufriendo.

## ¿Qué valores son buenos?

| Tipo de app | p50 target | p95 target | p99 target |
|-------------|-----------|-----------|-----------|
| API REST | < 100ms | < 300ms | < 800ms |
| Web page | < 200ms | < 500ms | < 1,500ms |
| Background job | < 1s | < 5s | < 15s |

## Señales de alerta

- **p95 > 3x p50**: Tienes un cuello de botella intermitente (connection pool, GC, lock contention)
- **p99 > 10x p50**: Hay un componente que falla bajo carga (timeout, retry storm)
- **p50 subiendo gradualmente**: Degradación lenta — probablemente tabla creciendo sin índice

## En tu dashboard de Grafana

Busca el panel "Latency Distribution". Si ves que p95 y p99 se separan mucho del p50, es hora de investigar. El equipo Vantix incluye esta métrica en cada reporte semanal.',
'beginner', 5, 1),

('Cómo leer un reporte de prueba de carga k6', 'leer-reporte-k6', 'load_testing',
'## Anatomía de un reporte k6

Cada reporte de prueba de carga que entregamos tiene estas secciones:

### 1. Escenarios ejecutados
Una tabla con: nombre del escenario, VUs (usuarios virtuales), duración, y endpoints testeados.

**VUs no son usuarios reales**. Un VU ejecuta requests en loop. 200 VUs con 5 requests/s cada uno = 1,000 TPS teóricos.

### 2. Resultados por escenario
- **TPS (Throughput)**: Requests por segundo que el sistema procesó. Más alto = mejor, hasta el punto de quiebre.
- **Latencia (p50/p95/p99)**: Cuánto tardó cada request. Si sube mucho con más VUs, hay un bottleneck.
- **Error Rate**: Porcentaje de requests que fallaron. > 0.1% es preocupante. > 1% es crítico.

### 3. Punto de quiebre
El número de VUs donde el sistema empieza a degradar. Esto te dice tu **capacidad real**.

Ejemplo: Si tu punto de quiebre es 280 VUs a 320 TPS, pero esperas 1,000 TPS en Black Friday, necesitas optimizar o escalar 3x.

### 4. Thresholds (pass/fail)
Cada escenario tiene criterios de aceptación predefinidos. Si dice FAIL, hay un problema que resolver antes del evento.

## Qué hacer con los resultados

1. **Todo PASS**: Tu plataforma está lista. El informe documenta la capacidad para referencia futura.
2. **Algunos FAIL**: Revisa el roadmap del reporte. Los items P0 son los que debes arreglar primero.
3. **Muchos FAIL**: Hay problemas estructurales. El Retainer SRE es la mejor opción para resolverlos de forma continua.',
'beginner', 7, 2),

('Core Web Vitals: Qué son y por qué importan', 'core-web-vitals', 'web_performance',
'## Las 3 métricas que Google usa para rankear tu sitio

### LCP (Largest Contentful Paint)
Cuánto tarda en aparecer el contenido principal de la página.
- **Bueno**: < 2.5s
- **Necesita mejora**: 2.5 - 4.0s
- **Malo**: > 4.0s

Causas comunes de LCP alto: imágenes sin optimizar, bundles JS grandes, servidor lento, sin CDN.

### FID (First Input Delay)
Cuánto tarda la página en responder al primer click del usuario.
- **Bueno**: < 100ms
- **Necesita mejora**: 100 - 300ms
- **Malo**: > 300ms

Causas comunes: JavaScript bloqueando el main thread, hydration lenta en React/Next.js.

### CLS (Cumulative Layout Shift)
Cuánto se mueve el contenido mientras carga (banners que empujan texto, imágenes sin dimensiones).
- **Bueno**: < 0.1
- **Necesita mejora**: 0.1 - 0.25
- **Malo**: > 0.25

## Cómo lo medimos

Usamos Lighthouse (lab data) y Chrome UX Report (field data). El reporte mensual incluye ambos. Si Lighthouse dice 90 pero field data dice 60, el problema es que en dispositivos reales de tus usuarios la experiencia es peor que en tu MacBook Pro.',
'beginner', 6, 3);

-- ═══ INDEXES ═══
CREATE INDEX idx_test_results_client_date ON test_results(client_id, date DESC);
CREATE INDEX idx_monthly_metrics_client ON monthly_metrics(client_id, month DESC);
CREATE INDEX idx_weekly_metrics_client ON weekly_metrics(client_id, week_start DESC);
CREATE INDEX idx_reports_client ON reports(client_id, created_at DESC);
CREATE INDEX idx_tasks_client_status ON tasks(client_id, status);
CREATE INDEX idx_payments_client ON payments(client_id, created_at DESC);
CREATE INDEX idx_subscriptions_client ON subscriptions(client_id);

-- ═══ UPDATED_AT TRIGGER ═══
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Mark services that are not yet launched
UPDATE services SET is_active = false WHERE slug IN ('oaas-baseline', 'oaas-gestion', 'fractional-2d', 'fractional-4d', 'observability');
