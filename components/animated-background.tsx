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

    // Optimized particle count based on screen size
    const particleCount = Math.min(60, Math.floor((width * height) / 25000))
    
    // Initialize particles only once
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2 + 1,
          alpha: Math.random() * 0.5 + 0.2,
          hue: Math.random() * 60 + 200,
        })
      }
    }

    const particles = particlesRef.current
    const gridSize = 100
    const connectionDistance = 100
    const connectionDistanceSq = connectionDistance * connectionDistance

    // Pre-calculate common values
    const mouseInfluenceRadius = 180
    const mouseInfluenceRadiusSq = mouseInfluenceRadius * mouseInfluenceRadius

    const animate = (currentTime: number) => {
      // Target 60fps for canvas (will interpolate smoothly)
      const deltaTime = currentTime - lastTimeRef.current
      if (deltaTime < 16) { // ~60fps cap for canvas
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      lastTimeRef.current = currentTime

      ctx.clearRect(0, 0, width, height)

      // Draw subtle grid with wave effect (simplified)
      ctx.strokeStyle = "rgba(59, 130, 246, 0.025)"
      ctx.lineWidth = 1
      ctx.beginPath()
      
      const time = currentTime * 0.001
      for (let x = 0; x <= width + gridSize; x += gridSize) {
        const wave = Math.sin(time + x * 0.008) * 3
        ctx.moveTo(x + wave, 0)
        ctx.lineTo(x + wave, height)
      }
      for (let y = 0; y <= height + gridSize; y += gridSize) {
        const wave = Math.cos(time + y * 0.008) * 3
        ctx.moveTo(0, y + wave)
        ctx.lineTo(width, y + wave)
      }
      ctx.stroke()

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i]

        // Mouse attraction (optimized)
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - particle.x
          const dy = mouseRef.current.y - particle.y
          const distSq = dx * dx + dy * dy
          
          if (distSq < mouseInfluenceRadiusSq && distSq > 0) {
            const force = (1 - distSq / mouseInfluenceRadiusSq) * 0.015
            const invDist = 1 / Math.sqrt(distSq)
            particle.vx += dx * invDist * force
            particle.vy += dy * invDist * force
          }
        }

        // Apply velocity with damping
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vx *= 0.985
        particle.vy *= 0.985

        // Wrap around screen
        if (particle.x < -10) particle.x = width + 10
        else if (particle.x > width + 10) particle.x = -10
        if (particle.y < -10) particle.y = height + 10
        else if (particle.y > height + 10) particle.y = -10

        // Draw particle (simplified for performance)
        ctx.fillStyle = `hsla(${particle.hue}, 75%, 60%, ${particle.alpha})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw connections (optimized with spatial check)
      ctx.lineWidth = 0.5
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distSq = dx * dx + dy * dy

          if (distSq < connectionDistanceSq) {
            const alpha = (1 - distSq / connectionDistanceSq) * 0.15
            ctx.strokeStyle = `hsla(220, 70%, 60%, ${alpha})`
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
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
      
      {/* CSS-animated gradient overlays (GPU accelerated) */}
      <div 
        className="fixed inset-0 pointer-events-none gpu-accelerate"
        style={{ 
          zIndex: 1,
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.7 0.2 220 / 0.12), transparent),
            radial-gradient(ellipse 60% 40% at 100% 50%, oklch(0.6 0.25 300 / 0.08), transparent),
            radial-gradient(ellipse 60% 40% at 0% 80%, oklch(0.78 0.14 195 / 0.06), transparent)
          `
        }}
      />
      
      {/* CSS-animated floating orbs (GPU accelerated with will-change) */}
      <FloatingOrb
        className="fixed pointer-events-none animate-orb-1 gpu-accelerate"
        style={{ 
          zIndex: 1,
          top: '20%',
          left: '20%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: "radial-gradient(circle, oklch(0.7 0.2 220 / 0.1) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      
      <FloatingOrb
        className="fixed pointer-events-none animate-orb-2 gpu-accelerate"
        style={{ 
          zIndex: 1,
          bottom: '20%',
          right: '20%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: "radial-gradient(circle, oklch(0.6 0.25 300 / 0.08) 0%, transparent 70%)",
          filter: "blur(35px)",
        }}
      />
      
      <FloatingOrb
        className="fixed pointer-events-none animate-orb-3 gpu-accelerate"
        style={{ 
          zIndex: 1,
          top: '50%',
          right: '30%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: "radial-gradient(circle, oklch(0.78 0.14 195 / 0.06) 0%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />
      
      {/* Subtle noise texture (static, no animation) */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.012]"
        style={{ 
          zIndex: 2,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Vignette effect (static) */}
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
