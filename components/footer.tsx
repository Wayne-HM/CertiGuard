"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Github, Linkedin, Mail, Rocket, X, Zap, Globe, Code } from "lucide-react"
import Link from "next/link"
import { smoothSpring } from "@/components/ui/glass-container"

const footerLinks = {
  Product: ["Verify Single/Multiple", "Batch Processing", "API", "Integrations"],
  Legal: ["Privacy", "Terms", "Security", "Cookies"],
}

const socialLinks = [
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
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={smoothSpring}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-glass-border liquid-glass shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-surface-2 transition-colors group"
        >
          <X className="w-4 h-4 text-text-secondary group-hover:text-text-primary transition-colors" />
        </button>

        <div className="relative p-8 pt-10 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-20 h-20 rounded-2xl bg-surface-1 border border-glass-border flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05)]"
            >
              <Rocket className="w-10 h-10 text-text-primary" />
            </motion.div>
          </div>

          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-semibold text-text-primary mb-2 tracking-tight"
          >
            {linkName}
          </motion.h3>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="w-full p-5 rounded-2xl border border-glass-border bg-surface-1 mt-4 mb-6"
          >
            <h4 className="text-sm font-semibold text-text-primary mb-2 uppercase tracking-widest">
              Under Construction
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed font-light">
              This module is currently being developed by our engineering team. Check back soon.
            </p>
          </motion.div>

          <div className="w-full h-1 rounded-full bg-surface-2 overflow-hidden mb-3">
            <motion.div
              className="h-full rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
              initial={{ width: "0%" }}
              animate={{ width: "65%" }}
              transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-text-secondary terminal-text tracking-widest uppercase">
            &gt; Build_Progress: 65%
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function Footer() {
  const [activeLink, setActiveLink] = useState<string | null>(null)

  return (
    <footer className="relative py-16 px-4 border-t border-glass-border overflow-hidden z-10 bg-black">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16 items-center">
          
          {/* Brand - Left */}
          <div className="col-span-1 lg:col-span-4">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <Shield className="w-8 h-8 text-text-primary group-hover:scale-105 transition-transform" />
              <span className="text-2xl font-semibold tracking-tight text-text-primary">
                CertiGuard
              </span>
            </Link>
            <p className="text-sm text-text-secondary mb-8 max-w-sm leading-relaxed font-light">
              AI-powered forensic certificate analysis. Protecting organizations from fraudulent credentials with cryptographic precision.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  onClick={(e) => { 
                    if (social.href === "#" || social.href.startsWith("/")) {
                      e.preventDefault(); 
                      setActiveLink(social.label) 
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 liquid-glass rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-2 border border-glass-border transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Designed & Developed Card - Center */}
          <div className="col-span-1 lg:col-span-4 flex justify-center lg:justify-center">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="relative group w-full max-w-[320px]"
            >
              <div className="relative liquid-glass border border-glass-border rounded-3xl p-8 text-center overflow-hidden hover:bg-surface-2 transition-colors duration-500">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                  <Code className="w-32 h-32 -rotate-12 transform translate-x-8 -translate-y-8" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-surface-1 border border-glass-border flex items-center justify-center">
                      <Code className="w-5 h-5 text-text-primary" />
                    </div>
                  </div>
                  
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary mb-2">
                    Engineered By
                  </p>
                  
                  <h3 className="text-xl font-semibold text-text-primary mb-3 tracking-tight">
                    Syed Murtaza
                  </h3>
                  
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-glass-border bg-surface-1">
                    <Shield className="w-3 h-3 text-text-primary" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-primary">
                      ARCHITECT
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Links - Right */}
          <div className="col-span-1 lg:col-span-4 flex justify-start lg:justify-end">
            <div className="grid grid-cols-2 gap-12 sm:gap-16 w-full max-w-sm">
              {Object.entries(footerLinks).map(([category, links]) => (
                <div key={category}>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-text-primary mb-6">
                    {category}
                  </h4>
                  <ul className="space-y-4">
                    {links.map((link) => (
                      <li key={link}>
                        <button
                          onClick={() => setActiveLink(link)}
                          className="text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer text-left font-light"
                        >
                          {link}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-glass-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-secondary font-light">
            © 2026 CertiGuard. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-glass-border bg-surface-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-text-primary uppercase">All Systems Nominal</span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeLink && (
          <ComingSoonModal linkName={activeLink} onClose={() => setActiveLink(null)} />
        )}
      </AnimatePresence>
    </footer>
  )
}
