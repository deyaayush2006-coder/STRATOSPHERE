export default function Rocket({ size = 24, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <g fill="currentColor" opacity="0.4">
        <path d="M8.6 9.9C5.9 10.4 3.8 11.1 2.2 12c1.6.9 3.7 1.6 6.4 2.1Z" />
      </g>

      <g fill="currentColor">
        <path d="M10.9 8.5 7.1 5c-.4-.4-1-.1-1 .5l.5 3.6Z" />
        <path d="M10.9 15.5 7.1 19c-.4.4-1 .1-1-.5l.5-3.6Z" />
      </g>

      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8.9 8.1c4.6-.9 9.2.4 12.9 3.9-3.7 3.5-8.3 4.8-12.9 3.9ZM17 12a1.75 1.75 0 1 0-3.5 0 1.75 1.75 0 0 0 3.5 0Z"
      />
    </svg>
  );
}
