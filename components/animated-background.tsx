"use client"

export function AnimatedBackground() {
  return (
    <>
      <div className="cyber-grid" />
      <div className="scanline animate-scanline" />
      
      {/* Aurora Ambient Glow Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute top-[10%] left-[10%] w-[50vw] h-[50vw] rounded-full animate-aurora-1 mix-blend-multiply dark:mix-blend-screen" 
          style={{ background: "radial-gradient(circle, var(--aurora-1) 0%, transparent 60%)" }}
        />
        <div 
          className="absolute top-[40%] right-[10%] w-[45vw] h-[45vw] rounded-full animate-aurora-2 mix-blend-multiply dark:mix-blend-screen" 
          style={{ background: "radial-gradient(circle, var(--aurora-2) 0%, transparent 60%)" }}
        />
        <div 
          className="absolute bottom-[-10%] left-[30%] w-[60vw] h-[60vw] rounded-full animate-aurora-3 mix-blend-multiply dark:mix-blend-screen" 
          style={{ background: "radial-gradient(circle, var(--aurora-3) 0%, transparent 60%)" }}
        />
      </div>
      
      <div className="noise-overlay" />
      <div className="vignette-overlay" />
    </>
  )
}
