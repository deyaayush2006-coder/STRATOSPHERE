"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button, IconButton, Notice, Spinner } from "./ui";
import { deleteMedia, formatBytes, getCached, loadMedia, mediaUrl, subscribe, uploadMedia } from "./media";

/* The full-page view of everything uploaded. The same store backs the picker
   inside the image fields, so anything uploaded here is immediately available
   there and vice versa. */
export default function MediaLibrary() {
  const [items, setItems] = useState(() => getCached() || []);
  const [status, setStatus] = useState(getCached() ? "ready" : "loading");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => subscribe(setItems), []);

  useEffect(() => {
    loadMedia({ force: true })
      .then(() => setStatus("ready"))
      .catch((err) => {
        setError(err.message);
        setStatus("ready");
      });
  }, []);

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    setStatus("uploading");
    setError("");
    try {
      for (const file of files) await uploadMedia(file);
    } catch (err) {
      setError(err.message);
    }
    setStatus("ready");
  }

  async function remove(id) {
    setError("");
    try {
      await deleteMedia(id);
    } catch (err) {
      setError(err.message);
    }
  }

  function copy(url) {
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(url);
        setTimeout(() => setCopied(null), 1500);
      },
      () => setError("Could not copy — select the path and copy it by hand.")
    );
  }

  const totalBytes = items.reduce((sum, m) => sum + (m.size || 0), 0);

  return (
    <div className="pb-16">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            <span className="mr-2" aria-hidden="true">
              🗂️
            </span>
            Image library
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Every image uploaded through the panel. Photos are resized to 1600px and re-encoded in
            your browser first, so a picture straight off a phone arrives as a fraction of its
            original size.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-slate-500">
            {items.length} files · {formatBytes(totalBytes)}
          </span>
          <Button variant="primary" onClick={() => fileRef.current?.click()} disabled={status === "uploading"}>
            {status === "uploading" && <Spinner />}
            {status === "uploading" ? "Uploading…" : "Upload images"}
          </Button>
        </div>
      </header>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && (
        <div className="mb-5">
          <Notice onDismiss={() => setError("")}>{error}</Notice>
        </div>
      )}

      {status === "loading" ? (
        <p className="py-20 text-center text-sm text-slate-400">
          <Spinner /> Loading…
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 py-20 text-center">
          <p className="text-sm text-slate-400">No images yet.</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            The photos already on the site live in the project&rsquo;s public folder. Anything uploaded
            here is stored in the database and served by the API.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <figure key={m.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
              <img
                src={mediaUrl(m.url)}
                alt={m.alt || m.filename}
                loading="lazy"
                className="aspect-[4/3] w-full bg-black/40 object-cover"
              />
              <figcaption className="px-3 py-2.5">
                <p className="truncate text-xs font-medium text-slate-200" title={m.filename}>
                  {m.filename}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                  {m.width && m.height ? `${m.width}×${m.height} · ` : ""}
                  {formatBytes(m.size)}
                </p>

                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => copy(m.url)}
                    className="text-[11px] text-cyan-400 transition-colors hover:text-cyan-300"
                  >
                    {copied === m.url ? "Copied" : "Copy path"}
                  </button>
                  <IconButton
                    label={`Delete ${m.filename}`}
                    onClick={() => remove(m.id)}
                    className="hover:bg-rose-500/20 hover:text-rose-300"
                  >
                    ✕
                  </IconButton>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <p className="mt-6 max-w-2xl text-xs leading-relaxed text-slate-500">
        Deleting an image here does not remove it from the sections that use it — those will show a
        broken image until the reference is cleared. Check where it is used first.
      </p>
    </div>
  );
}
