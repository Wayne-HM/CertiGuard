"use client"

import { useState, useEffect } from "react"
import { motion, useSpring, useMotionValue } from "framer-motion"

export function CursorSpotlight() {
  const [isVisible, setIsVisible] = useState(false)
  
  // Motion values for instant dot tracking
  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)
  
  // Spring config for the trailing ring
  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 }
  const ringX = useSpring(mouseX, springConfig)
  const ringY = useSpring(mouseY, springConfig)

  useEffect(() => {
    // Add global hide-cursor class
    document.body.classList.add("cursor-none")
    
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
      document.body.classList.remove("cursor-none")
      window.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("mouseenter", handleMouseEnter)
    }
  }, [isVisible, mouseX, mouseY])

  return (
    <>
      {/* Background ambient spotlight (Optional, keeping it faint) */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300 hidden md:block"
        style={{
          background: `radial-gradient(600px circle at ${mouseX.get()}px ${mouseY.get()}px, var(--spotlight-color), transparent 40%)`,
          opacity: isVisible ? 1 : 0,
        }}
      />
      
      {/* Custom Pointer Dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-text-primary pointer-events-none z-[9999] mix-blend-difference hidden md:block"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
          opacity: isVisible ? 1 : 0,
        }}
      />
      
      {/* Trailing Ring */}
      <motion.div
        className="fixed top-0 left-0 w-10 h-10 rounded-full border border-text-primary pointer-events-none z-[9998] mix-blend-difference hidden md:block"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
          opacity: isVisible ? 0.5 : 0,
        }}
      />
    </>
  )
}
