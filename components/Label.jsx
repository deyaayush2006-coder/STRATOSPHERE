export default function Label({ children, muted = false, dot = false, className = "" }) {
  if (!children) return null;

  if (dot) {
    return (
      <span
        className={`inline-flex w-fit items-center gap-2 text-[13px] font-medium leading-4 tracking-[0.01em] ${
          muted ? "text-ink/50" : "text-aurora2"
        } ${className}`}
      >
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            muted ? "bg-ink/35" : "bg-aurora2 shadow-[0_0_8px_rgba(34,211,238,0.9)]"
          }`}
        />
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex w-fit items-center border-l pl-2.5 text-[13px] font-medium leading-4 tracking-[0.01em] ${
        muted ? "border-ink/25 text-ink/50" : "border-aurora2 text-aurora2"
      } ${className}`}
    >
      {children}
    </span>
  );
}
