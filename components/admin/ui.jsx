"use client";

import React from "react";

/* Dashboard primitives.
   Fixed dark colours rather than the site's ink/base tokens: this is a tool,
   not a page, and it should look the same whichever theme the public site is
   left on. Styling stays in the markup — nothing here touches index.css. */

export const CARD = "rounded-xl border border-white/10 bg-white/[0.03]";
export const FIELD =
  "w-full rounded-lg border border-white/12 bg-[#0d1219] px-3 py-2 text-sm text-slate-100 " +
  "placeholder:text-slate-500 outline-none transition-colors focus:border-cyan-400/70 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANTS = {
  primary: "bg-cyan-400 text-[#062028] hover:bg-cyan-300 font-semibold",
  ghost: "text-slate-300 hover:text-white hover:bg-white/[0.07] border border-transparent",
  outline: "border border-white/15 text-slate-200 hover:bg-white/[0.06] hover:border-white/30",
  danger: "border border-rose-500/40 text-rose-300 hover:bg-rose-500/15 hover:border-rose-500/70",
};

export function Button({ variant = "outline", className = "", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm
        transition-colors disabled:opacity-45 disabled:pointer-events-none
        ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

/* Square icon button for the row controls (move, duplicate, delete). */
export function IconButton({ label, className = "", ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400
        transition-colors hover:bg-white/10 hover:text-white
        disabled:opacity-30 disabled:pointer-events-none ${className}`}
      {...props}
    />
  );
}

export function Label({ children, hint, required }) {
  return (
    <span className="mb-1.5 flex items-baseline gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
        {children}
        {required && <span className="ml-1 text-rose-400">*</span>}
      </span>
      {hint && <span className="text-[11px] font-normal normal-case tracking-normal text-slate-500">{hint}</span>}
    </span>
  );
}

export function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "border-white/15 text-slate-300",
    cyan: "border-cyan-400/40 bg-cyan-400/10 text-cyan-300",
    amber: "border-amber-400/40 bg-amber-400/10 text-amber-300",
    rose: "border-rose-400/40 bg-rose-400/10 text-rose-300",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Notice({ tone = "rose", children, onDismiss }) {
  if (!children) return null;
  const tones = {
    rose: "border-rose-500/40 bg-rose-500/10 text-rose-200",
    green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  };
  return (
    <div role="alert" className={`flex items-start gap-3 rounded-lg border px-3.5 py-2.5 text-sm ${tones[tone]}`}>
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-current opacity-60 hover:opacity-100">
          Dismiss
        </button>
      )}
    </div>
  );
}

export function Spinner({ className = "h-4 w-4" }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

/* Two-step delete. A single click on a destructive control in a content tool
   is how a committee loses a year of announcements. */
export function ConfirmButton({ onConfirm, children, confirmLabel = "Really delete?", ...props }) {
  const [armed, setArmed] = React.useState(false);

  React.useEffect(() => {
    if (!armed) return undefined;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <Button
      variant="danger"
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
      {...props}
    >
      {armed ? confirmLabel : children}
    </Button>
  );
}
