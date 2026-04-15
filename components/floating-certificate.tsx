"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { Shield, CheckCircle, Award, Sparkles, Globe, User, BookOpen } from "lucide-react"

export function FloatingCertificate() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Mouse tracking logic for 3D tilt
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const mouseXSpring = useSpring(x, { stiffness: 100, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 100, damping: 30 })
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [15, -15])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-15, 15])
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    x.set(mouseX / width - 0.5)
    y.set(mouseY / height - 0.5)
  }
  
  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[500px] aspect-[1.4/1] [perspective:1000px] cursor-pointer group"
    >
      <motion.div
        style={{ rotateX, rotateY }}
        className="w-full h-full glass-strong rounded-3xl p-8 border-primary/20 flex flex-col justify-between relative overflow-hidden shadow-2xl transition-shadow duration-500 group-hover:shadow-primary/20"
      >
        {/* Shimmer overlay */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
        />
        
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />
 
        {/* Certificate Header */}
        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-lg uppercase tracking-wider">CertiGuard Official</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Verification Certificate</p>
            </div>
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-2 border-dashed border-emerald-400/30 rounded-full flex items-center justify-center"
          >
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </motion.div>
        </div>

        {/* Body */}
        <div className="space-y-4 relative z-10">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Presented to</p>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent italic">Alex Sterling</h3>
          </div>
          
          <div className="h-px w-full bg-gradient-to-r from-primary/50 via-emerald-400/50 to-transparent" />
          
          <div className="flex justify-between items-end">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4 text-accent" />
                <span>Advanced AI Specialization</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span className="font-bold">STATUS: AUTHENTIC</span>
              </div>
            </div>
            
            {/* Holographic Seal */}
            <motion.div 
              whileHover={{ rotate: [-5, 5, -5] }}
              className="relative w-16 h-16"
            >
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full animate-glow-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-primary to-emerald-500 rounded-full flex items-center justify-center border-4 border-white/20 shadow-xl overflow-hidden group">
                <Award className="w-8 h-8 text-white relative z-10" />
                {/* Prism effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent translate-y-full group-hover:translate-y-[-100%] transition-transform duration-1000" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-glass-border relative z-10">
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3 h-3" />
              <span>GLOBAL-ID-882</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3" />
              <span>ID: 2991-X</span>
            </div>
          </div>
          <div className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded tracking-tighter">
            SECURED BY AI
          </div>
        </div>

        {/* Border Glow */}
        <div className="absolute inset-0 border-2 border-primary/10 rounded-3xl group-hover:border-primary/30 transition-colors pointer-events-none" />
      </motion.div>

    </div>
  )
}
