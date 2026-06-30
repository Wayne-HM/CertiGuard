"use client"

import { useRef } from "react"
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion"
import { BookOpen, GraduationCap, Award, Building, ArrowRight, Sparkles, Laptop, Cloud, Network, BookMarked } from "lucide-react"

const platforms = [
  {
    name: "Coursera",
    description: "World-class courses from top universities",
    icon: GraduationCap,
    url: "https://www.coursera.org",
  },
  {
    name: "Udemy",
    description: "Learn anything, anytime, anywhere",
    icon: BookOpen,
    url: "https://www.udemy.com",
  },
  {
    name: "Alison",
    description: "Free online courses with certificates",
    icon: Award,
    url: "https://alison.com",
  },
  {
    name: "Saylor Academy",
    description: "Free and open online courses",
    icon: Building,
    url: "https://www.saylor.org",
  },
  {
    name: "Infosys Springboard",
    description: "Digital learning for every learner",
    icon: Laptop,
    url: "https://infyspringboard.onwingspan.com",
  },
  {
    name: "AWS Academy",
    description: "Cloud computing via Credly badges",
    icon: Cloud,
    url: "https://aws.amazon.com/training/awsacademy/",
  },
  {
    name: "Mindluster",
    description: "Free courses with verified certs",
    icon: BookMarked,
    url: "https://www.mindluster.com",
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
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.19, 1, 0.22, 1] }}
      className="group relative h-full cursor-pointer"
    >
      <div className="relative liquid-glass rounded-3xl p-8 h-full flex flex-col items-center text-center overflow-hidden border border-glass-border hover:bg-surface-2 transition-colors duration-500">
        {/* Hover light sweep */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        
        <div className="relative mb-8" style={{ transform: "translateZ(30px)" }}>
          <div className="absolute inset-0 bg-white opacity-5 blur-xl rounded-full scale-150 group-hover:opacity-10 transition-opacity" />
          <div className="relative w-16 h-16 rounded-2xl bg-surface-1 border border-glass-border flex items-center justify-center shadow-lg group-hover:bg-white/5 transition-colors">
            <platform.icon className="w-8 h-8 text-text-primary group-hover:scale-110 transition-transform duration-300" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-text-primary mb-3 tracking-tight" style={{ transform: "translateZ(20px)" }}>{platform.name}</h3>
        <p className="text-sm text-text-secondary leading-relaxed mb-6 flex-1" style={{ transform: "translateZ(10px)" }}>{platform.description}</p>
        
        <div className="flex items-center gap-2 text-[10px] font-bold text-text-primary tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Visit Platform <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </div>
        
        {/* Subtle corner accents */}
        <div className="absolute top-4 right-4 w-4 h-4 border-r border-t border-white/20 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-l border-b border-white/20 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.a>
  )
}

export function PlatformsSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  return (
    <section ref={containerRef} id="about" className="relative py-32 px-4 z-10 overflow-hidden">
      {/* Background vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass mb-8 border border-glass-border">
            <Sparkles className="w-3.5 h-3.5 text-text-secondary" />
            <span className="text-[10px] font-bold tracking-widest text-text-secondary uppercase">Global Compatibility</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-semibold mb-6 tracking-tight text-text-primary">
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40">
              Trusted Everywhere.
            </span>
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto text-lg leading-relaxed font-light">
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
          transition={{ delay: 0.6, duration: 1 }}
          className="mt-24 pt-12 border-t border-glass-border flex flex-wrap justify-center items-center gap-16 sm:gap-24"
        >
          <div className="flex flex-col items-center gap-3 opacity-40 hover:opacity-100 transition-opacity duration-300">
            <div className="text-2xl font-bold text-text-primary tracking-tight">API v4.0</div>
            <div className="text-[10px] font-bold tracking-[0.3em] text-text-secondary uppercase">Live Feed</div>
          </div>
          <div className="flex flex-col items-center gap-3 opacity-40 hover:opacity-100 transition-opacity duration-300">
            <div className="text-2xl font-bold text-text-primary tracking-tight">ISO/IEC</div>
            <div className="text-[10px] font-bold tracking-[0.3em] text-text-secondary uppercase">Secured</div>
          </div>
          <div className="flex flex-col items-center gap-3 opacity-40 hover:opacity-100 transition-opacity duration-300">
            <div className="text-2xl font-bold text-text-primary tracking-tight">SHA-512</div>
            <div className="text-[10px] font-bold tracking-[0.3em] text-text-secondary uppercase">Encryption</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
