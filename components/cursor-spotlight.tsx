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
      
      {/* Custom Pointer SVG */}
      <motion.div
        className="fixed w-8 h-8 pointer-events-none z-[9999] hidden md:block"
        style={{
          x: mouseX,
          y: mouseY,
          // Removed the -50% translations so the top-left tip is exactly at the mouse coordinates
          opacity: isVisible ? 1 : 0,
        }}
      >
        <svg 
          width="32" 
          height="32" 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)] text-text-primary"
        >
          <path 
            d="M4.5 4.5L23.5 12.5L14.5 15.5L10.5 25.5L4.5 4.5Z" 
            fill="currentColor" 
            stroke="var(--bg-color)" 
            strokeWidth="2.5" 
            strokeLinejoin="round" 
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    </>
  )
}
