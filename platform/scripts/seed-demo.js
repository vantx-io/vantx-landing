#!/usr/bin/env node
/**
 * Seed demo users in Supabase Auth + users table
 * Run AFTER `npx supabase db reset` (which applies schema + seed.sql)
 *
 * Usage: node scripts/seed-demo.js
 *
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  console.error("Run `npx supabase start` and copy the service_role key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const demoUsers = [
  {
    email: "admin@vantix.cl",
    password: "vantix2026",
    profile: { full_name: "Admin Vantix", role: "admin", client_id: null },
  },
  {
    email: "jose@vantix.cl",
    password: "vantix2026",
    profile: { full_name: "José Castillo", role: "engineer", client_id: null },
  },
  {
    email: "juan@novapay.com",
    password: "demo2026",
    profile: {
      full_name: "Juan Pérez",
      role: "client",
      client_id: "11111111-1111-1111-1111-111111111111", // NovaPay from seed.sql
    },
  },
  {
    email: "sarah@scaleapp.io",
    password: "demo2026",
    profile: {
      full_name: "Sarah Miller",
      role: "client",
      client_id: "22222222-2222-2222-2222-222222222222", // ScaleApp from seed.sql
    },
  },
  {
    email: "vendedor1@vantix.cl",
    password: "vantix2026",
    profile: { full_name: "Vendedor Demo US", role: "seller", client_id: null },
  },
  {
    email: "vendedor2@vantix.cl",
    password: "vantix2026",
    profile: {
      full_name: "Vendedor Demo LATAM",
      role: "seller",
      client_id: null,
    },
  },
];

async function seed() {
  console.log("🌱 Seeding demo users...\n");

  for (const user of demoUsers) {
    // Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Skip email verification
      });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        console.log(`⏭ ${user.email} (already exists)`);
        // Get existing user ID
        const {
          data: { users },
        } = await supabase.auth.admin.listUsers();
        const existing = users?.find((u) => u.email === user.email);
        if (existing) {
          // Upsert profile
          await supabase.from("users").upsert({
            id: existing.id,
            email: user.email,
            ...user.profile,
          });
        }
        continue;
      }
      console.error(`✗ ${user.email}: ${authError.message}`);
      continue;
    }

    // Create profile in users table
    const { error: profileError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: user.email,
      ...user.profile,
    });

    if (profileError) {
      console.error(`✗ Profile for ${user.email}: ${profileError.message}`);
    } else {
      console.log(`✓ ${user.email} (${user.profile.role})`);
    }
  }

  // Insert task comments now that auth users exist
  const {
    data: { users },
  } = await supabase.auth.admin.listUsers();
  const joseUser = users?.find((u) => u.email === "jose@vantix.cl");
  if (joseUser) {
    const { data: tasks } = await supabase.from("tasks").select("id, title");
    const codeTask = tasks?.find((t) => t.title?.includes("Code splitting"));
    const spikeTask = tasks?.find((t) => t.title?.includes("spike latencia"));
    const comments = [];
    if (codeTask)
      comments.push({
        task_id: codeTask.id,
        user_id: joseUser.id,
        content:
          "El equipo frontend empezó con el code splitting. Estimado: 5 días.",
      });
    if (spikeTask)
      comments.push({
        task_id: spikeTask.id,
        user_id: joseUser.id,
        content:
          "RCA completado. Causa: campaña email marketing no coordinada. Acción: canal Slack #novapay-marketing-alerts creado.",
      });
    if (comments.length) {
      await supabase
        .from("task_comments")
        .upsert(comments, { ignoreDuplicates: true });
      console.log(`\n✓ ${comments.length} task comments created`);
    }
  }

  console.log("\n✅ Done! Demo accounts:\n");
  console.log("  Portal Cliente:  juan@novapay.com / demo2026");
  console.log("  Portal Cliente:  sarah@scaleapp.io / demo2026");
  console.log("  Admin Vantix:    admin@vantix.cl / vantix2026");
  console.log("  Engineer:        jose@vantix.cl / vantix2026");
  console.log("  Vendedor US:     vendedor1@vantix.cl / vantix2026");
  console.log("  Vendedor LATAM:  vendedor2@vantix.cl / vantix2026");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
