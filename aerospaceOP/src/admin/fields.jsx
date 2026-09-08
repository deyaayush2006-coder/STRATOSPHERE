import React, { useEffect, useRef, useState } from "react";
import { Badge, Button, FIELD, IconButton, Label, Notice, Spinner } from "./ui";
import { slugify } from "./schema";
import { formatBytes, getCached, loadMedia, mediaUrl, subscribe, uploadMedia } from "./media";

/* Renders one field of any type from schema.js, plus the list/object wrappers
   that hold them. Nothing here knows what an "event" or a "member" is — the
   shape comes entirely from the schema, so a new section needs no new code. */

// ---------------------------------------------------------------- scalars

function TextInput({ field, value, onChange }) {
  return (
    <input
      type="text"
      className={FIELD}
      value={value ?? ""}
      placeholder={field.placeholder || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function TextArea({ field, value, onChange }) {
  return (
    <textarea
      rows={field.rows || 4}
      className={`${FIELD} resize-y leading-relaxed`}
      value={value ?? ""}
      placeholder={field.placeholder || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function SelectInput({ field, value, onChange }) {
  return (
    <select className={FIELD} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
      {field.options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-[#0d1219]">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function CheckboxInput({ field, value, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1 text-sm text-slate-200">
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 accent-cyan-400"
      />
      {field.label}
    </label>
  );
}

// ------------------------------------------------------------ media picker

function MediaPicker({ onPick, onClose }) {
  const [items, setItems] = useState(() => getCached() || []);
  const [status, setStatus] = useState(getCached() ? "ready" : "loading");
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => subscribe(setItems), []);

  useEffect(() => {
    loadMedia()
      .then(() => setStatus("ready"))
      .catch((err) => {
        setError(err.message);
        setStatus("ready");
      });
  }, []);

  // Escape closes, the way every other dialog on the web does.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    setStatus("uploading");
    setError("");
    try {
      let last = null;
      for (const file of files) last = await uploadMedia(file);
      setStatus("ready");
      if (last) onPick(last.url); // picking the last upload is almost always what was meant
    } catch (err) {
      setError(err.message);
      setStatus("ready");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Media library"
        className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-white/12 bg-[#0d121a] shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Media library</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Images are resized in your browser before upload, so photos straight off a phone are fine.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={() => fileRef.current?.click()} disabled={status === "uploading"}>
              {status === "uploading" ? <Spinner /> : null}
              {status === "uploading" ? "Uploading…" : "Upload"}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = ""; // so re-picking the same file fires again
          }}
        />

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4">
              <Notice onDismiss={() => setError("")}>{error}</Notice>
            </div>
          )}

          {status === "loading" ? (
            <p className="py-16 text-center text-sm text-slate-400">
              <Spinner /> Loading library…
            </p>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">
              Nothing uploaded yet. Use the Upload button above.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {items.map((m) => (
                <figure key={m.id} className="group relative overflow-hidden rounded-lg border border-white/10">
                  <button
                    type="button"
                    onClick={() => onPick(m.url)}
                    className="block w-full"
                    title={`Use ${m.filename}`}
                  >
                    <img
                      src={mediaUrl(m.url)}
                      alt={m.alt || m.filename}
                      loading="lazy"
                      className="aspect-[4/3] w-full bg-black/40 object-cover transition group-hover:opacity-80"
                    />
                  </button>
                  <figcaption className="flex items-center justify-between gap-2 px-2 py-1.5">
                    <span className="truncate text-[11px] text-slate-400" title={m.filename}>
                      {m.filename}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-slate-500">
                      {formatBytes(m.size)}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageInput({ value, onChange }) {
  const [picking, setPicking] = useState(false);

  return (
    <div className="flex items-start gap-3">
      <div className="grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
        {value ? (
          <img src={mediaUrl(value)} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] uppercase tracking-widest text-slate-600">None</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {/* The path stays editable: existing content points at files in
            public/images, which were never uploaded through this panel. */}
        <input
          type="text"
          className={FIELD}
          value={value ?? ""}
          placeholder="/images/… or pick from the library"
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <Button onClick={() => setPicking(true)}>Choose or upload</Button>
          {value && (
            <Button variant="ghost" onClick={() => onChange("")}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {picking && (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(url) => {
            onChange(url);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------ simple lists

function StringList({ field, value, onChange }) {
  const rows = Array.isArray(value) ? value : [];
  const set = (i, v) => onChange(rows.map((row, idx) => (idx === i ? v : row)));

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-start gap-2">
          {field.multiline ? (
            <textarea
              rows={3}
              className={`${FIELD} resize-y leading-relaxed`}
              value={row}
              onChange={(e) => set(i, e.target.value)}
            />
          ) : (
            <input type="text" className={FIELD} value={row} onChange={(e) => set(i, e.target.value)} />
          )}
          <IconButton
            label="Remove"
            onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            className="mt-1"
          >
            ✕
          </IconButton>
        </div>
      ))}

      <Button onClick={() => onChange([...rows, ""])}>
        + Add {field.itemName || "line"}
      </Button>
    </div>
  );
}

function PairList({ field, value, onChange }) {
  const rows = Array.isArray(value) ? value : [];
  const set = (i, j, v) =>
    onChange(rows.map((row, idx) => (idx === i ? (j === 0 ? [v, row[1] ?? ""] : [row[0] ?? "", v]) : row)));

  return (
    <div className="space-y-2">
      {rows.length > 0 && (
        <div className="grid grid-cols-[1fr_1fr_2rem] gap-2 text-[10px] uppercase tracking-[0.14em] text-slate-500">
          <span>{field.keyLabel || "Label"}</span>
          <span>{field.valueLabel || "Value"}</span>
          <span />
        </div>
      )}

      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_2rem] items-center gap-2">
          <input type="text" className={FIELD} value={row?.[0] ?? ""} onChange={(e) => set(i, 0, e.target.value)} />
          <input type="text" className={FIELD} value={row?.[1] ?? ""} onChange={(e) => set(i, 1, e.target.value)} />
          <IconButton label="Remove" onClick={() => onChange(rows.filter((_, idx) => idx !== i))}>
            ✕
          </IconButton>
        </div>
      ))}

      <Button onClick={() => onChange([...rows, ["", ""]])}>+ Add row</Button>
    </div>
  );
}

// --------------------------------------------------------------- item card

/* One expandable row. Collapsed it is a summary line with the reorder and
   delete controls; expanded it is the item's whole form. Editing 16 committee
   members in a flat wall of inputs is unusable, and this keeps the page short
   enough to find things in. */
export function ItemCard({ spec, item, index, count, onChange, onMove, onRemove, onDuplicate, defaultOpen }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));

  const title = (spec.title?.(item) || "").trim() || `Untitled ${spec.itemName || "item"}`;
  const subtitle = spec.subtitle?.(item);
  const flag = spec.flag?.(item);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className={`text-slate-500 transition-transform ${open ? "rotate-90" : ""}`} aria-hidden="true">
            ▸
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-slate-100">{title}</span>
            {subtitle && <span className="block truncate text-xs text-slate-500">{subtitle}</span>}
          </span>
          {flag && (
            <span className="ml-1 shrink-0">
              <Badge tone="cyan">{flag}</Badge>
            </span>
          )}
        </button>

        <div className="flex shrink-0 items-center">
          <IconButton label="Move up" disabled={index === 0} onClick={() => onMove(index, index - 1)}>
            ↑
          </IconButton>
          <IconButton label="Move down" disabled={index === count - 1} onClick={() => onMove(index, index + 1)}>
            ↓
          </IconButton>
          {onDuplicate && (
            <IconButton label="Duplicate" onClick={() => onDuplicate(index)}>
              ⧉
            </IconButton>
          )}
          <IconButton
            label="Delete"
            onClick={() => onRemove(index)}
            className="hover:bg-rose-500/20 hover:text-rose-300"
          >
            ✕
          </IconButton>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-black/20 px-4 py-4">
          <ObjectFields fields={spec.fields} value={item} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

export function ListInput({ field, value, onChange }) {
  const items = Array.isArray(value) ? value : [];
  const [openIndex, setOpenIndex] = useState(null);

  const replace = (i, next) => onChange(items.map((it, idx) => (idx === i ? next : it)));

  const move = (from, to) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const add = () => {
    onChange([...items, field.blank()]);
    setOpenIndex(items.length); // open the row that was just created
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <ItemCard
          key={i}
          spec={field}
          item={item}
          index={i}
          count={items.length}
          defaultOpen={i === openIndex}
          onChange={(next) => replace(i, next)}
          onMove={move}
          onRemove={(idx) => onChange(items.filter((_, j) => j !== idx))}
          onDuplicate={
            field.compact
              ? undefined
              : (idx) => onChange([...items.slice(0, idx + 1), structuredClone(items[idx]), ...items.slice(idx + 1)])
          }
        />
      ))}

      <Button onClick={add}>+ Add {field.itemName || "item"}</Button>
    </div>
  );
}

// ------------------------------------------------------------- dispatchers

const INPUTS = {
  text: TextInput,
  textarea: TextArea,
  select: SelectInput,
  checkbox: CheckboxInput,
  image: ImageInput,
  stringList: StringList,
  pairList: PairList,
  list: ListInput,
};

export function Field({ field, value, onChange }) {
  const Input = INPUTS[field.type] || TextInput;

  // The checkbox carries its own label, so it does not get a second one.
  if (field.type === "checkbox") {
    return <Input field={field} value={value} onChange={onChange} />;
  }

  return (
    <div>
      <Label hint={field.hint} required={field.required}>
        {field.label}
      </Label>
      <Input field={field} value={value} onChange={onChange} />
    </div>
  );
}

/* Renders every field of one object and hands back the whole updated object.
   Also keeps slug fields in step with the title they are derived from, up
   until someone types their own slug — after that it is left alone. */
export function ObjectFields({ fields, value, onChange }) {
  const item = value ?? {};

  function update(name, next) {
    const merged = { ...item, [name]: next };

    for (const field of fields) {
      if (field.slugFrom !== name) continue;
      const current = merged[field.name];
      const wasDerived = !current || current === slugify(item[name]);
      if (wasDerived) merged[field.name] = slugify(next);
    }

    onChange(merged);
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        // Nested lists get room to breathe and a rule to sit under.
        const nested = field.type === "list" || field.type === "pairList" || field.type === "stringList";

        return (
          <div key={field.name} className={nested ? "border-t border-white/[0.07] pt-4" : undefined}>
            <Field field={field} value={item[field.name]} onChange={(next) => update(field.name, next)} />
          </div>
        );
      })}
    </div>
  );
}

export { MediaPicker };
