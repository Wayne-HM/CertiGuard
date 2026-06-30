"use client"

import { useRef, useCallback } from "react"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { ArrowRight, Sparkles, Shield, Zap, FileCheck, Search, Database } from "lucide-react"
import { GlassButton, GlassCard } from "@/components/ui/glass-container"

const stats = [
  { value: "99.9%", label: "Accuracy Rate", icon: Shield },
  { value: "1k+", label: "Verified", icon: Sparkles },
  { value: "<1min", label: "Time", icon: Zap },
]

// Apple-style scroll storytelling container variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25,
      mass: 0.5,
    },
  },
}

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  // Parallax effect mapped to scroll for smooth exit
  const { scrollY } = useScroll()
  const yContent = useTransform(scrollY, [0, 800], [0, 150])
  const opacityContent = useTransform(scrollY, [0, 500], [1, 0])
  const scaleContent = useTransform(scrollY, [0, 500], [1, 0.95])
  
  const yOrb = useTransform(scrollY, [0, 800], [0, -100])
  const rotateVisual = useTransform(scrollY, [0, 800], [0, 15])

  return (
    <section
      ref={containerRef}
      id="home"
      className="relative min-h-screen flex items-center justify-center px-4 pt-32 pb-20 overflow-hidden z-10"
    >
      {/* Background spotlight behind text for that Vision Pro glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/5 blur-[120px] pointer-events-none hidden lg:block"
      />

      <motion.div 
        className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center w-full relative z-10"
        style={{ y: yContent, opacity: opacityContent, scale: scaleContent }}
      >
        {/* Left Side: Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="relative z-20 text-left"
        >
          {/* Badge - Apple style subtle glass capsule */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full liquid-glass border border-glass-border">
              <Sparkles className="w-4 h-4 text-text-secondary" />
              <span className="text-xs font-bold text-text-secondary tracking-widest uppercase">CertiGuard PRO</span>
              <div className="h-3 w-px bg-glass-border" />
              <span className="text-xs text-text-secondary font-medium tracking-wide">AI Verification Engine</span>
            </div>
          </motion.div>

          {/* Main Title - Apple oversized typography */}
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-[5.5rem] font-semibold leading-[0.95] mb-8 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40">
            <span className="block mb-2">Stop Certificate</span>
            <span className="block">Fraud Instantly</span>
          </motion.h1>

          {/* Subtitle - Minimal and elegant */}
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-text-secondary max-w-xl mb-12 leading-relaxed font-light">
            Harness neural networks to verify educational credentials. Advanced forensic analysis
            that detects tampering with millisecond precision.
          </motion.p>

          {/* CTA Buttons - Apple style premium interactions */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-5 mb-16">
            <GlassButton variant="primary" size="lg" onClick={() => scrollToSection('verify')}>
              Verify Now
              <ArrowRight className="w-5 h-5 ml-1" />
            </GlassButton>

            <GlassButton variant="ghost" size="lg" onClick={() => scrollToSection('about')}>
              Learn More
            </GlassButton>
          </motion.div>

          {/* Mini Stats - Clean and minimal liquid glass cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-6 pt-10 border-t border-glass-border">
            {stats.map((stat, i) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-semibold text-text-primary flex items-center gap-2">
                  {stat.value}
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-text-secondary mt-2 flex items-center gap-1.5">
                  <stat.icon className="w-3 h-3 opacity-60" />
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right Side: Visual Redesign - Futuristic Glass Interface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1], delay: 0.3 }}
          className="relative flex items-center justify-center lg:justify-end h-[600px] z-10"
          style={{ y: yOrb, rotate: rotateVisual }}
        >
          {/* Main Visual Composition */}
          <div className="relative w-[450px] h-[550px]">
            {/* Background Glow */}
            <motion.div
              className="absolute inset-0 bg-white/5 rounded-full blur-[100px]"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Central Panel */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[360px]"
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <GlassCard interactive={false} className="p-6 border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                <div className="flex items-center gap-4 mb-8 border-b border-glass-border pb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white tracking-tight">System Status</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" />
                      <span className="text-xs text-text-secondary tracking-widest uppercase">Active Scanning</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Document Parsed", icon: FileCheck, delay: 0 },
                    { label: "Forensic Analysis", icon: Search, delay: 0.2 },
                    { label: "Database Matching", icon: Database, delay: 0.4 }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + item.delay, duration: 0.6 }}
                      className="flex items-center gap-4 p-3 rounded-xl bg-surface-1 border border-glass-border"
                    >
                      <item.icon className="w-5 h-5 text-text-secondary" />
                      <span className="text-sm font-medium text-text-primary">{item.label}</span>
                      <Shield className="w-4 h-4 text-text-secondary ml-auto" />
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  className="mt-8 pt-6 border-t border-glass-border text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.6 }}
                >
                  <p className="text-[10px] font-mono text-text-secondary tracking-widest uppercase">
                    &gt; AI Engine Operational
                  </p>
                </motion.div>
              </GlassCard>
            </motion.div>

            {/* Floating Accent 1 */}
            <motion.div
              className="absolute -right-8 top-20 w-48"
              animate={{ y: [15, -15, 15], rotate: [-5, 5, -5] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div className="liquid-glass p-4 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Authentic</p>
                    <p className="text-[10px] text-white/60">Verified Match</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Accent 2 */}
            <motion.div
              className="absolute -left-12 bottom-32 w-56"
              animate={{ y: [-20, 20, -20], rotate: [5, -5, 5] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <div className="liquid-glass p-4 rounded-2xl border border-glass-border shadow-2xl backdrop-blur-3xl">
                <div className="space-y-2">
                  <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white"
                      animate={{ width: ["0%", "100%", "0%"] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <p className="text-[10px] font-mono text-text-secondary text-right">Decrypting...</p>
                </div>
              </div>
            </motion.div>

            {/* Scanning Laser Line */}
            <motion.div
              className="absolute inset-0 z-20 pointer-events-none"
              initial={{ top: "0%" }}
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-full h-px bg-white/40 shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator - Apple style minimal dot */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 hidden md:block"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-[1px] h-12 bg-gradient-to-b from-white/30 to-transparent"
        />
      </motion.div>
    </section>
  )
}