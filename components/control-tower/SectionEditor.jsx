"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, ConfirmButton, Notice, Spinner } from "./ui";
import { ListInput, ObjectFields } from "./fields";
import { findProblem } from "./schema";

export default function SectionEditor({ section, value, onSave, onReset }) {
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  // Counts every message shown, so the same one twice still scrolls to it.
  const [shown, setShown] = useState(0);
  const noticeRef = useRef(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  // Save sits in the bar at the bottom of the screen; once the message at the
  // top has rendered, bring it into view.
  useEffect(() => {
    if (shown) noticeRef.current?.scrollIntoView({ block: "center" });
  }, [shown]);

  const showError = (message) => {
    setError(message);
    setShown((n) => n + 1);
  };

  useEffect(() => {
    setStatus("idle");
    setError("");
  }, [section.key]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(value), [draft, value]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save() {
    // Checked here as well as on the server: in production the server's message
    // reaches the browser only as a generic error.
    const problem = findProblem(section, draft);
    if (problem) {
      showError(problem);
      return;
    }

    setStatus("saving");
    setError("");
    try {
      await onSave(section.key, draft);
      setStatus("saved");
      setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 2500);
    } catch (err) {
      showError(err.message);
      setStatus("idle");
    }
  }

  async function reset() {
    setStatus("saving");
    setError("");
    try {
      await onReset(section.key);
      setStatus("idle");
    } catch (err) {
      showError(err.message);
      setStatus("idle");
    }
  }

  const count = Array.isArray(draft) ? draft.length : null;

  return (
    <div className="pb-28">
      <header className="mb-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            <span className="mr-2" aria-hidden="true">
              {section.icon}
            </span>
            {section.label}
          </h1>
          {count !== null && (
            <span className="font-mono text-xs text-slate-500">
              {count} {count === 1 ? section.itemName : `${section.itemName}s`}
            </span>
          )}
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{section.blurb}</p>
      </header>

      {error && (
        <div ref={noticeRef} className="mb-5">
          <Notice onDismiss={() => setError("")}>{error}</Notice>
        </div>
      )}

      {section.kind === "list" ? (
        <ListInput field={section} value={draft} onChange={setDraft} />
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <ObjectFields
            fields={section.fields}
            value={draft}
            onChange={(next) => setDraft({ ...draft, ...next })}
          />
        </div>
      )}

      <div className="mt-8 border-t border-white/[0.07] pt-5">
        <ConfirmButton onConfirm={reset} confirmLabel="Yes — discard saved changes">
          Reset this section to the built-in content
        </ConfirmButton>
        <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-500">
          Removes everything saved here and puts the section back to the version that ships with the
          site. Use it if an edit goes wrong.
        </p>
      </div>

      {(dirty || status !== "idle") && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0b0f16]/95 backdrop-blur md:left-64">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3.5">
            <span className="text-sm text-slate-300">
              {status === "saving"
                ? "Saving…"
                : status === "saved"
                  ? "Saved. The site picks this up on its next load."
                  : "You have unsaved changes."}
            </span>
            <div className="flex items-center gap-2">
              {dirty && status !== "saving" && (
                <Button variant="ghost" onClick={() => setDraft(value)}>
                  Discard
                </Button>
              )}
              <Button variant="primary" onClick={save} disabled={!dirty || status === "saving"}>
                {status === "saving" && <Spinner />}
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
