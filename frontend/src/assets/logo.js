import React from "react";

// Marque seule (icône) : écran de monitoring + battement
export const LogoMark = ({ size = 32, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="mpGrad" x1="0" y1="0" x2="48" y2="48">
        <stop offset="0%" stopColor="#a6002b" />
        <stop offset="100%" stopColor="#800020" />
      </linearGradient>
    </defs>
    <rect x="3" y="6" width="42" height="30" rx="6" fill="url(#mpGrad)" />
    <path
      d="M11 23 h6 l3 -8 l4 16 l3 -8 h10"
      stroke="#ffffff"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <rect x="18" y="40" width="12" height="2.4" rx="1.2" fill="#800020" />
    <rect x="21" y="36" width="6" height="4" fill="#800020" />
  </svg>
);

// Logo complet (icône + texte)
export const Logo = ({ size = 32, showText = true, className = "" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <LogoMark size={size} />
    {showText && (
      <span
        className="font-bold tracking-tight text-bordeaux-800"
        style={{ fontSize: size * 0.55 }}
      >
        Monitor<span className="text-bordeaux-500">Pro</span>
      </span>
    )}
  </div>
);

export default Logo;
