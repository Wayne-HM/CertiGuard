"use client"

import { useEffect, useRef, useCallback, memo } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  hue: number
}

// Memoized orb component for CSS-based animation (GPU accelerated)
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0, active: false })
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])

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
      desynchronized: true // Allows canvas to render independently
    })
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2) // Cap DPR for performance

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

    // Higher density for luxury feel
    const particleCount = Math.min(100, Math.floor((width * height) / 18000))
    
    // Initialize particles only once
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.4 + 0.1,
          hue: Math.random() > 0.5 ? 155 : 195, // Radiant Emerald or Electric Cyan
        })
      }
    }

    const particles = particlesRef.current
    const gridSize = 120
    const connectionDistance = 120
    const connectionDistanceSq = connectionDistance * connectionDistance

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current
      if (deltaTime < 16) { 
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      lastTimeRef.current = currentTime

      ctx.clearRect(0, 0, width, height)

      // Draw subtle phantom grid
      ctx.strokeStyle = "rgba(124, 255, 200, 0.01)"
      ctx.lineWidth = 0.5
      ctx.beginPath()
      
      const time = currentTime * 0.0008
      for (let x = 0; x <= width + gridSize; x += gridSize) {
        const wave = Math.sin(time + x * 0.005) * 5
        ctx.moveTo(x + wave, 0)
        ctx.lineTo(x + wave, height)
      }
      for (let y = 0; y <= height + gridSize; y += gridSize) {
        const wave = Math.cos(time + y * 0.005) * 5
        ctx.moveTo(0, y + wave)
        ctx.lineTo(width, y + wave)
      }
      ctx.stroke()

      // Update and draw connections (Liquid layer)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distSq = dx * dx + dy * dy

          if (distSq < connectionDistanceSq) {
            const alpha = (1 - distSq / connectionDistanceSq) * 0.12
            ctx.strokeStyle = `hsla(${particles[i].hue}, 80%, 65%, ${alpha})`
            ctx.lineWidth = 0.8
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // Draw particles
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i]

        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - particle.x
          const dy = mouseRef.current.y - particle.y
          const distSq = dx * dx + dy * dy
          
          if (distSq < 40000) { // Larger influence
            const force = (1 - distSq / 40000) * 0.015
            const invDist = 1 / Math.sqrt(distSq)
            particle.vx += dx * invDist * force
            particle.vy += dy * invDist * force
          }
        }

        particle.x += particle.vx
        particle.y += particle.vy
        particle.vx *= 0.99
        particle.vy *= 0.99

        if (particle.x < -20) particle.x = width + 20
        else if (particle.x > width + 20) particle.x = -20
        if (particle.y < -20) particle.y = height + 20
        else if (particle.y > height + 20) particle.y = -20

        ctx.fillStyle = `hsla(${particle.hue}, 80%, 70%, ${particle.alpha})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
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
      {/* Canvas layer */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none gpu-accelerate"
        style={{ zIndex: 0 }}
      />
      
      {/* Liquid Aurora Overlays */}
      <div 
        className="fixed inset-0 pointer-events-none gpu-accelerate"
        style={{ 
          zIndex: 1,
          background: `
            radial-gradient(circle at 50% -20%, oklch(0.78 0.22 155 / 0.1), transparent 70%),
            radial-gradient(circle at 100% 50%, oklch(0.8 0.18 195 / 0.08), transparent 60%),
            radial-gradient(circle at 0% 80%, oklch(0.65 0.25 280 / 0.05), transparent 60%)
          `
        }}
      />
      
      {/* Prismatic Floating Orbs */}
      <FloatingOrb
        className="fixed pointer-events-none animate-orb-1"
        style={{ 
          zIndex: 1,
          top: '15%',
          left: '10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: "radial-gradient(circle, oklch(0.78 0.22 155 / 0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      
      <FloatingOrb
        className="fixed pointer-events-none animate-orb-2"
        style={{ 
          zIndex: 1,
          bottom: '10%',
          right: '5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: "radial-gradient(circle, oklch(0.8 0.18 195 / 0.08) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      
      <FloatingOrb
        className="fixed pointer-events-none animate-orb-3"
        style={{ 
          zIndex: 1,
          top: '40%',
          right: '25%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: "radial-gradient(circle, oklch(0.65 0.25 280 / 0.06) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
      
      {/* Micro-Noise Texture Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay"
        style={{ 
          zIndex: 2,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Prismatic Vignette */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ 
          zIndex: 2,
          background: "radial-gradient(ellipse at center, transparent 20%, oklch(0.08 0.01 220 / 0.7) 100%)",
        }}
      />
    </>
  )
}


