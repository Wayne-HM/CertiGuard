"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Github, Twitter, Linkedin, Mail, Rocket, X, Zap, Globe } from "lucide-react"
import Link from "next/link"

const footerLinks = {
  Product: ["Features", "Pricing", "API", "Integrations"],
  Company: ["About", "Blog", "Careers", "Press"],
  Resources: ["Documentation", "Help Center", "Community", "Status"],
  Legal: ["Privacy", "Terms", "Security", "Cookies"],
}

const socialLinks = [
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Mail, href: "#", label: "Email" },
]

function ComingSoonModal({ linkName, onClose }: { linkName: string, onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-[3rem] border border-white/10 bg-[#0a0a0c] shadow-[0_0_100px_rgba(0,0,0,0.8)] diamond-border"
      >
        <div className="absolute inset-0 noise-surface opacity-[0.05] pointer-events-none" />
        
        {/* Animated grid line */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        {/* Scan effect */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 z-20"
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 z-30 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group diamond-border"
        >
          <X className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>

        <div className="relative p-12 pt-16 flex flex-col items-center text-center">
          {/* Brand Icon Orbit */}
          <div className="relative mb-12">
            <motion.div
              className="absolute rounded-full border border-primary/10"
              style={{ width: 140, height: 140, left: -20, top: -20 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute top-0 left-1/2 w-3 h-3 -ml-1.5 rounded-full bg-primary/40 blur-[1px]" />
              <div className="absolute bottom-0 left-1/2 w-2 h-2 rounded-full bg-accent/40 blur-[1px]" style={{ marginLeft: -4 }} />
            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary via-emerald-500 to-accent flex items-center justify-center shadow-2xl diamond-border p-[2px]"
            >
              <div className="w-full h-full bg-[#0a0a0c] rounded-[1.8rem] flex items-center justify-center diamond-border">
                <Shield className="w-12 h-12 text-primary filter drop-shadow-[0_0_12px_rgba(124,255,160,0.5)]" />
              </div>
            </motion.div>
          </div>

          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-black text-white mb-2 tracking-tighter italic font-heading"
          >
            {linkName}
          </motion.h3>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full p-8 rounded-[2rem] border border-primary/20 bg-primary/[0.03] mt-8 mb-10 diamond-border relative overflow-hidden"
          >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 blur-[1px]" />
            <h4 className="text-xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4 italic font-heading uppercase tracking-widest">
              Rollout in Progress
            </h4>
            <p className="text-muted-foreground/80 leading-relaxed font-medium">
              The <span className="text-primary font-black italic">{linkName}</span> protocol is currently undergoing forensic testing as part of our visual excellence deployment.
            </p>
          </motion.div>

          {/* Status Metadata */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-8 mb-8"
          >
            <div className="flex items-center gap-3">
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
              <span className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase">Pending</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-warning" />
              <span className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase">Auth_v4</span>
            </div>
          </motion.div>

          {/* Progress Rail */}
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden mb-3 border border-white/5">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary"
              initial={{ width: "0%" }}
              animate={{ width: "94%" }}
              transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
              style={{ backgroundSize: '200% 100%' }}
            />
          </div>
          <p className="text-[10px] text-primary/40 font-black tracking-[0.3em] uppercase">Sync Level: 94%</p>
        </div>

        {/* Ambient base glow */}
        <div className="absolute bottom-[-50px] left-1/2 -translate-x-1/2 w-[120%] h-40 bg-primary/10 blur-[80px] pointer-events-none rounded-full" />
      </motion.div>
    </motion.div>
  )
}

export function Footer() {
  const [activeLink, setActiveLink] = useState<string | null>(null)

  return (
    <footer className="relative py-24 px-4 border-t border-white/5">
      <div className="absolute inset-0 noise-surface opacity-[0.02] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-12 mb-20">
          {/* Brand Identity */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center diamond-border border-primary/20">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <span className="text-3xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent italic tracking-tighter font-heading p-1">
                CertiGuard
              </span>
            </Link>
            <p className="text-muted-foreground/80 mb-10 max-w-xs leading-relaxed font-medium italic">
              Institutional-grade forensic verification. Securing the global standard of trust through algorithmic excellence.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  onClick={(e) => { e.preventDefault(); setActiveLink(social.label) }}
                  whileHover={{ scale: 1.1, y: -5 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 glass-strong rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary transition-all diamond-border border-white/5 hover:border-primary/40 group"
                  aria-label={social.label}
                >
                  <social.icon className="w-6 h-6 transition-transform group-hover:scale-110" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Nav Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.4em] mb-8 opacity-40">{category}</h4>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link}>
                    <button
                      onClick={() => setActiveLink(link)}
                      className="text-sm font-bold text-muted-foreground hover:text-primary transition-all cursor-pointer text-left hover:translate-x-1 flex items-center gap-2 group italic font-heading"
                    >
                      <div className="w-1 h-1 rounded-full bg-primary/0 group-hover:bg-primary transition-all" />
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal & Status */}
        <div className="pt-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <p className="text-xs font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
              © 2026 CERTIGUARD_CORE. ALL_RIGHTS_RESERVED.
            </p>
            <div className="hidden sm:block w-px h-4 bg-white/5" />
            <p className="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-widest">
              HASH: 8F3D1A...9C2E
            </p>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 px-6 py-2 rounded-full glass-strong border border-success/20 bg-success/5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success shadow-[0_0_8px_var(--success)]"></span>
              </span>
              <span className="text-[10px] font-black text-success uppercase tracking-[0.3em]">Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Futuristic Modal Overlay */}
      <AnimatePresence>
        {activeLink && (
          <ComingSoonModal linkName={activeLink} onClose={() => setActiveLink(null)} />
        )}
      </AnimatePresence>
    </footer>
  )
}
