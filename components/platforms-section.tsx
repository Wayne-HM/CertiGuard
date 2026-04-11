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
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 })
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 })
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [12, -12])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-12, 12])

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
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="group relative h-full cursor-pointer"
    >
      <div className="relative glass-strong rounded-[2.5rem] p-10 h-full flex flex-col items-center text-center overflow-hidden border-glass-border hover:border-primary/50 transition-all duration-700 diamond-border">
        <div className="absolute inset-0 noise-surface opacity-[0.05] pointer-events-none" />
        
        {/* Animated edge shimmer */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1500" />
        
        <div className="relative mb-8" style={{ transform: "translateZ(50px)" }}>
          <div className={`absolute inset-0 bg-gradient-to-br ${platform.gradient} opacity-20 blur-[40px] rounded-full scale-150 group-hover:opacity-50 transition-all duration-700`} />
          <div className={`relative w-20 h-20 rounded-2xl bg-[#0a0a0b] flex items-center justify-center shadow-2xl diamond-border border-white/5`}>
             <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${platform.gradient} rounded-2xl`} />
            <platform.icon className="w-10 h-10 text-white relative z-10 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-transform duration-500 group-hover:scale-110" />
          </div>
        </div>
        
        <h3 className="text-2xl font-black text-foreground mb-4 tracking-tighter italic font-heading" style={{ transform: "translateZ(40px)" }}>
          {platform.name}
        </h3>
        
        <p className="text-sm text-muted-foreground/80 leading-relaxed mb-8 flex-1 font-medium italic" style={{ transform: "translateZ(30px)" }}>
          {platform.description}
        </p>
        
        <div className="flex items-center gap-3 text-[10px] font-black text-primary tracking-[0.3em] uppercase opacity-40 group-hover:opacity-100 transition-all duration-500" style={{ transform: "translateZ(20px)" }}>
          LINK_ACCESS <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
        </div>
        
        {/* Decorative corner markers */}
        <div className="absolute top-4 right-4 w-10 h-10 border-r border-t border-primary/10 rounded-tr-2xl group-hover:border-primary/40 transition-colors" />
        <div className="absolute bottom-4 left-4 w-10 h-10 border-l border-b border-primary/10 rounded-bl-2xl group-hover:border-primary/40 transition-colors" />
      </div>
    </motion.a>
  )
}

export function PlatformsSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  return (
    <section ref={containerRef} id="about" className="relative py-40 px-4">
      {/* Decorative center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none opacity-40" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full glass-strong mb-10 border-primary/30 diamond-border">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.4em] text-muted-foreground uppercase opacity-80">Network Ecosystem</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">
            <span className="bg-gradient-to-br from-primary via-accent to-indigo-400 bg-clip-text text-transparent italic glow-text pb-2">
              Omni-Chain Logic.
            </span>
          </h2>
          <p className="text-muted-foreground/80 max-w-2xl mx-auto text-xl leading-relaxed italic font-medium">
            Seamless forensic integration across the world&apos;s leading credential authorities.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 [perspective:2500px]">
          {platforms.map((platform, index) => (
            <PlatformCard key={platform.name} platform={platform} index={index} />
          ))}
        </div>

        {/* Forensic Metadata Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2, duration: 1 }}
          className="mt-32 pt-16 border-t border-white/5 flex flex-wrap justify-between items-center gap-12"
        >
          <div className="flex items-center gap-6 group">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center diamond-border border-primary/20 group-hover:scale-110 transition-transform">
              <Laptop className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground italic font-heading tracking-tight">API_BRIDGE_v4.5</div>
              <div className="text-[10px] font-black tracking-[0.4em] text-primary uppercase opacity-60">Live Forensics</div>
            </div>
          </div>

          <div className="flex items-center gap-6 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center diamond-border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground italic font-heading tracking-tight">ISO_SECURED</div>
              <div className="text-[10px] font-black tracking-[0.4em] text-emerald-500 uppercase opacity-60">Institutional Grade</div>
            </div>
          </div>

          <div className="flex items-center gap-6 group">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center diamond-border border-accent/20 group-hover:scale-110 transition-transform">
              <Building className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground italic font-heading tracking-tight">MULTI_CHAIN</div>
              <div className="text-[10px] font-black tracking-[0.4em] text-accent uppercase opacity-60">Global Cluster</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}


