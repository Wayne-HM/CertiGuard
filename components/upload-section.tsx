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
  { id: "auto", name: "Auto-Detect", icon: Sparkles, color: "text-neon-blue" },
  { id: "coursera", name: "Coursera", icon: GraduationCap, color: "text-blue-500" },
  { id: "udemy", name: "Udemy", icon: BookOpen, color: "text-purple-500" },
  { id: "alison", name: "Alison", icon: Award, color: "text-emerald-500" },
  { id: "saylor", name: "Saylor", icon: Building, color: "text-orange-500" },
  { id: "infosys", name: "Infosys", icon: Laptop, color: "text-blue-400" },
]

// Optimized spring configs
const quickSpring = { stiffness: 300, damping: 30, mass: 0.8 }
const smoothTransition = { duration: 0.25, ease: [0.4, 0, 0.2, 1] }

export function UploadSection({ onUpload, isVerifying }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState("auto")
  const [isHovering, setIsHovering] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-50px" })

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
    <section ref={containerRef} id="verify" className="relative py-24 px-4 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-neon-purple/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-neon-blue/20 mb-6">
            <Zap className="w-3 h-3 text-neon-blue" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-1">Process</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">AI Certificate Analysis</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-neon-blue via-neon-cyan to-neon-purple bg-clip-text text-transparent italic">
              Ready to Verify?
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Upload any digital credential and let our neural networks scan for authenticity in milliseconds.
          </p>
        </motion.div>

        {/* Platform Selector */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {selectPlatforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              disabled={isVerifying}
              className={`
                relative flex items-center gap-2 px-4 py-3 rounded-2xl transition-all duration-300
                ${selectedPlatform === p.id 
                  ? "bg-white/10 border-neon-blue/50 text-foreground shadow-lg shadow-neon-blue/10 scale-105" 
                  : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
                }
                border glass-card disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <p.icon className={`w-4 h-4 ${selectedPlatform === p.id ? p.color : "text-muted-foreground"}`} />
              <span className="text-xs font-bold tracking-tight">{p.name}</span>
              {selectedPlatform === p.id && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute inset-0 border-2 border-neon-blue/30 rounded-2xl pointer-events-none"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Upload Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={`
            relative glass-strong rounded-[2.5rem] p-12 overflow-hidden
            transition-all duration-500
            ${isDragging ? "border-neon-blue ring-4 ring-neon-blue/10" : "border-glass-border"}
            ${file && !isVerifying ? "border-success/30 shadow-2xl shadow-success/5" : ""}
          `}
        >
          {/* Laser Scan Animation - Only during verification */}
          <AnimatePresence>
            {isVerifying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 pointer-events-none"
              >
                <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-neon-blue to-transparent filter blur-[2px] animate-scan" />
                <div className="absolute inset-x-0 h-4 bg-gradient-to-b from-neon-blue/10 to-transparent filter blur-md animate-scan" />
                
                {/* Glow during scan */}
                <div className="absolute inset-0 bg-neon-blue/[0.03] animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="upload-prompt"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                  className="relative inline-flex mb-8"
                >
                  <div className={`absolute inset-0 bg-neon-blue/20 blur-3xl rounded-full transition-opacity duration-300 ${isHovering ? "opacity-100" : "opacity-0"}`} />
                  <div className="relative glass border-neon-blue/20 rounded-3xl p-8 group">
                    <Upload className={`w-14 h-14 transition-colors duration-300 ${isDragging ? "text-neon-blue" : "text-muted-foreground group-hover:text-neon-blue"}`} />
                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-neon-cyan animate-pulse" />
                  </div>
                </motion.div>

                <h3 className="text-2xl font-bold mb-3 tracking-tight">
                  {isDragging ? "Release to Scan" : "Drop Certificate Here"}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                  Drag and drop your PDF or images. Multiple file processing is enabled for Pro users.
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
                    className="h-12 px-8 rounded-xl border-glass-border hover:border-neon-blue/50 group hover-scale shadow-lg"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Browse Files
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="file-preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12"
              >
                <div className="flex flex-col items-center gap-8">
                  <div className="relative">
                    {/* File Icon with Glowing Backdrop */}
                    <div className="absolute inset-0 bg-neon-blue/20 blur-2xl rounded-3xl" />
                    <motion.div 
                      layoutId="file-icon"
                      className="relative glass rounded-3xl p-10 border-success/30"
                    >
                      <FileText className="w-20 h-20 text-success" />
                      <AnimatePresence>
                        {isVerifying && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-4 -right-4 w-10 h-10 bg-neon-blue rounded-full flex items-center justify-center border-4 border-background"
                          >
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold truncate max-w-xs">{file.name}</h3>
                    <p className="text-sm text-muted-foreground">Ready for AI analysis • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>

                  <div className="flex items-center gap-4">
                    {!isVerifying && (
                      <Button variant="ghost" onClick={removeFile} className="text-muted-foreground hover:text-destructive h-12 px-6">
                        Remove
                      </Button>
                    )}
                    <Button
                      size="lg"
                      onClick={handleStartVerification}
                      disabled={isVerifying}
                      className="relative overflow-hidden bg-gradient-to-r from-neon-blue to-neon-purple text-white px-10 h-14 text-lg rounded-2xl shadow-xl shadow-neon-blue/20 group"
                    >
                      <span className="relative z-10 flex items-center gap-2 font-bold tracking-tight">
                        {isVerifying ? "Analyzing Logic..." : "Perform AI Scan"}
                        {!isVerifying && <Zap className="w-5 h-5 fill-current" />}
                      </span>
                      {isVerifying && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Security Trust Indicators */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
          <div className="flex items-center gap-2 font-bold text-sm tracking-widest"><Shield className="w-4 h-4" /> 256-BIT AES</div>
          <div className="flex items-center gap-2 font-bold text-sm tracking-widest"><Globe className="w-4 h-4" /> GLOBAL STANDARDS</div>
          <div className="flex items-center gap-2 font-bold text-sm tracking-widest"><Award className="w-4 h-4" /> ISO-9001 COMPLIANT</div>
        </div>
      </div>
    </section>
  )
}
