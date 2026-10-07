// Read-only check that the public anon key cannot see private data.
// Used by uptime.yml against production; never writes anything.
//
//   PROBE_SUPABASE_URL=https://<ref>.supabase.co PROBE_SUPABASE_ANON_KEY=... node e2e/anon-probe.mjs

const URL = process.env.PROBE_SUPABASE_URL;
const KEY = process.env.PROBE_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  console.error("PROBE_SUPABASE_URL and PROBE_SUPABASE_ANON_KEY are required.");
  process.exit(2);
}

async function get(path) {
  const response = await fetch(`${URL.replace(/\/+$/, "")}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

const denied = ({ status, body }) => status >= 400 && body?.code === "42501";

const failures = [];

const email = await get("cohort_members?select=email&limit=1");
if (!denied(email)) {
  failures.push(`cohort_members.email is readable with the anon key (HTTP ${email.status}). Is 0007 applied?`);
}

const messages = await get("contact_messages?select=id&limit=1");
if (Array.isArray(messages.body) && messages.body.length > 0) {
  failures.push("contact_messages rows are readable with the anon key.");
} else if (!denied(messages) && !Array.isArray(messages.body)) {
  failures.push(`contact_messages probe failed unexpectedly (HTTP ${messages.status}).`);
}

const members = await get("cohort_members?select=name&limit=1");
if (members.status !== 200) {
  failures.push(`public member columns are not readable (HTTP ${members.status}); the team section may be broken.`);
}

if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`);
  process.exit(1);
}
console.log("ok  anon cannot read cohort_members.email or contact_messages; public member columns readable");
