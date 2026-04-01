import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ─── Mock @/lib/email ───────────────────────────────────────────────────────
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: "mock-id" }),
}));

// ─── Mock @/lib/slack ───────────────────────────────────────────────────────
vi.mock("@/lib/slack", () => ({
  sendTaskCreatedMessage: vi.fn().mockResolvedValue(undefined),
}));

import { notifyTaskEvent } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { sendTaskCreatedMessage } from "@/lib/slack";

// ─── Mock supabase builder ─────────────────────────────────────────────────

function makeMockTask(overrides: Record<string, any> = {}) {
  return {
    id: "task-001",
    client_id: "client-001",
    title: "Fix login bug",
    description: null,
    type: "request",
    priority: "high",
    status: "in_progress",
    assigned_to: "user-engineer",
    created_by: "user-admin",
    due_date: null,
    completed_at: null,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

function makeMockClient(overrides: Record<string, any> = {}) {
  return {
    id: "client-001",
    name: "Acme Corp",
    short_name: "acme",
    email: "acme@test.com",
    market: "US",
    slack_channel: "acme-alerts",
    ...overrides,
  };
}

function makeMockUsers() {
  return [
    {
      id: "user-engineer",
      email: "engineer@vantx.io",
      full_name: "Jane Engineer",
    },
    { id: "user-admin", email: "admin@vantx.io", full_name: "Bob Admin" },
  ];
}

/**
 * Build a mock Supabase client that handles the chain:
 *   .from(table).select(cols).eq(col, val).single()
 *   .from(table).select(cols).in(col, vals)
 *   .from(table).insert(data)
 *
 * `handlers` maps table names to arrays of return values (consumed in order).
 */
function buildMockSupabase(handlers: Record<string, any[]>) {
  const counters: Record<string, number> = {};

  const insert = vi.fn().mockResolvedValue({ error: null });

  function getNext(table: string, context: string) {
    const key = `${table}:${context}`;
    counters[key] = counters[key] ?? 0;
    const arr = handlers[table];
    if (!arr || arr.length === 0) return { data: null, error: "no handler" };
    const value = arr[counters[key]] ?? arr[arr.length - 1];
    counters[key]++;
    return value;
  }

  const from = vi.fn((table: string) => {
    const chain: any = {
      select: vi.fn((_cols?: string) => {
        chain._selected = true;
        return chain;
      }),
      eq: vi.fn((_col: string, _val: string) => {
        chain._eqCalled = true;
        return chain;
      }),
      in: vi.fn((_col: string, _vals: any[]) => {
        chain._inCalled = true;
        return chain;
      }),
      single: vi.fn(() => {
        return Promise.resolve(getNext(table, "single"));
      }),
      insert: vi.fn((data: any) => {
        insert(table, data);
        return Promise.resolve({ error: null });
      }),
      maybeSingle: vi.fn(() => {
        return Promise.resolve(getNext(table, "single"));
      }),
      then: vi.fn((cb: (val: any) => any) => {
        return Promise.resolve(getNext(table, "list")).then(cb);
      }),
    };

    // Make the chain itself thenable for .in() chains (they return the result directly)
    Object.defineProperty(chain, Symbol.toPrimitive, { value: () => null });

    // Intercept .then() calls on the chain object (for cases like: await supabase.from('users').select().in(...))
    chain[Symbol.toStringTag] = "Promise";

    return chain;
  });

  // Override: when in() is called, the chain is awaitable directly
  const originalFrom = from;
  const wrappedFrom = vi.fn((table: string) => {
    const chain = originalFrom(table);

    // Make select().in() awaitable
    const originalSelect = chain.select;
    chain.select = vi.fn((...args: any[]) => {
      const selectChain = originalSelect(...args);
      const originalIn = selectChain.in;
      selectChain.in = vi.fn((...inArgs: any[]) => {
        originalIn(...inArgs);
        // Return a thenable that resolves to the handler data
        return {
          then(onFulfilled: any, onRejected: any) {
            return Promise.resolve(getNext(table, "list")).then(
              onFulfilled,
              onRejected,
            );
          },
          catch(onRejected: any) {
            return Promise.resolve(getNext(table, "list")).catch(onRejected);
          },
        };
      });
      return selectChain;
    });

    return chain;
  });

  return { from: wrappedFrom, _insert: insert };
}

// ─── notifyTaskEvent — task_updated ────────────────────────────────────────

describe("notifyTaskEvent — task_updated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.vantx.io");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends email to deduplicated [assigned_to, created_by] users", async () => {
    const task = makeMockTask({
      assigned_to: "user-engineer",
      created_by: "user-admin",
    });
    const client = makeMockClient();
    const users = makeMockUsers();

    const supabase = buildMockSupabase({
      tasks: [{ data: task, error: null }],
      clients: [{ data: client, error: null }],
      users: [{ data: users, error: null }],
      notifications: [],
    });

    await notifyTaskEvent(
      "task-001",
      "task_updated",
      supabase as any,
      "user-admin",
    );

    // Should call sendEmail twice (one per unique recipient)
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it("calls sendEmail only once when assigned_to === created_by (dedup per D-11)", async () => {
    const task = makeMockTask({
      assigned_to: "user-admin",
      created_by: "user-admin",
    });
    const client = makeMockClient();
    const users = [
      { id: "user-admin", email: "admin@vantx.io", full_name: "Bob Admin" },
    ];

    const supabase = buildMockSupabase({
      tasks: [{ data: task, error: null }],
      clients: [{ data: client, error: null }],
      users: [{ data: users, error: null }],
      notifications: [],
    });

    await notifyTaskEvent(
      "task-001",
      "task_updated",
      supabase as any,
      "user-admin",
    );

    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("sends email only to created_by when assigned_to is null", async () => {
    const task = makeMockTask({ assigned_to: null, created_by: "user-admin" });
    const client = makeMockClient();
    const users = [
      { id: "user-admin", email: "admin@vantx.io", full_name: "Bob Admin" },
    ];

    const supabase = buildMockSupabase({
      tasks: [{ data: task, error: null }],
      clients: [{ data: client, error: null }],
      users: [{ data: users, error: null }],
      notifications: [],
    });

    await notifyTaskEvent("task-001", "task_updated", supabase as any);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const callArg = (sendEmail as any).mock.calls[0][0];
    expect(callArg.to).toBe("admin@vantx.io");
  });

  it("does NOT call sendTaskCreatedMessage for task_updated events (per D-17)", async () => {
    const task = makeMockTask();
    const client = makeMockClient();
    const users = makeMockUsers();

    const supabase = buildMockSupabase({
      tasks: [{ data: task, error: null }],
      clients: [{ data: client, error: null }],
      users: [{ data: users, error: null }],
      notifications: [],
    });

    await notifyTaskEvent("task-001", "task_updated", supabase as any);

    expect(sendTaskCreatedMessage).not.toHaveBeenCalled();
  });

  it("calls createNotification for each email recipient (per D-13)", async () => {
    const task = makeMockTask({
      assigned_to: "user-engineer",
      created_by: "user-admin",
    });
    const client = makeMockClient();
    const users = makeMockUsers();

    const supabase = buildMockSupabase({
      tasks: [{ data: task, error: null }],
      clients: [{ data: client, error: null }],
      users: [{ data: users, error: null }],
      notifications: [],
    });

    await notifyTaskEvent(
      "task-001",
      "task_updated",
      supabase as any,
      "user-admin",
    );

    // 2 recipients = 2 insertions into notifications
    expect(supabase.from).toHaveBeenCalledWith("notifications");
  });
});

// ─── notifyTaskEvent — task_created ────────────────────────────────────────

describe("notifyTaskEvent — task_created", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.vantx.io");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fetches admin/engineer users and sends email to each (per D-12)", async () => {
    const task = makeMockTask();
    const client = makeMockClient();
    const adminEngineers = makeMockUsers();

    const supabase = buildMockSupabase({
      tasks: [{ data: task, error: null }],
      clients: [{ data: client, error: null }],
      users: [{ data: adminEngineers, error: null }],
      notifications: [],
    });

    await notifyTaskEvent(
      "task-001",
      "task_created",
      supabase as any,
      "user-admin",
    );

    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it("calls sendTaskCreatedMessage when client has slack_channel", async () => {
    const task = makeMockTask();
    const client = makeMockClient({ slack_channel: "acme-alerts" });
    const adminEngineers = makeMockUsers();

    const supabase = buildMockSupabase({
      tasks: [{ data: task, error: null }],
      clients: [{ data: client, error: null }],
      users: [{ data: adminEngineers, error: null }],
      notifications: [],
    });

    await notifyTaskEvent(
      "task-001",
      "task_created",
      supabase as any,
      "user-admin",
    );

    expect(sendTaskCreatedMessage).toHaveBeenCalledOnce();
    const callArgs = (sendTaskCreatedMessage as any).mock.calls[0][0];
    expect(callArgs.channelId).toBe("#acme-alerts");
    expect(callArgs.title).toBe("Fix login bug");
    expect(callArgs.priority).toBe("high");
  });

  it("does NOT call sendTaskCreatedMessage when client.slack_channel is null", async () => {
    const task = makeMockTask();
    const client = makeMockClient({ slack_channel: null });
    const adminEngineers = makeMockUsers();

    const supabase = buildMockSupabase({
      tasks: [{ data: task, error: null }],
      clients: [{ data: client, error: null }],
      users: [{ data: adminEngineers, error: null }],
      notifications: [],
    });

    await notifyTaskEvent("task-001", "task_created", supabase as any);

    expect(sendTaskCreatedMessage).not.toHaveBeenCalled();
  });
});

// ─── notifyTaskEvent — resilience ──────────────────────────────────────────

describe("notifyTaskEvent — resilience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.vantx.io");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not throw even when sendEmail throws", async () => {
    const task = makeMockTask();
    const client = makeMockClient();
    const users = makeMockUsers();

    (sendEmail as any).mockRejectedValue(new Error("Email service down"));

    const supabase = buildMockSupabase({
      tasks: [{ data: task, error: null }],
      clients: [{ data: client, error: null }],
      users: [{ data: users, error: null }],
      notifications: [],
    });

    // Should not throw
    await expect(
      notifyTaskEvent("task-001", "task_updated", supabase as any),
    ).resolves.toBeUndefined();
  });

  it("returns early if task not found — no calls to sendEmail or sendTaskCreatedMessage", async () => {
    const supabase = buildMockSupabase({
      tasks: [{ data: null, error: { message: "Not found" } }],
      clients: [],
      users: [],
      notifications: [],
    });

    await notifyTaskEvent("nonexistent", "task_updated", supabase as any);

    expect(sendEmail).not.toHaveBeenCalled();
    expect(sendTaskCreatedMessage).not.toHaveBeenCalled();
  });
});

