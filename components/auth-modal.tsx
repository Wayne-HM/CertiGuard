"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mail, Lock, User, Key, Shield, ArrowRight, Loader2, Sparkles, LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-context"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: "login" | "signup"
}

export function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode)
  const [formData, setFormData] = useState({ name: "", email: "", password: "" })
  const { login, register, isLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (mode === "login") {
        await login(formData.email, formData.password)
      } else {
        await register(formData.name, formData.email, formData.password)
      }
      onClose()
    } catch (err) {
      // Error handled in context
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Obsidian Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />

          {/* Forensic Auth Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-lg glass-strong rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 diamond-border"
          >
            <div className="absolute inset-0 noise-surface opacity-[0.05] pointer-events-none" />
            
            {/* Header Area */}
            <div className="relative p-12 pb-8 text-center">
              <div className="absolute top-8 right-8 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-2xl hover:bg-white/5 border border-white/5 transition-all diamond-border group"
                >
                  <X className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Button>
              </div>

              <motion.div
                initial={{ rotate: -15, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                className="w-20 h-20 bg-[#0a0a0c] rounded-2xl flex items-center justify-center mx-auto mb-8 diamond-border border border-primary/20 p-1 relative group"
              >
                 <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="w-full h-full bg-primary/5 rounded-xl flex items-center justify-center diamond-border">
                    <Shield className="w-10 h-10 text-primary filter drop-shadow-[0_0_8px_rgba(124,255,160,0.5)]" />
                 </div>
              </motion.div>

              <h2 className="text-4xl font-black text-foreground mb-3 tracking-tighter italic font-heading">
                {mode === "login" ? "IDENTITY_SYNC" : "CREATE_NODE"}
              </h2>
              <p className="text-sm text-muted-foreground/60 font-medium italic tracking-tight">
                {mode === "login" 
                  ? "Enter protocol credentials to access terminal" 
                  : "Join the global network of verified professionals"}
              </p>
            </div>

            {/* Futuristic Tab Switcher */}
            <div className="flex p-1.5 mx-12 bg-black/40 rounded-2xl mb-10 border border-white/5 diamond-border relative">
              <div className="absolute inset-0 noise-surface opacity-[0.03] pointer-events-none" />
              <button
                onClick={() => setMode("login")}
                className={`relative flex-1 flex items-center justify-center gap-3 py-3 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl transition-all duration-500 z-10 ${
                  mode === "login" ? "text-primary italic" : "text-muted-foreground/40 hover:text-muted-foreground"
                }`}
              >
                {mode === "login" && (
                  <motion.div layoutId="auth-tab" className="absolute inset-0 bg-primary/10 rounded-xl diamond-border border border-primary/30" />
                )}
                <LogIn className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Sign_In</span>
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`relative flex-1 flex items-center justify-center gap-3 py-3 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl transition-all duration-500 z-10 ${
                  mode === "signup" ? "text-primary italic" : "text-muted-foreground/40 hover:text-muted-foreground"
                }`}
              >
                {mode === "signup" && (
                  <motion.div layoutId="auth-tab" className="absolute inset-0 bg-primary/10 rounded-xl diamond-border border border-primary/30" />
                )}
                <UserPlus className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Register</span>
              </button>
            </div>

            {/* Forensic Form */}
            <form onSubmit={handleSubmit} className="px-12 pb-14 space-y-6 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6"
                >
                  {mode === "signup" && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em] ml-2">Display_Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                        <Input
                          placeholder="Node Identifier"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="pl-12 h-14 bg-white/5 border-white/5 focus:border-primary/40 rounded-2xl italic font-medium transition-all group-hover:bg-white/[0.08]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em] ml-2">Access_Mail</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                      <Input
                        type="email"
                        placeholder="network@node.sys"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-12 h-14 bg-white/5 border-white/5 focus:border-primary/40 rounded-2xl italic font-medium transition-all group-hover:bg-white/[0.08]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em] ml-2">Access_Key</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                      <Input
                        type="password"
                        placeholder="••••••••••••"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-12 h-14 bg-white/5 border-white/5 focus:border-primary/40 rounded-2xl italic font-medium transition-all group-hover:bg-white/[0.08]"
                      />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                   className="w-full h-16 bg-white/5 hover:bg-primary/10 border border-white/5 hover:border-primary/50 transition-all duration-500 rounded-2xl group relative overflow-hidden diamond-border"
                >
                  <div className="absolute inset-0 noise-surface opacity-[0.05] group-hover:opacity-[0.1] transition-opacity" />
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  ) : (
                    <span className="flex items-center justify-center gap-4 text-lg font-black italic font-heading group-hover:text-primary transition-colors tracking-tight">
                      {mode === "login" ? "INITIALIZE_LINK" : "ESTABLISH_NODE"}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-3 transition-transform" />
                    </span>
                  )}
                </Button>
              </div>

              {mode === "login" && (
                <p className="text-center text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] pt-4">
                  RECOVERY_PHRASE?{" "}
                  <button type="button" className="text-primary/40 hover:text-primary transition-colors ml-2 underline underline-offset-4">
                    ACCESS_RESTORE
                  </button>
                </p>
              )}
            </form>

            {/* Prismatic Footer Glow */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent blur-[1px] opacity-40" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/5 blur-[80px] pointer-events-none rounded-full" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

