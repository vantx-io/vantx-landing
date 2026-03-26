// ═══ src/lib/types.ts — Generated from Supabase schema ═══

// ═══ Notification types (declared before Database to avoid DOM Notification conflict) ═══

export type NotificationType =
  | "payment_success"
  | "payment_failed"
  | "task_updated"
  | "task_created";

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  action_link: string | null;
  created_at: string;
}

// Alias for backward compatibility — prefer AppNotification in new code
export type Notification = AppNotification;

export type NotificationPreferences = {
  id: string;
  user_id: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  digest_enabled: boolean;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: Partial<Omit<Client, "id" | "created_at" | "updated_at">> &
          Pick<Client, "name" | "short_name" | "email" | "market">;
        Update: Partial<Client>;
        Relationships: [];
      };
      users: {
        Row: User;
        Insert: Partial<Omit<User, "created_at">> &
          Pick<User, "id" | "full_name" | "email" | "role">;
        Update: Partial<User>;
        Relationships: [];
      };
      subscriptions: {
        Row: Subscription;
        Insert: Partial<Omit<Subscription, "id" | "created_at">> &
          Pick<Subscription, "client_id" | "plan" | "status">;
        Update: Partial<Subscription>;
        Relationships: [];
      };
      payments: {
        Row: Payment;
        Insert: Partial<Omit<Payment, "id" | "created_at">> &
          Pick<Payment, "client_id" | "amount" | "status">;
        Update: Partial<Payment>;
        Relationships: [];
      };
      test_results: {
        Row: TestResult;
        Insert: Partial<Omit<TestResult, "id" | "created_at">> &
          Pick<TestResult, "client_id" | "type" | "name" | "date" | "status">;
        Update: Partial<TestResult>;
        Relationships: [];
      };
      monthly_metrics: {
        Row: MonthlyMetrics;
        Insert: Partial<Omit<MonthlyMetrics, "id" | "created_at">> &
          Pick<MonthlyMetrics, "client_id" | "month">;
        Update: Partial<MonthlyMetrics>;
        Relationships: [];
      };
      weekly_metrics: {
        Row: WeeklyMetrics;
        Insert: Partial<Omit<WeeklyMetrics, "id" | "created_at">> &
          Pick<
            WeeklyMetrics,
            "client_id" | "week_start" | "week_end" | "status"
          >;
        Update: Partial<WeeklyMetrics>;
        Relationships: [];
      };
      reports: {
        Row: Report;
        Insert: Partial<Omit<Report, "id" | "created_at">> &
          Pick<
            Report,
            "client_id" | "type" | "title" | "file_url" | "file_type"
          >;
        Update: Partial<Report>;
        Relationships: [];
      };
      tasks: {
        Row: Task;
        Insert: Partial<Omit<Task, "id" | "created_at" | "updated_at">> &
          Pick<Task, "client_id" | "title" | "priority" | "status">;
        Update: Partial<Task>;
        Relationships: [];
      };
      task_comments: {
        Row: TaskComment;
        Insert: Partial<Omit<TaskComment, "id" | "created_at">> &
          Pick<TaskComment, "task_id" | "user_id" | "content">;
        Update: Partial<TaskComment>;
        Relationships: [];
      };
      incidents: {
        Row: Incident;
        Insert: Partial<Omit<Incident, "id" | "created_at">> &
          Pick<Incident, "client_id" | "severity" | "title" | "started_at">;
        Update: Partial<Incident>;
        Relationships: [];
      };
      services: {
        Row: Service;
        Insert: Partial<Omit<Service, "id">> &
          Pick<Service, "name" | "slug" | "category" | "sort_order">;
        Update: Partial<Service>;
        Relationships: [];
      };
      tutorials: {
        Row: Tutorial;
        Insert: Partial<Omit<Tutorial, "id" | "created_at">> &
          Pick<
            Tutorial,
            | "title"
            | "slug"
            | "category"
            | "content_md"
            | "difficulty"
            | "sort_order"
          >;
        Update: Partial<Tutorial>;
        Relationships: [];
      };
      notifications: {
        Row: AppNotification;
        Insert: Partial<Omit<AppNotification, "id" | "created_at">> &
          Pick<AppNotification, "user_id" | "type" | "title" | "body">;
        Update: Partial<AppNotification>;
        Relationships: [];
      };
      notification_preferences: {
        Row: NotificationPreferences;
        Insert: Partial<Omit<NotificationPreferences, "id" | "updated_at">> &
          Pick<NotificationPreferences, "user_id">;
        Update: Partial<NotificationPreferences>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
  };
};

