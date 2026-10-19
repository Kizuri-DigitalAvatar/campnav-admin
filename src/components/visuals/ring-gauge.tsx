"use client"

import { useEffect, useState } from "react"
import { useReducedMotion } from "./hooks"

/**
 * Small ring that sweeps round to a percentage — for scores and rates where
 * "how full" matters more than the exact number.
 */
export function RingGauge({
  value,
  color,
  size = 44,
  stroke = 5,
  label,
  className = "",
}: {
  /** 0–100; undefined draws an empty track (loading) */
  value?: number
  color: string
  size?: number
  stroke?: number
  label?: string
  className?: string
}) {
  // Start empty, then sweep to the value so the ring animates in
  const [shown, setShown] = useState(0)
  const reduced = useReducedMotion()
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(Math.max(0, Math.min(100, value ?? 0))))
    return () => cancelAnimationFrame(id)
  }, [value])

  const r = 18 - stroke / 2
  return (
    <svg
      viewBox="0 0 36 36"
      width={size}
      height={size}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx={18} cy={18} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted" />
      <circle
        cx={18}
        cy={18}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${shown} 100`}
        transform="rotate(-90 18 18)"
        style={{ transition: reduced ? "none" : "stroke-dasharray 1s cubic-bezier(0.22, 1, 0.36, 1)" }}
      />
    </svg>
  )
}
