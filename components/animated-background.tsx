"use client"

import { useEffect, useRef, useCallback, memo } from "react"
import { motion } from "framer-motion"

// Memoized orb component for CSS-based animation (GPU accelerated)
const FloatingOrb = memo(function FloatingOrb({ 
  className, 
  style 
}: { 
  className?: string
  style?: React.CSSProperties 
}) {
  return <div className={className} style={style} />
})

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0, active: false })
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current.x = e.clientX
    mouseRef.current.y = e.clientY
    mouseRef.current.active = true
  }, [])

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.active = false
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { 
      alpha: true,
      desynchronized: true 
    })
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resizeCanvas = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)
    }
    resizeCanvas()

    // We only use very subtle floating particles now
    const particleCount = 40
    const particles: {x: number, y: number, vx: number, vy: number, size: number, alpha: number}[] = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.3 + 0.1,
      })
    }

    const mouseInfluenceRadiusSq = 150 * 150

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current
      if (deltaTime < 16) { 
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      lastTimeRef.current = currentTime

      ctx.clearRect(0, 0, width, height)

      // Update and draw particles (Strictly black/white theme)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - p.x
          const dy = mouseRef.current.y - p.y
          const distSq = dx * dx + dy * dy
          
          if (distSq < mouseInfluenceRadiusSq && distSq > 0) {
            const force = (1 - distSq / mouseInfluenceRadiusSq) * 0.01
            const invDist = 1 / Math.sqrt(distSq)
            p.vx -= dx * invDist * force
            p.vy -= dy * invDist * force
          }
        }

        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.99
        p.vy *= 0.99

        if (p.x < -10) p.x = width + 10
        else if (p.x > width + 10) p.x = -10
        if (p.y < -10) p.y = height + 10
        else if (p.y > height + 10) p.y = -10

        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener("resize", resizeCanvas, { passive: true })
    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true })
    
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseleave", handleMouseLeave)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [handleMouseMove, handleMouseLeave])

  return (
    <>
      {/* 1. Cyber Grid Layer (Subtle security aesthetic) */}
      <div className="cyber-grid" />
      
      {/* 2. Scanline Layer */}
      <div className="scanline animate-scanline" />

      {/* 3. Canvas for subtle floating particles */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />
      
      {/* 4. CSS-animated floating orbs (Blurred, Black/White only) */}
      <motion.div
        className="fixed pointer-events-none"
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        style={{ 
          zIndex: 1,
          top: '15%',
          left: '15%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      
      <motion.div
        className="fixed pointer-events-none"
        animate={{
          y: [0, 40, 0],
          x: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{ 
          zIndex: 1,
          bottom: '10%',
          right: '15%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: "radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      
      {/* 5. Noise Overlay Layer */}
      <div className="noise-overlay" />
      
      {/* 6. Vignette Layer */}
      <div className="vignette-overlay" />
    </>
  )
}
