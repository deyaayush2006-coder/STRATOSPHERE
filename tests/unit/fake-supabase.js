// In-memory stand-in for the supabase-js query builder: just the calls our
// server code makes. failOn: { "table.op": "message" } makes that call fail.
export function fakeSupabase(initial = {}, { failOn = {}, cascade = {} } = {}) {
  const db = structuredClone(initial);
  const calls = [];
  let nextId = 1;

  function from(table) {
    db[table] ??= [];
    const state = { op: "select", filters: [], payload: null, returning: false, head: false, columns: "*" };
    const matches = (r) => state.filters.every((f) => f(r));

    async function run() {
      calls.push({ table, op: state.op, columns: state.columns });
      const failure = failOn[`${table}.${state.op}`];
      if (failure) return { data: null, error: { message: failure } };

      if (state.op === "select") {
        const rows = db[table].filter(matches);
        return state.head ? { data: null, count: rows.length, error: null } : { data: structuredClone(rows), error: null };
      }
      if (state.op === "delete") {
        const gone = db[table].filter(matches);
        db[table] = db[table].filter((r) => !matches(r));
        for (const [child, fk] of cascade[table] ?? []) {
          const ids = new Set(gone.map((r) => r.id));
          db[child] = (db[child] ?? []).filter((r) => !ids.has(r[fk]));
        }
        return { data: null, error: null };
      }
      if (state.op === "upsert") {
        for (const row of state.payload) {
          const i = db[table].findIndex((r) => r.id === row.id);
          if (i >= 0) db[table][i] = { ...db[table][i], ...row };
          else db[table].push({ ...row, id: row.id ?? `gen-${nextId++}` });
        }
        return { data: null, error: null };
      }
      const inserted = state.payload.map((row) => ({ created_at: new Date().toISOString(), ...row, id: `gen-${nextId++}` }));
      db[table].push(...inserted);
      return { data: state.returning ? structuredClone(inserted) : null, error: null };
    }

    const q = {
      select(columns = "*", opts = {}) {
        if (state.op === "insert") state.returning = true;
        else {
          state.columns = columns;
          state.head = Boolean(opts.head);
        }
        return q;
      },
      delete() { state.op = "delete"; return q; },
      upsert(rows) { state.op = "upsert"; state.payload = [].concat(rows); return q; },
      insert(rows) { state.op = "insert"; state.payload = [].concat(rows); return q; },
      eq(c, v) { state.filters.push((r) => r[c] === v); return q; },
      neq(c, v) { state.filters.push((r) => r[c] !== v); return q; },
      gte(c, v) { state.filters.push((r) => String(r[c] ?? "") >= String(v)); return q; },
      in(c, vs) { state.filters.push((r) => vs.includes(r[c])); return q; },
      not(c, _op, list) {
        const vs = list.replace(/[()]/g, "").split(",").filter(Boolean);
        state.filters.push((r) => !vs.includes(r[c]));
        return q;
      },
      order() { return q; },
      single() { return q; },
      then(resolve, reject) { return run().then(resolve, reject); },
    };
    return q;
  }

  return { from, tables: () => db, calls };
}
