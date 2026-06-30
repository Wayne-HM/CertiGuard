"use client"

import { forwardRef, memo, useRef, useState, useCallback, useEffect } from "react"
import { motion, useAnimation, useInView } from "framer-motion"

interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong" | "card" | "orb"
  interactive?: boolean
  spotlight?: boolean
  children: React.ReactNode
}

// Apple-inspired spring physics
export const smoothSpring = { type: "spring", stiffness: 250, damping: 25, mass: 0.5 }

export const GlassContainer = memo(forwardRef<HTMLDivElement, GlassContainerProps>(
  function GlassContainer({ variant = "default", interactive = true, spotlight = false, children, className = "", style, ...props }, ref) {
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (!spotlight || !containerRef.current) return
      // Only do spotlight on desktop
      if (window.innerWidth < 768) return;

      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setCursorPosition({ x, y })
    }, [spotlight])

    const variantClasses = {
      default: "liquid-glass",
      strong: "liquid-glass backdrop-blur-[40px] bg-[rgba(255,255,255,0.04)]",
      card: "glass-card glass-reflection", // Includes hover reflection pseudo-element
      orb: "rounded-full bg-glass-bg border border-glass-border backdrop-blur-xl",
    }[variant]

    return (
      <motion.div
        ref={ref}
        className={`${variantClasses} rounded-3xl ${className}`}
        style={{
          ...style,
          ...(spotlight && {
            "--cursor-x": `${cursorPosition.x}px`,
            "--cursor-y": `${cursorPosition.y}px`,
          } as React.CSSProperties),
        } as React.CSSProperties}
        onMouseMove={handleMouseMove}
        whileHover={interactive ? { scale: 1.01, filter: "brightness(1.1)" } : {}}
        transition={smoothSpring}
        {...props}
      >
        {children}
        {spotlight && <div className="spotlight-container absolute inset-0 pointer-events-none rounded-3xl" />}
      </motion.div>
    )
  }
))

GlassContainer.displayName = "GlassContainer"

// Apple-style button with magnetic effect
interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "glass"
  size?: "sm" | "md" | "lg"
  children: React.ReactNode
}

const buttonVariants = {
  primary: "bg-white text-black font-medium hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)]",
  secondary: "bg-surface-2 text-white border border-glass-border hover:bg-[rgba(255,255,255,0.1)]",
  ghost: "bg-transparent text-text-secondary hover:text-white hover:bg-surface-1",
  glass: "liquid-glass text-white hover:bg-surface-2 glass-reflection",
}

const buttonSizes = {
  sm: "h-9 px-4 text-sm rounded-full",
  md: "h-11 px-6 text-sm rounded-full",
  lg: "h-14 px-8 text-base rounded-full",
}

export const GlassButton = memo(forwardRef<HTMLButtonElement, GlassButtonProps>(
  function GlassButton({ variant = "glass", size = "md", children, className = "", ...props }, ref) {
    const buttonRef = useRef<HTMLButtonElement>(null)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovered, setIsHovered] = useState(false)

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (!buttonRef.current || window.innerWidth < 768) return
      const rect = buttonRef.current.getBoundingClientRect()
      setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }, [])

    return (
      <motion.button
        ref={ref}
        className={`${buttonVariants[variant]} ${buttonSizes[size]} relative overflow-hidden inline-flex items-center justify-center gap-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:pointer-events-none disabled:opacity-50 ${className}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={smoothSpring}
        {...props}
      >
        {variant === "primary" && isHovered && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none hidden md:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: `radial-gradient(60px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.4), transparent 70%)`,
            }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </motion.button>
    )
  }
))

GlassButton.displayName = "GlassButton"

// Apple-style card with frosted glass effect
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  children: React.ReactNode
}

export const GlassCard = memo(forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard({ interactive = true, children, className = "", ...props }, ref) {
    return (
      <motion.div
        ref={ref}
        className={`glass-card glass-reflection rounded-3xl p-6 relative overflow-hidden ${className}`}
        whileHover={interactive ? { y: -5, scale: 1.01 } : undefined}
        transition={smoothSpring}
        {...props}
      >
        <div className="relative z-10 h-full">{children}</div>
      </motion.div>
    )
  }
))

GlassCard.displayName = "GlassCard"