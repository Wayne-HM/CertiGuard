"use client"

import { useState, useCallback, useRef, memo } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { Upload, FileText, X, CheckCircle, Loader2, Sparkles, Shield, Zap, Search, Globe, Award, GraduationCap, BookOpen, Building, Laptop } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UploadSectionProps {
  onUpload: (file: File, platform: string) => void
  isVerifying: boolean
}

const selectPlatforms = [
  { id: "auto", name: "AUTO_DETECT", icon: Sparkles, color: "text-primary" },
  { id: "coursera", name: "COURSERA", icon: GraduationCap, color: "text-muted-foreground" },
  { id: "udemy", name: "UDEMY", icon: BookOpen, color: "text-muted-foreground" },
  { id: "alison", name: "ALISON", icon: Award, color: "text-primary" },
  { id: "saylor", name: "SAYLOR", icon: Building, color: "text-muted-foreground" },
  { id: "infosys", name: "INFOSYS", icon: Laptop, color: "text-muted-foreground" },
]

// Optimized spring configs
const quickSpring = { stiffness: 400, damping: 30, mass: 0.8 }
const smoothTransition = { duration: 0.3, ease: [0.16, 1, 0.3, 1] }

export function UploadSection({ onUpload, isVerifying }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState("auto")
  const [isHovering, setIsHovering] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.type === "application/pdf" || droppedFile.type.startsWith("image/"))) {
      setFile(droppedFile)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }, [])

  const removeFile = useCallback(() => {
    setFile(null)
  }, [])

  const handleStartVerification = useCallback(() => {
    if (file) {
      onUpload(file, selectedPlatform)
    }
  }, [file, selectedPlatform, onUpload])

  return (
    <section ref={containerRef} id="verify" className="relative py-40 px-4 overflow-hidden">
      {/* Immersive Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[160px] pointer-events-none opacity-40" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[160px] pointer-events-none opacity-40" />

      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-2xl glass-strong border border-white/5 mb-10 shadow-2xl diamond-border group">
             <div className="absolute inset-0 noise-surface opacity-[0.03] pointer-events-none" />
            <Shield className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 italic">NEURAL_VERIFY</span>
            <div className="h-4 w-px bg-white/10 mx-2" />
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary italic">SECURED_NODE</span>
          </div>
          
          <h2 className="text-6xl md:text-8xl font-black mb-10 tracking-[0.02em] font-heading">
            <span className="bg-gradient-to-br from-white via-white/90 to-white/40 bg-clip-text text-transparent italic tracking-tighter">
              ANALYSIS_PORTAL
            </span>
          </h2>
          <p className="text-muted-foreground/40 max-w-2xl mx-auto text-xl leading-relaxed italic font-medium tracking-tight">
            Deploy advanced forensic scans across distributed ledgers. 
            Automated deep-learning verification for global credentials.
          </p>
        </motion.div>

        {/* Tactical Platform Selector */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-5 mb-20"
        >
          {selectPlatforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              disabled={isVerifying}
              className={`
                relative flex items-center gap-4 px-8 py-5 rounded-[1.25rem] transition-all duration-500
                ${selectedPlatform === p.id 
                  ? "text-primary italic shadow-[0_0_50px_rgba(124,255,160,0.15)] scale-105" 
                  : "text-muted-foreground/40 hover:text-muted-foreground/80"
                }
                bg-black/40 border border-white/5 hover:border-white/10 glass-strong diamond-border disabled:opacity-30 group
              `}
            >
              <div className="absolute inset-0 noise-surface opacity-[0.02] pointer-events-none" />
              <p.icon className={`w-5 h-5 transition-all duration-500 ${selectedPlatform === p.id ? "text-primary filter drop-shadow-[0_0_8px_rgba(124,255,160,0.5)]" : "group-hover:scale-110"}`} />
              <span className="text-xs font-black tracking-[0.2em]">{p.name}</span>
              
              {selectedPlatform === p.id && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute inset-0 border border-primary/40 rounded-[1.25rem] pointer-events-none diamond-border"
                >
                  <div className="absolute inset-0 bg-primary/5 rounded-[1.25rem]" />
                  <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary/60 blur-[1px]" />
                </motion.div>
              )}
            </button>
          ))}
        </motion.div>

        {/* Upload Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={`
            relative glass-strong rounded-[3rem] p-16 overflow-hidden diamond-border
            transition-all duration-700
            ${isDragging ? "border-primary shadow-[0_0_50px_rgba(124,255,160,0.2)]" : "border-glass-border"}
            ${file && !isVerifying ? "border-primary/40 shadow-2xl shadow-primary/10" : ""}
          `}
        >
          {/* Laser Scan Animation - Forensics mode */}
          <AnimatePresence>
            {isVerifying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 pointer-events-none"
              >
                <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent filter shadow-[0_0_15px_var(--primary)] animate-scan" />
                <div className="absolute inset-x-0 h-12 bg-gradient-to-b from-primary/20 to-transparent filter blur-xl animate-scan" />
                
                {/* Glow during scan */}
                <div className="absolute inset-0 bg-primary/[0.05] animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute inset-0 noise-surface opacity-[0.05]" />

          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="upload-prompt"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-16"
              >
                <motion.div
                  animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
                  className="relative inline-flex mb-10"
                >
                  <div className={`absolute inset-0 bg-primary/30 blur-[60px] rounded-full transition-opacity duration-700 ${isHovering ? "opacity-100" : "opacity-0"}`} />
                  <div className="relative glass border-primary/20 rounded-[2.5rem] p-12 group shadow-2xl">
                    <Upload className={`w-16 h-16 transition-all duration-700 ${isDragging ? "text-primary rotate-12" : "text-muted-foreground group-hover:text-primary group-hover:scale-110"}`} />
                    <Sparkles className="absolute -top-3 -right-3 w-8 h-8 text-primary animate-pulse" />
                  </div>
                </motion.div>

                <h3 className="text-3xl font-black mb-4 tracking-tighter">
                  {isDragging ? "Verify Origin" : "Secure Document Drop"}
                </h3>
                <p className="text-muted-foreground/80 mb-12 max-w-sm mx-auto text-lg leading-relaxed font-medium">
                  PDF or high-res images accepted. 
                  Encrypted end-to-end for maximal security.
                </p>

                <div className="inline-block relative">
                  <input 
                    type="file" 
                    id="file-upload"
                    accept=".pdf,image/*" 
                    onChange={handleFileSelect} 
                    className="hidden" 
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="h-16 px-10 rounded-2xl border-glass-border hover:border-primary/50 group hover-scale shadow-2xl text-lg font-bold tracking-tight"
                  >
                    <Search className="w-5 h-5 mr-3 text-primary group-hover:rotate-90 transition-transform duration-500" />
                    Select Forensic Target
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="file-preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-16"
              >
                <div className="flex flex-col items-center gap-10">
                  <div className="relative group">
                    {/* File Icon with Glowing Backdrop */}
                    <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-[3rem] group-hover:bg-primary/30 transition-colors" />
                    <motion.div 
                      layoutId="file-icon"
                      className="relative glass rounded-[3rem] p-12 border-primary/40 shadow-2xl diamond-border"
                    >
                      <FileText className="w-24 h-24 text-primary" />
                      <AnimatePresence>
                        {isVerifying && (
                          <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 45 }}
                            className="absolute -top-6 -right-6 w-14 h-14 bg-primary rounded-2xl flex items-center justify-center border-4 border-background shadow-2xl"
                          >
                            <Loader2 className="w-7 h-7 text-primary-foreground animate-spin" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>

                  <div className="text-center space-y-3">
                    <h3 className="text-2xl font-black truncate max-w-md tracking-tight">{file.name}</h3>
                    <div className="flex items-center justify-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">READY FOR SCAN</span>
                      <span className="text-sm text-muted-foreground/80 font-bold">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {!isVerifying && (
                      <Button variant="ghost" onClick={removeFile} className="text-muted-foreground hover:text-destructive h-14 px-8 font-bold text-lg">
                        Discard
                      </Button>
                    )}
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={quickSpring}>
                      <Button
                        size="lg"
                        onClick={handleStartVerification}
                        disabled={isVerifying}
                        className="relative overflow-hidden bg-primary text-primary-foreground px-12 h-16 text-xl rounded-2xl shadow-2xl shadow-primary/30 group font-black tracking-tight"
                      >
                        <span className="relative z-10 flex items-center gap-3">
                          {isVerifying ? "Processing..." : "EXECUTE ANALYTICS"}
                          {!isVerifying && <Zap className="w-6 h-6 group-hover:scale-125 transition-transform" />}
                        </span>
                        {isVerifying && (
                          <motion.div 
                            className="absolute inset-0 bg-white/20"
                            animate={{ opacity: [0.1, 0.3, 0.1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Security Trust Indicators */}
        <div className="mt-16 flex flex-wrap justify-center items-center gap-16 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
          <div className="flex items-center gap-3 font-black text-xs tracking-[0.3em]"><Shield className="w-5 h-5 text-primary" /> QUANTUM-READY</div>
          <div className="flex items-center gap-3 font-black text-xs tracking-[0.3em]"><Globe className="w-5 h-5 text-accent" /> WORLD-VERIFY</div>
          <div className="flex items-center gap-3 font-black text-xs tracking-[0.3em]"><Award className="w-5 h-5 text-emerald-400" /> ISO-9001-C</div>
        </div>
      </div>
    </section>
  )
}
