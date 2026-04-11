"use client"

import { useRef, memo, useCallback } from "react"
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion"
import { ArrowRight, Sparkles, Shield, Zap, CheckCircle, Globe, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FloatingCertificate } from "@/components/floating-certificate"

const stats = [
  { value: "99.9%", label: "Accuracy Rate", icon: Shield, color: "text-neon-blue" },
  { value: "500K+", label: "Verified", icon: Sparkles, color: "text-neon-cyan" },
  { value: "<3s", label: "Time", icon: Zap, color: "text-neon-purple" },
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
      className="relative min-h-screen flex items-center justify-center px-4 pt-32 pb-20 overflow-hidden"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Side: Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-left"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-primary/20">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-2">CertiGuard Official</span>
              <div className="h-4 w-px bg-glass-border mr-2" />
              <span className="text-xs text-foreground font-medium">Institutional Verification Standard</span>
            </div>
          </motion.div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-8">
            <span className="text-foreground">Verify Every</span>
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent neon-text">
                Credential Securely
              </span>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 1, delay: 0.8 }}
                className="absolute -bottom-2 left-0 h-1 w-full bg-gradient-to-r from-primary to-accent rounded-full origin-left opacity-30"
              />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed">
            Leading-edge forensic analysis for educational credentials. 
            Ensure authenticity with our neural-verified certification framework.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 mb-12">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={quickSpring}>
              <Button
                size="lg"
                onClick={() => scrollToSection('verify')}
                className="relative overflow-hidden bg-gradient-to-r from-primary/90 to-primary text-white px-8 h-14 text-lg rounded-2xl shadow-xl shadow-primary/10 group"
              >
                <div className="relative z-10 flex items-center gap-2">
                  Verify Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
              </Button>
            </motion.div>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection('about')}
              className="px-8 h-14 text-lg rounded-2xl border-glass-border hover:bg-white/5 transition-all"
            >
              Learn More
            </Button>
          </div>

          {/* Mini Stats */}
          <div className="flex items-center gap-8 border-t border-glass-border pt-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  {stat.value}
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Side: 3D Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateY: 30 }}
          animate={isInView ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="relative flex items-center justify-center lg:justify-end"
        >
          {/* Floating UI Elements */}
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-10 -left-10 z-20 glass p-4 rounded-2xl border-primary/30 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">AI Score</p>
                <p className="text-sm font-bold text-primary font-mono">100/100</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-6 right-0 z-20 glass p-4 rounded-2xl border-accent/20 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Global Rank</p>
                <p className="text-sm font-bold text-accent">Top 1%</p>
              </div>
            </div>
          </motion.div>

          {/* Main 3D Certificate */}
          <FloatingCertificate />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:block"
      >
        <div className="w-[1px] h-12 bg-gradient-to-b from-neon-blue to-transparent mx-auto relative">
          <motion.div 
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-neon-blue rounded-full blur-[2px]"
          />
        </div>
      </motion.div>
    </section>
  )
}
