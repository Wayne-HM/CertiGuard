"use client"

import { useRef } from "react"
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion"
import { BookOpen, GraduationCap, Award, Building, ArrowRight, Sparkles, Laptop } from "lucide-react"

const platforms = [
  {
    name: "Coursera",
    description: "World-class courses from top universities",
    icon: GraduationCap,
    gradient: "from-blue-500 to-blue-600",
    url: "https://www.coursera.org",
  },
  {
    name: "Udemy",
    description: "Learn anything, anytime, anywhere",
    icon: BookOpen,
    gradient: "from-purple-500 to-purple-600",
    url: "https://www.udemy.com",
  },
  {
    name: "Alison",
    description: "Free online courses with certificates",
    icon: Award,
    gradient: "from-emerald-500 to-emerald-600",
    url: "https://alison.com",
  },
  {
    name: "Saylor Academy",
    description: "Free and open online courses",
    icon: Building,
    gradient: "from-orange-500 to-orange-600",
    url: "https://www.saylor.org",
  },
  {
    name: "Infosys Springboard",
    description: "Digital learning for every learner",
    icon: Laptop,
    gradient: "from-blue-400 to-cyan-500",
    url: "https://infyspringboard.onwingspan.com",
  },
]

function PlatformCard({ platform, index }: { platform: typeof platforms[0], index: number }) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [10, -10])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-10, 10])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <motion.a
      ref={cardRef}
      href={platform.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative h-full cursor-pointer"
    >
      <div className="relative glass-card rounded-3xl p-8 h-full flex flex-col items-center text-center overflow-hidden border-glass-border hover:border-neon-blue/40 transition-colors duration-500">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <div className="relative mb-8" style={{ transform: "translateZ(30px)" }}>
          <div className={`absolute inset-0 bg-gradient-to-br ${platform.gradient} opacity-20 blur-xl rounded-full scale-150 group-hover:opacity-40 transition-opacity`} />
          <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${platform.gradient} flex items-center justify-center shadow-lg`}>
            <platform.icon className="w-8 h-8 text-white" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-3" style={{ transform: "translateZ(20px)" }}>{platform.name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1" style={{ transform: "translateZ(10px)" }}>{platform.description}</p>
        <div className="flex items-center gap-2 text-xs font-bold text-neon-blue tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Visit Platform <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </div>
        <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-white/5 rounded-tr-xl" />
        <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-white/5 rounded-bl-xl" />
      </div>
    </motion.a>
  )
}

export function PlatformsSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  return (
    <section ref={containerRef} id="about" className="relative py-32 px-4 bg-background/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 border-neon-purple/20">
            <Sparkles className="w-4 h-4 text-neon-purple" />
            <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Global Compatibility</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-neon-purple via-neon-blue to-neon-cyan bg-clip-text text-transparent italic">
              Trusted Everywhere.
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            CertiGuard seamlessly integrates with data protocols from the world&apos;s leading educational ecosystems.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 [perspective:2000px]">
          {platforms.map((platform, index) => (
            <PlatformCard key={platform.name} platform={platform} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
          className="mt-24 pt-12 border-t border-glass-border flex flex-wrap justify-center items-center gap-16"
        >
          <div className="flex flex-col items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
            <div className="text-2xl font-black text-foreground">API v4.0</div>
            <div className="text-[10px] font-bold tracking-[0.3em] text-neon-blue uppercase">Live Feed</div>
          </div>
          <div className="flex flex-col items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
            <div className="text-2xl font-black text-foreground">ISO/IEC</div>
            <div className="text-[10px] font-bold tracking-[0.3em] text-neon-cyan uppercase">Secured</div>
          </div>
          <div className="flex flex-col items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
            <div className="text-2xl font-black text-foreground">SHA-512</div>
            <div className="text-[10px] font-bold tracking-[0.3em] text-neon-purple uppercase">Encryption</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
