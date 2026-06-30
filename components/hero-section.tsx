"use client"

import { useRef, useCallback } from "react"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { ArrowRight, Sparkles, Shield, Zap } from "lucide-react"
import { GlassButton } from "@/components/ui/glass-container"

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
  const rotateOrb = useTransform(scrollY, [0, 800], [0, 45])

  return (
    <section
      ref={containerRef}
      id="home"
      className="relative min-h-screen flex items-center justify-center px-4 pt-32 pb-20 overflow-hidden"
    >
      {/* Background spotlight behind text for that Vision Pro glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/5 blur-[120px] pointer-events-none hidden lg:block"
      />

      <motion.div 
        className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center w-full"
        style={{ y: yContent, opacity: opacityContent, scale: scaleContent }}
      >
        {/* Left Side: Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="relative z-10 text-left"
        >
          {/* Badge - Apple style subtle glass capsule */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full liquid-glass border border-glass-border">
              <Sparkles className="w-4 h-4 text-text-secondary" />
              <span className="text-xs font-semibold text-text-secondary tracking-widest uppercase">CertiGuard PRO</span>
              <div className="h-3 w-px bg-glass-border" />
              <span className="text-xs text-text-secondary font-medium tracking-wide">AI Verification Engine</span>
            </div>
          </motion.div>

          {/* Main Title - Apple oversized typography */}
          <motion.h1 variants={itemVariants} className="text-6xl md:text-7xl lg:text-8xl font-semibold leading-[0.95] mb-8 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40">
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
              <span className="flex items-center gap-2 font-semibold">
                Verify Now
                <ArrowRight className="w-5 h-5" />
              </span>
            </GlassButton>

            <GlassButton variant="ghost" size="lg" onClick={() => scrollToSection('about')}>
              Learn More
            </GlassButton>
          </motion.div>

          {/* Mini Stats - Clean and minimal liquid glass cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-6 pt-10 border-t border-glass-border">
            {stats.map((stat, i) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-medium text-text-primary flex items-center gap-2">
                  {stat.value}
                </div>
                <div className="text-[11px] uppercase font-bold tracking-widest text-text-secondary mt-2 flex items-center gap-1.5">
                  <stat.icon className="w-3.5 h-3.5 opacity-60" />
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right Side: 3D Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
          animate={isInView ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
          transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1], delay: 0.3 }}
          className="relative flex items-center justify-center lg:justify-end h-[500px]"
          style={{ y: yOrb, rotate: rotateOrb }}
        >
          {/* Cyber-security aesthetic scanning ring */}
          <motion.div 
            className="absolute w-[450px] h-[450px] rounded-full border border-[rgba(255,255,255,0.05)]"
            animate={{ rotate: 360, scale: [1, 1.05, 1] }}
            transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, scale: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
          />

          <motion.div 
            className="absolute w-[350px] h-[350px] rounded-full border border-dashed border-[rgba(255,255,255,0.1)]"
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />

          {/* 3D Glass Orb Visual (Nothing.tech / Vision Pro style) */}
          <div className="w-80 h-80 rounded-full liquid-glass flex items-center justify-center relative overflow-hidden group shadow-[0_0_100px_rgba(255,255,255,0.05)]">
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Inner dynamic core */}
            <motion.div 
              className="w-40 h-40 rounded-full bg-white/5 blur-xl absolute"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            <Shield className="w-24 h-24 text-white/40 relative z-10 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" strokeWidth={1} />
            
            {/* Glass reflection shine */}
            <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[30deg] group-hover:animate-[shimmer_1.5s_ease-out]" />
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