"use client"

import { useState, useEffect } from "react"

export function CursorSpotlight() {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300 hidden md:block"
      style={{
        background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.02), transparent 40%)`,
        opacity: 0.7,
      }}
    />
  )
}
