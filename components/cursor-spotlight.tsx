"use client"

import { useState, useEffect } from "react"
import { motion, useSpring, useMotionValue } from "framer-motion"

export function CursorSpotlight() {
  const [isVisible, setIsVisible] = useState(false)
  
  const mouseX = useMotionValue(-1000)
  const mouseY = useMotionValue(-1000)
  
  // Very subtle smoothed spotlight following cursor
  const springConfig = { damping: 30, stiffness: 200, mass: 1 }
  const smoothX = useSpring(mouseX, springConfig)
  const smoothY = useSpring(mouseY, springConfig)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      if (!isVisible) setIsVisible(true)
    }
    
    const handleMouseLeave = () => setIsVisible(false)
    const handleMouseEnter = () => setIsVisible(true)

    window.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("mouseenter", handleMouseEnter)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("mouseenter", handleMouseEnter)
    }
  }, [isVisible, mouseX, mouseY])

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-500 hidden md:block"
      style={{
        background: `radial-gradient(600px circle at ${smoothX.get()}px ${smoothY.get()}px, var(--spotlight-color), transparent 40%)`,
        opacity: isVisible ? 1 : 0,
      }}
    />
  )
}
