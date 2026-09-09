/* The club drone, drawn once and used twice: as ambient traffic in the sky
   behind the page, and as the courier that brings each committee on screen in
   the members section.

   Filled shapes, not strokes: SkyTraffic renders these as small as 17px, where
   a 1px outline turns to mush. */
export default function Drone({ size = 24, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {/* rotor wash */}
      <g fill="currentColor" opacity="0.25">
        <circle cx="6" cy="6" r="4.3" />
        <circle cx="18" cy="6" r="4.3" />
        <circle cx="6" cy="18" r="4.3" />
        <circle cx="18" cy="18" r="4.3" />
      </g>

      {/* arms */}
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M9.5 9.5 6.6 6.6M14.5 9.5 17.4 6.6M9.5 14.5 6.6 17.4M14.5 14.5 17.4 17.4" />
      </g>

      {/* hubs and body */}
      <g fill="currentColor">
        <circle cx="6" cy="6" r="1.9" />
        <circle cx="18" cy="6" r="1.9" />
        <circle cx="6" cy="18" r="1.9" />
        <circle cx="18" cy="18" r="1.9" />
        <rect x="9.1" y="9.1" width="5.8" height="5.8" rx="1.7" />
      </g>
    </svg>
  );
}
