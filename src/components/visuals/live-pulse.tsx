"use client"

import type { CSSProperties } from "react"

const anim = (animation: string, delay = 0): CSSProperties =>
  ({ ["--a" as string]: animation, ["--ad" as string]: `${delay}s` })

/** Radar-style "live data" beacon: a steady dot with rings rippling out of it. */
export function LivePulse({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`va va-tone-emerald ${className}`}
      data-motion="always"
      aria-hidden
      focusable="false"
    >
      <circle cx={12} cy={12} r={7} className="va-anim st s-m" strokeWidth={1.5} opacity={0} style={anim("va-ping-loop 2.4s ease-out infinite")} />
      <circle cx={12} cy={12} r={7} className="va-anim st s-m" strokeWidth={1.5} opacity={0} style={anim("va-ping-loop 2.4s ease-out infinite", 1.2)} />
      <circle cx={12} cy={12} r={3.5} className="f-m" />
    </svg>
  )
}
