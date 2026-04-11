"use client"

import { useRef, memo, useCallback } from "react"
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion"
import { ArrowRight, Sparkles, Shield, Zap, CheckCircle, Globe, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FloatingCertificate } from "@/components/floating-certificate"

const stats = [
  { value: "99.9%", label: "Accuracy", icon: Shield, color: "text-primary" },
  { value: "500K+", label: "Verified", icon: Sparkles, color: "text-accent" },
  { value: "<3s", label: "Latency", icon: Zap, color: "text-emerald-400" },
]

// Optimized spring config for 120fps feel
const smoothSpring = { stiffness: 80, damping: 20, mass: 0.5 }
const quickSpring = { stiffness: 300, damping: 30, mass: 0.8 }

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })
  
  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <section 
      ref={containerRef}
      id="home" 
      className="relative min-h-[95vh] flex items-center justify-center px-4 pt-40 pb-20 overflow-hidden"
    >
      {/* Background Decorative Element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1400px] pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] left-[10%] w-[40%] h-[40%] bg-primary/20 blur-[150px] rounded-full animate-aurora mix-blend-screen" />
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-accent/15 blur-[130px] rounded-full animate-aurora mix-blend-screen" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Side: Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-left"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-primary/20 shadow-2xl shadow-primary/5">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Certified Standards</span>
              <div className="h-3 w-px bg-glass-border mx-1" />
              <span className="text-[10px] text-primary font-bold tracking-widest uppercase">Institutional Gold</span>
            </div>
          </motion.div>

          {/* Main Title */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] mb-8 tracking-tighter font-heading">
            <span className="text-foreground">Verify Every</span>
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-br from-primary via-accent to-emerald-400 bg-clip-text text-transparent italic glow-text pb-2">
                Credential
              </span>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 1.2, delay: 0.8 }}
                className="absolute -bottom-1 left-0 h-1.5 w-full bg-gradient-to-r from-primary/60 to-accent/40 rounded-full origin-left opacity-40 blur-[1px]"
              />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground/80 max-w-xl mb-12 leading-relaxed font-medium">
            Next-generation forensic analysis for educational records. 
            Automated, high-fidelity authenticity verification at global scale.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-6 mb-16">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={quickSpring}>
              <Button
                size="lg"
                onClick={() => scrollToSection('verify')}
                className="relative overflow-hidden bg-primary text-primary-foreground px-10 h-16 text-xl rounded-2xl shadow-2xl shadow-primary/30 group font-bold"
              >
                <div className="relative z-10 flex items-center gap-3">
                  Start Verification
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </Button>
            </motion.div>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection('about')}
              className="px-10 h-16 text-xl rounded-2xl border-glass-border hover:bg-primary/5 hover:border-primary/50 transition-all font-semibold"
            >
              Explore Tech
            </Button>
          </div>

          {/* Mini Stats */}
          <div className="flex items-center gap-10 border-t border-glass-border pt-10">
            {stats.map((stat) => (
              <div key={stat.label} className="group">
                <div className="text-3xl font-bold text-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
                  <stat.icon className={`w-5 h-5 text-primary`} />
                  {stat.value}
                </div>
                <div className="text-[9px] uppercase font-bold tracking-[0.15em] text-muted-foreground mt-1.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Side: 3D Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, perspective: 1000 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="relative flex items-center justify-center lg:justify-end"
        >
          {/* Floating UI Elements */}
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-16 -left-16 z-20 glass-strong p-5 rounded-3xl border-primary shadow-[0_0_50px_rgba(124,255,160,0.15)] diamond-border"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Trust Index</p>
                <p className="text-lg font-bold text-primary italic font-heading">VERIFIED</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-10 right-0 z-20 glass-strong p-5 rounded-3xl border-accent shadow-[0_0_50px_rgba(100,220,255,0.1)]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Network</p>
                <p className="text-lg font-bold text-accent italic font-heading">GLOBAL</p>
              </div>
            </div>
          </motion.div>

          {/* Main 3D Certificate */}
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-colors duration-700" />
            <FloatingCertificate />
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:block"
      >
        <div className="w-[1.5px] h-16 bg-gradient-to-b from-primary to-transparent mx-auto relative overflow-hidden rounded-full">
          <motion.div 
            animate={{ top: ["-10%", "110%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-0 w-full h-4 bg-primary blur-[2px]"
          />
        </div>
      </motion.div>

    </section>
  )
}
