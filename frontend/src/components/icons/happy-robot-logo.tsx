interface HappyRobotLogoProps {
  className?: string;
}

export function HappyRobotLogo({ className = "h-5 w-5" }: HappyRobotLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Robot head */}
      <rect
        x="8"
        y="6"
        width="16"
        height="14"
        rx="4"
        fill="currentColor"
        opacity="0.9"
      />

      {/* Screen/visor */}
      <rect
        x="10"
        y="8"
        width="12"
        height="8"
        rx="2"
        fill="white"
        opacity="0.9"
      />

      {/* Happy eyes */}
      <circle cx="13" cy="11" r="1.5" fill="currentColor" />
      <circle cx="19" cy="11" r="1.5" fill="currentColor" />

      {/* Smile curve */}
      <path
        d="M12 14 Q16 16 20 14"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Antenna with signal */}
      <line x1="16" y1="6" x2="16" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="3" r="1" fill="currentColor" />

      {/* Signal waves */}
      <path d="M13 3 Q16 1 19 3" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M12 2 Q16 0 20 2" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4" />

      {/* Body */}
      <rect
        x="10"
        y="20"
        width="12"
        height="8"
        rx="2"
        fill="currentColor"
        opacity="0.7"
      />

      {/* Chest panel */}
      <rect
        x="12"
        y="22"
        width="8"
        height="4"
        rx="1"
        fill="white"
        opacity="0.8"
      />

      {/* Buttons */}
      <circle cx="14" cy="24" r="0.5" fill="currentColor" />
      <circle cx="16" cy="24" r="0.5" fill="currentColor" />
      <circle cx="18" cy="24" r="0.5" fill="currentColor" />

      {/* Arms */}
      <circle cx="8" cy="23" r="2" fill="currentColor" opacity="0.8" />
      <circle cx="24" cy="23" r="2" fill="currentColor" opacity="0.8" />

      {/* Legs */}
      <rect x="12" y="28" width="3" height="4" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="17" y="28" width="3" height="4" rx="1" fill="currentColor" opacity="0.8" />
    </svg>
  );
}