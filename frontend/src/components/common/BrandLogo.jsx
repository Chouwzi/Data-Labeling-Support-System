/**
 * DataLabel Pro — same mark as Login / Landing (rounded square + 2×2 dots).
 */
export default function BrandLogo({ size = 32, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
    >
      <rect
        x="4"
        y="4"
        width="40"
        height="40"
        rx="10"
        fill="#006c51"
        fillOpacity="0.1"
        stroke="#006c51"
        strokeWidth="1.5"
      />
      <circle cx="16" cy="16" r="5" fill="#006c51" />
      <circle cx="32" cy="16" r="5" fill="#00a67e" />
      <circle cx="16" cy="32" r="5" fill="#00a67e" />
      <circle cx="32" cy="32" r="5" fill="#006c51" />
    </svg>
  );
}
