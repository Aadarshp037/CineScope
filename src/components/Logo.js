import React from 'react'

// CineScope logo SVG — minimal film-frame + discovery magnifier
export default function Logo({ className }) {
  return (
    <svg
      className={className || 'brand__svg'}
      width="40"
      height="40"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="6" width="36" height="28" rx="6" fill="var(--surface-2)" stroke="var(--accent)" strokeWidth="1.6" />

      {/* sprocket holes */}
      <g fill="var(--muted)">
        <rect x="6" y="8" width="3" height="4" rx="0.8" />
        <rect x="6" y="18" width="3" height="4" rx="0.8" />
        <rect x="30" y="8" width="3" height="4" rx="0.8" />
        <rect x="30" y="18" width="3" height="4" rx="0.8" />
      </g>

      {/* aperture / discovery mark */}
      <g transform="translate(14,12)">
        <circle cx="8" cy="8" r="6" fill="var(--accent)" />
        <circle cx="8" cy="8" r="3.2" fill="var(--text)" />
      </g>

      {/* magnifier handle */}
      <rect x="24" y="26" width="10" height="2.6" rx="1.3" transform="rotate(40 24 26)" fill="var(--muted)" />
    </svg>
  )
}
