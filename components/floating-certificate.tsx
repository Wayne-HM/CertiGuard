"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { Shield, CheckCircle, Award, Sparkles, Globe, User, BookOpen } from "lucide-react"

export function FloatingCertificate() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Mouse tracking logic for 3D tilt
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const mouseXSpring = useSpring(x, { stiffness: 120, damping: 25 })
  const mouseYSpring = useSpring(y, { stiffness: 120, damping: 25 })
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [18, -18])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-18, 18])
  
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
      className="relative w-full max-w-[550px] aspect-[1.4/1] [perspective:2000px] cursor-pointer group"
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="w-full h-full glass-strong rounded-[2.5rem] p-10 border border-white/10 flex flex-col justify-between relative overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] diamond-border"
      >
        <div className="absolute inset-0 noise-surface opacity-[0.06] pointer-events-none" />
        
        {/* Prismatic Shimmer overlay */}
        <motion.div 
          className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/[0.08] to-transparent -translate-y-full group-hover:translate-y-[200%] transition-transform duration-[2000ms] pointer-events-none"
        />
        
        <div className="absolute top-0 right-0 w-60 h-60 bg-primary/10 rounded-full blur-[100px] opacity-30 group-hover:opacity-50 transition-opacity" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-accent/10 rounded-full blur-[100px] opacity-30 group-hover:opacity-50 transition-opacity" />
 
        {/* Certificate Header */}
        <div className="flex justify-between items-start relative z-10" style={{ transform: "translateZ(40px)" }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#0a0a0c] rounded-2xl flex items-center justify-center border border-primary/20 diamond-border shadow-2xl group-hover:border-primary/50 transition-colors">
               <div className="absolute inset-0 bg-primary/5 rounded-2xl" />
              <Shield className="w-8 h-8 text-primary filter drop-shadow-[0_0_8px_rgba(124,255,160,0.5)]" />
            </div>
            <div>
              <h4 className="font-black text-foreground text-xl uppercase tracking-[0.2em] italic font-heading">CertiGuard_OS</h4>
              <p className="text-[10px] text-primary/40 uppercase tracking-[0.4em] font-black">Forensic_Node_v4.5</p>
            </div>
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border border-dashed border-primary/20 rounded-full flex items-center justify-center"
          >
            <Sparkles className="w-6 h-6 text-primary/60" />
          </motion.div>
        </div>

        {/* Body */}
        <div className="space-y-6 relative z-10" style={{ transform: "translateZ(60px)" }}>
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground/40 uppercase font-black tracking-[0.4em]">AUTHENTICATED_HOLDER</p>
            <h3 className="text-4xl font-black bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent italic tracking-tighter">ALEX_STERLING</h3>
          </div>
          
          <div className="relative h-px w-full">
             <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-accent/60 to-transparent" />
             <motion.div 
               className="absolute inset-0 bg-white/20 blur-[1px]"
               animate={{ opacity: [0.2, 0.6, 0.2] }}
               transition={{ duration: 2, repeat: Infinity }}
             />
          </div>
          
          <div className="flex justify-between items-end">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm font-bold italic font-heading text-foreground/80">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="tracking-tight uppercase">Adv_Neural_Networks_Specialization</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-success/5 border border-success/20 w-fit diamond-border group/status">
                <CheckCircle className="w-5 h-5 text-success animate-pulse" />
                <span className="text-[10px] font-black text-success tracking-[0.3em] uppercase">STATUS: AUTHENTIC / SECURED</span>
              </div>
            </div>
            
            {/* Prismatic Holographic Seal */}
            <motion.div 
              whileHover={{ rotate: [-5, 5, -5] }}
              className="relative w-24 h-24"
              style={{ transform: "translateZ(30px)" }}
            >
              <div className="absolute inset-[-10px] bg-primary/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative w-full h-full bg-[#0a0a0c] rounded-full flex items-center justify-center border-[6px] border-white/5 shadow-2xl overflow-hidden diamond-border group/seal">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 animate-spin-slow opacity-40" />
                <Award className="w-12 h-12 text-primary relative z-10 filter drop-shadow-[0_0_12px_rgba(124,255,160,0.6)]" />
                {/* High-frequency prism effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 translate-x-[-150%] group-hover/seal:translate-x-[150%] transition-transform duration-[1200ms]"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Forensic Footer Metadata */}
        <div className="flex justify-between items-center pt-6 border-t border-white/5 relative z-10" style={{ transform: "translateZ(40px)" }}>
          <div className="flex items-center gap-6 text-[9px] text-muted-foreground/30 font-mono tracking-[0.2em] font-black italic">
            <div className="flex items-center gap-2 group-hover:text-primary transition-colors">
              <Globe className="w-3.5 h-3.5" />
              <span>G_SYNC: 882.v4</span>
            </div>
            <div className="flex items-center gap-2 group-hover:text-accent transition-colors">
              <User className="w-3.5 h-3.5" />
              <span>TERMINAL: 2991-P</span>
            </div>
          </div>
          <div className="text-[9px] font-black text-primary border border-primary/20 bg-primary/5 px-4 py-1.5 rounded-xl tracking-[0.4em] diamond-border uppercase group-hover:bg-primary/10 transition-colors">
            CYBER_SECURED
          </div>
        </div>

        {/* Ambient Hover Border */}
        <div className="absolute inset-0 border-2 border-primary/10 rounded-[2.5rem] group-hover:border-primary/40 transition-all duration-700 pointer-events-none" />
      </motion.div>
    </div>
  )
}

