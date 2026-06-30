"use client"

import { useEffect, useRef, useCallback, memo } from "react"
import { useTheme } from "next-themes"

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0, active: false })
  const animationRef = useRef<number>(0)
  const { resolvedTheme } = useTheme()

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

    // Sophisticated Security Network Constellation
    const particleCount = Math.min(Math.floor((width * height) / 15000), 100)
    const particles: {x: number, y: number, vx: number, vy: number, size: number}[] = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
      })
    }

    const mouseInfluenceRadius = 150
    const connectionDistance = 120

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      
      const isDark = document.documentElement.classList.contains('dark')
      const rgb = isDark ? "255, 255, 255" : "0, 0, 0"

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Mouse interaction
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - p.x
          const dy = mouseRef.current.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < mouseInfluenceRadius) {
            const force = (mouseInfluenceRadius - dist) / mouseInfluenceRadius
            p.vx -= (dx / dist) * force * 0.5
            p.vy -= (dy / dist) * force * 0.5
            
            // Connect to mouse
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(mouseRef.current.x, mouseRef.current.y)
            ctx.strokeStyle = `rgba(${rgb}, ${force * 0.2})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }

        // Apply velocity and friction
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.98
        p.vy *= 0.98

        // Restore natural movement if slowed down
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed < 0.2) {
          p.vx += (Math.random() - 0.5) * 0.1
          p.vy += (Math.random() - 0.5) * 0.1
        }

        // Wrap edges
        if (p.x < -20) p.x = width + 20
        else if (p.x > width + 20) p.x = -20
        if (p.y < -20) p.y = height + 20
        else if (p.y > height + 20) p.y = -20

        // Draw particle
        ctx.fillStyle = `rgba(${rgb}, 0.5)`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        // Connect particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < connectionDistance) {
            const opacity = 1 - (dist / connectionDistance)
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(${rgb}, ${opacity * 0.15})`
            ctx.lineWidth = 1
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
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [handleMouseMove, handleMouseLeave, resolvedTheme])

  return (
    <>
      <div className="cyber-grid" />
      <div className="scanline animate-scanline" />
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />
      <div className="noise-overlay" />
      <div className="vignette-overlay" />
    </>
  )
}
