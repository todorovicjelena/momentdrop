import { cn } from "@/lib/utils";

// Generated warm bokeh backdrop, standing in for a host's own photo in the
// live preview — we don't have a real one to show, so this shows the same
// "full-bleed photo, no swirls" idea without pretending to be a real event.
export function DemoBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
      <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" className="size-full">
        <defs>
          <radialGradient id="demo-bg-wash" cx="30%" cy="15%" r="95%">
            <stop offset="0%" stopColor="#3a2140" />
            <stop offset="55%" stopColor="#7a3350" />
            <stop offset="100%" stopColor="#c9683f" />
          </radialGradient>
          <filter id="demo-bg-blur">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>
        <rect width="800" height="600" fill="url(#demo-bg-wash)" />
        <g filter="url(#demo-bg-blur)" opacity="0.6">
          <circle cx="120" cy="480" r="70" fill="#ffd9a0" />
          <circle cx="640" cy="120" r="95" fill="#ffb199" />
          <circle cx="710" cy="470" r="55" fill="#ffe6b8" />
          <circle cx="250" cy="130" r="42" fill="#ffcf8f" />
          <circle cx="460" cy="340" r="130" fill="#e08a5b" opacity="0.45" />
        </g>
      </svg>
    </div>
  );
}
