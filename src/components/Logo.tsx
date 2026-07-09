import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = "", size = 32 }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Outer Rotating Cyber Grid */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute animate-[spin_12s_linear_infinite]"
      >
        <circle cx="50" cy="50" r="45" stroke="rgba(0, 240, 255, 0.15)" strokeWidth="1.5" strokeDasharray="6 6" />
        <circle cx="50" cy="50" r="38" stroke="rgba(255, 89, 0, 0.2)" strokeWidth="1" strokeDasharray="40 10" />
      </svg>

      {/* Bounding Box Corner Target Markers */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute animate-glow-pulse"
      >
        {/* Top-Left */}
        <path d="M15 25V15H25" stroke="#00F0FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Top-Right */}
        <path d="M85 25V15H75" stroke="#00F0FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Bottom-Left */}
        <path d="M15 75V85H25" stroke="#00F0FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Bottom-Right */}
        <path d="M85 75V85H75" stroke="#00F0FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Main Scanner Eye Center */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative"
      >
        {/* Bounding Grid Lines */}
        <line x1="15" y1="50" x2="85" y2="50" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
        <line x1="50" y1="15" x2="50" y2="85" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />

        {/* Outer Hexagon (Facial Tracking Grid Representation) */}
        <path
          d="M50 22 L74 36 L74 64 L50 78 L26 64 L26 36 Z"
          stroke="url(#hexagonGradient)"
          strokeWidth="2"
          className="animate-glow-pulse"
        />

        {/* Central Camera Iris */}
        <circle cx="50" cy="50" r="14" stroke="#FF5900" strokeWidth="2" />
        <circle cx="50" cy="50" r="8" fill="url(#coreGradient)" className="animate-pulse" />

        {/* Facial Landmark Tracking Nodes */}
        <circle cx="38" cy="40" r="2.5" fill="#00F0FF" />
        <circle cx="62" cy="40" r="2.5" fill="#00F0FF" />
        <circle cx="50" cy="48" r="2" fill="#FF5900" />
        <circle cx="50" cy="62" r="3" fill="#00F0FF" />

        {/* Connections */}
        <line x1="38" y1="40" x2="50" y2="48" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="0.75" />
        <line x1="62" y1="40" x2="50" y2="48" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="0.75" />
        <line x1="50" y1="48" x2="50" y2="62" stroke="rgba(255, 89, 0, 0.4)" strokeWidth="0.75" />

        <defs>
          <linearGradient id="hexagonGradient" x1="26" y1="22" x2="74" y2="78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="50%" stopColor="#7000FF" />
            <stop offset="100%" stopColor="#FF5900" />
          </linearGradient>
          <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#FF5900" />
            <stop offset="100%" stopColor="#7000FF" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