// ─── notifyTaskEvent — preference enforcement (NOTIF-12) ──────────────────

describe("notifyTaskEvent — preference enforcement (NOTIF-12)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.vantx.io");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("skips sendEmail when email_enabled = false (NOTIF-12)", async () => {
    const task = makeMockTask({
      assigned_to: "user-engineer",
      created_by: "user-admin",
    });
    const client = makeMockClient();
    const users = makeMockUsers();

    const supabase = buildMockSupabase({
      tasks: [{ data: task, error: null }],
      clients: [{ data: client, error: null }],
      users: [{ data: users, error: null }],
      notification_preferences: [
        { data: { email_enabled: false, in_app_enabled: true }, error: null },
        { data: { email_enabled: false, in_app_enabled: true }, error: null },
      ],
      notifications: [],
    });

    await notifyTaskEvent(
      "task-001",
      "task_updated",
      supabase as any,
      "user-admin",
    );

    expect(sendEmail).not.toHaveBeenCalled();
    // in-app notifications should still be created
    expect(supabase.from).toHaveBeenCalledWith("notifications");
  });

  it("skips createNotification when in_app_enabled = false (NOTIF-12)", async () => {
    const task = makeMockTask({
      assigned_to: "user-engineer",
      created_by: "user-admin",
    });
    const client = makeMockClient();
    const users = makeMockUsers();

    const supabase = buildMockSupabase({
      tasks: [{ data: task, error: null }],
      clients: [{ data: client, error: null }],
      users: [{ data: users, error: null }],
      notification_preferences: [
        { data: { email_enabled: true, in_app_enabled: false }, error: null },
        { data: { email_enabled: true, in_app_enabled: false }, error: null },
      ],
      notifications: [],
    });

    await notifyTaskEvent(
      "task-001",
      "task_updated",
      supabase as any,
      "user-admin",
    );

    // Email should still be sent (2 recipients)
    expect(sendEmail).toHaveBeenCalledTimes(2);
    // notifications table should NOT be inserted
    expect(supabase.from).not.toHaveBeenCalledWith("notifications");
  });

  it("sends email and in-app when no preferences row (opt-out model per D-03)", async () => {
    const task = makeMockTask({
      assigned_to: "user-engineer",
      created_by: "user-admin",
    });
    const client = makeMockClient();
    const users = makeMockUsers();

    const supabase = buildMockSupabase({
      tasks: [{ data: task, error: null }],
      clients: [{ data: client, error: null }],
      users: [{ data: users, error: null }],
      // null row = opt-out model: all channels enabled
      notification_preferences: [
        { data: null, error: null },
        { data: null, error: null },
      ],
      notifications: [],
    });

    await notifyTaskEvent(
      "task-001",
      "task_updated",
      supabase as any,
      "user-admin",
    );

    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(supabase.from).toHaveBeenCalledWith("notifications");
  });

  it("sends both when preferences row has email_enabled=true, in_app_enabled=true", async () => {
    const task = makeMockTask({
      assigned_to: "user-engineer",
      created_by: "user-admin",
    });
    const client = makeMockClient();
    const users = makeMockUsers();

    const supabase = buildMockSupabase({
      tasks: [{ data: task, error: null }],
      clients: [{ data: client, error: null }],
      users: [{ data: users, error: null }],
      notification_preferences: [
        {
          data: { email_enabled: true, in_app_enabled: true },
          error: null,
        },
        {
          data: { email_enabled: true, in_app_enabled: true },
          error: null,
        },
      ],
      notifications: [],
    });

    await notifyTaskEvent(
      "task-001",
      "task_updated",
      supabase as any,
      "user-admin",
    );

    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(supabase.from).toHaveBeenCalledWith("notifications");
  });
});