export type Client = {
  id: string;
  name: string;
  short_name: string;
  email: string;
  market: "US" | "LATAM";
  stack: string | null;
  infra: string | null;
  services: string[] | null;
  logo_url: string | null;
  grafana_org_id: string | null;
  slack_channel: string | null;
  trello_board_id: string | null;
  is_pilot: boolean;
  status: "active" | "paused" | "cancelled" | "prospect";
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  client_id: string | null;
  full_name: string;
  email: string;
  role: "admin" | "engineer" | "seller" | "client";
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type Subscription = {
  id: string;
  client_id: string;
  plan: "checkup" | "retainer" | "custom";
  status: "active" | "paused" | "cancelled" | "trial" | "pending";
  price_monthly: number | null;
  currency: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  started_at: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  pilot_discount_pct: number;
  commitment_months: number;
  created_at: string;
};

export type Payment = {
  id: string;
  client_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  description: string | null;
  paid_at: string | null;
  created_at: string;
};

export type TestScenario = {
  name: string;
  vus: number;
  duration: string;
  tps: number;
  p50: number;
  p95: number;
  p99: number;
  errors: number;
};
export type Finding = {
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  component: string;
  problem: string;
  impact: string;
  action: string;
};

export type TestResult = {
  id: string;
  client_id: string;
  type: "load_test" | "web_performance" | "checkup" | "evaluation_monthly";
  name: string;
  date: string;
  status: "running" | "completed" | "failed" | "scheduled";
  scenarios: TestScenario[] | null;
  breakpoint_vus: number | null;
  breakpoint_tps: number | null;
  max_tps: number | null;
  lcp_ms: number | null;
  fid_ms: number | null;
  cls: number | null;
  lighthouse_score: number | null;
  bundle_size_kb: number | null;
  tti_ms: number | null;
  slo_compliance: Record<string, any> | null;
  summary: string | null;
  findings: Finding[] | null;
  report_url: string | null;
  loom_url: string | null;
  raw_data_url: string | null;
  k6_script_url: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
};

export type MonthlyMetrics = {
  id: string;
  client_id: string;
  month: string;
  uptime_pct: number | null;
  p50_latency_ms: number | null;
  p95_latency_ms: number | null;
  p99_latency_ms: number | null;
  error_rate_pct: number | null;
  peak_tps: number | null;
  avg_tps: number | null;
  incidents_p1: number;
  incidents_p2: number;
  incidents_p3: number;
  optimizations_count: number;
  alerts_active: number | null;
  alerts_false_positive_pct: number | null;
  lcp_ms: number | null;
  lighthouse_score: number | null;
  capacity_headroom_pct: number | null;
  created_at: string;
};

export type WeeklyMetrics = {
  id: string;
  client_id: string;
  week_start: string;
  week_end: string;
  uptime_pct: number | null;
  p95_latency_ms: number | null;
  error_rate_pct: number | null;
  peak_tps: number | null;
  incidents: number;
  anomalies: string[] | null;
  optimizations: string[] | null;
  status: "healthy" | "warning" | "critical";
  created_at: string;
};

export type Report = {
  id: string;
  client_id: string;
  test_result_id: string | null;
  type:
    | "checkup"
    | "monthly"
    | "weekly"
    | "evaluation"
    | "incident_rca"
    | "capacity_plan";
  title: string;
  period: string | null;
  file_url: string;
  file_type: "pdf" | "docx" | "xlsx" | "pptx";
  file_size_bytes: number | null;
  loom_url: string | null;
  is_draft: boolean;
  published_at: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  type:
    | "request"
    | "incident"
    | "optimization"
    | "investigation"
    | "deliverable";
  priority: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "waiting_client" | "completed" | "cancelled";
  assigned_to: string | null;
  trello_card_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskComment = {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  attachments: string[] | null;
  created_at: string;
};

export type Incident = {
  id: string;
  client_id: string;
  severity: "P1" | "P2" | "P3";
  title: string;
  description: string | null;
  duration_minutes: number | null;
  impact: string | null;
  root_cause: string | null;
  resolution: string | null;
  preventive_action: string | null;
  started_at: string;
  resolved_at: string | null;
  rca_report_url: string | null;
  created_at: string;
};

export type Service = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category: "core" | "addon" | "training";
  price_us: number | null;
  price_latam: number | null;
  price_pilot_us: number | null;
  price_pilot_latam: number | null;
  delivery_days: number | null;
  is_recurring: boolean;
  is_active: boolean;
  features: { text: string }[] | null;
  sla:
    | {
        metric: string;
        target: string;
        measurement?: string;
        penalty?: string;
      }[]
    | null;
  sort_order: number;
};

export type Tutorial = {
  id: string;
  title: string;
  slug: string;
  category:
    | "interpretar_resultados"
    | "load_testing"
    | "web_performance"
    | "observability"
    | "capacity_planning"
    | "getting_started";
  content_md: string;
  loom_url: string | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  reading_time_min: number | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
};

// ═══ Onboarding types ═══

export interface OnboardingStepResult {
  step: string;
  status: "success" | "skipped" | "failed";
  message: string;
  data?: Record<string, any>;
}

export interface OnboardingResult {
  clientId: string;
  overall: "success" | "partial" | "failed";
  steps: OnboardingStepResult[];
  grafanaUrl?: string;
  slackChannel?: string;
  faroSnippet?: string;
  startedAt: string;
  completedAt: string;
}

export interface GrafanaStackConfig {
  stackSlug: string;
  stackId: number;
  orgId: number;
  grafanaUrl: string;
  prometheusUrl: string;
  lokiUrl: string;
  tempoUrl: string;
  prometheusUserId: number;
  lokiUserId: number;
  tempoUserId: number;
}

export interface GrafanaApiKeys {
  metricsPublishKey: string;
  faroCollectorKey: string;
}

export interface FaroConfig {
  appKey: string;
  sdkSnippet: string;
  collectorUrl: string;
}
