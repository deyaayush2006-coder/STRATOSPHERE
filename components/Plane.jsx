/* The club glider, drawn once and used twice: as ambient traffic in the sky
   behind the page, and as the craft that lifts each committee into view in the
   members section.

   Points right at rest, so anything flying another heading rotates it. Solid
   fill rather than a stroke: SkyTraffic renders these as small as 17px, where a
   1px outline turns to mush. */
export default function Plane({ size = 24, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 12c0 .5-.4.9-.9.9h-6.3l-3.1 6.4c-.1.3-.4.4-.7.4h-1c-.3 0-.6-.3-.5-.7l1.6-6.1H7.4l-1.2 2c-.1.2-.3.3-.5.3h-.8c-.3 0-.5-.3-.4-.6l.8-2.6-.8-2.6c-.1-.3.1-.6.4-.6h.8c.2 0 .4.1.5.3l1.2 2h3.7L9.5 4.9c-.1-.3.2-.7.5-.7h1c.3 0 .6.2.7.4l3.1 6.4h6.3c.5 0 .9.4.9 1Z" />
    </svg>
  );
}
