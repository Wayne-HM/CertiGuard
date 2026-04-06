"use client"

import { memo } from "react"

const FloatingOrb = memo(function FloatingOrb({ 
  className, 
  style 
}: { 
  className: string
  style: React.CSSProperties 
}) {
  return <div className={className} style={style} />
})

export function AnimatedBackground() {
  return (
    <>
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ 
          zIndex: 1,
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.7 0.2 220 / 0.12), transparent),
            radial-gradient(ellipse 60% 40% at 100% 50%, oklch(0.6 0.25 300 / 0.08), transparent),
            radial-gradient(ellipse 60% 40% at 0% 80%, oklch(0.78 0.14 195 / 0.06), transparent)
          `
        }}
      />
      
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ 
          zIndex: 2,
          background: "radial-gradient(ellipse at center, transparent 0%, oklch(0.06 0.02 260 / 0.5) 100%)",
        }}
      />
    </>
  )
}
