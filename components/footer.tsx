"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Github, Linkedin, Mail, Rocket, X, Zap, Globe, Code } from "lucide-react"
import Link from "next/link"

const footerLinks = {
  Product: ["Verify Single/Multiple", "Batch Processing", "Result Exporting"],
}

const contactLinks = [
  { icon: Github, href: "https://github.com/Wayne-HM/CertiGuard", label: "GitHub" },
  { icon: Linkedin, href: "https://www.linkedin.com/in/syedmurtaza-waynehm/", label: "LinkedIn" },
  { icon: Mail, href: "mailto:syedmurtaza.sd@gmail.com", label: "Email" },
]

function ComingSoonModal({ linkName, onClose }: { linkName: string, onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-950/95 shadow-2xl"
        style={{ boxShadow: "0 0 80px rgba(6, 182, 212, 0.15), 0 0 30px rgba(139, 92, 246, 0.1)" }}
      >
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />

        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
        >
          <X className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
        </button>

        <div className="relative p-8 pt-10 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <motion.div
              className="absolute rounded-full border border-cyan-500/20"
              style={{ width: 90, height: 90, left: -5, top: -5 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 rounded-full bg-cyan-400/60" />
              <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 rounded-full bg-purple-400/60" style={{ marginLeft: -3 }} />
            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg"
              style={{ boxShadow: "0 0 40px rgba(6, 182, 212, 0.3)" }}
            >
              <Rocket className="w-10 h-10 text-white" />
            </motion.div>
          </div>

          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-xl font-bold text-white mb-1"
          >
            {linkName}
          </motion.h3>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full p-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.03] mt-5 mb-6"
          >
            <h4 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
              We&apos;re Working On It
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              The <span className="text-cyan-300 font-semibold">{linkName}</span> page is currently under development. Our team is crafting something amazing for you.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-5 mb-5"
          >
            <div className="flex items-center gap-2">
              <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-[11px] text-slate-500 font-medium tracking-wide">IN PROGRESS</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] text-slate-500 font-medium tracking-wide">PRIORITY</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] text-slate-500 font-medium tracking-wide">GLOBAL</span>
            </div>
          </motion.div>

          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-2">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"
              initial={{ width: "0%" }}
              animate={{ width: "65%" }}
              transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-slate-600 font-mono tracking-wider">COMPLETION: 65%</p>
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-cyan-500/10 blur-3xl pointer-events-none" />
      </motion.div>
    </motion.div>
  )
}

export function Footer() {
  const [activeLink, setActiveLink] = useState<string | null>(null)

  return (
    <footer className="relative py-16 px-4 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12 items-center">
          
          {/* Brand - Left */}
          <div className="col-span-1 md:col-span-4">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Shield className="w-8 h-8 text-neon-blue" />
              <span className="text-xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                CertiGuard
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              The enterprise standard for educational credential authentication. Built to seamlessly detect fraud and parse complex metadata across global platforms.
            </p>
          </div>

          {/* Designed & Developed Card - Center */}
          <div className="col-span-1 md:col-span-4 flex justify-center">
            <div className="relative glass-card border border-white/5 bg-slate-900/50 rounded-2xl p-6 text-center shadow-2xl min-w-[300px]">
              <div className="flex justify-center mb-4">
                <Code className="w-6 h-6 text-neon-blue" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Designed & Developed By
              </p>
              <h3 className="text-xl font-bold text-foreground mb-1">
                Syed Murtaza
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                (OWNER)
              </p>
            </div>
          </div>

          {/* Links - Right */}
          <div className="col-span-1 md:col-span-4 grid grid-cols-2 gap-8 md:pl-12">
            <div>
              <h4 className="text-sm font-bold tracking-wider uppercase text-foreground mb-6">Product</h4>
              <ul className="space-y-4">
                {footerLinks.Product.map((link) => (
                  <li key={link}>
                    <button
                      onClick={() => setActiveLink(link)}
                      className="text-sm text-muted-foreground hover:text-neon-blue transition-colors cursor-pointer text-left"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-bold tracking-wider uppercase text-foreground mb-6">Contact</h4>
              <ul className="space-y-4">
                {contactLinks.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-neon-blue transition-colors group"
                    >
                      <social.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 CertiGuard Engine. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-sm text-muted-foreground">All systems operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Futuristic Modal */}
      <AnimatePresence>
        {activeLink && (
          <ComingSoonModal linkName={activeLink} onClose={() => setActiveLink(null)} />
        )}
      </AnimatePresence>
    </footer>
  )
}

