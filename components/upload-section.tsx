"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, CheckCircle, Loader2, ChevronDown, Check } from "lucide-react"
import { GlassCard, GlassButton, smoothSpring } from "@/components/ui/glass-container"

interface UploadSectionProps {
  onUpload: (file: File, platform: string) => void
  onBatchUpload?: (files: File[], platform: string) => void
  isVerifying: boolean
}

const selectPlatforms = [
  { id: "auto", name: "Auto-Detect (AI)" },
  { id: "coursera", name: "Coursera" },
  { id: "udemy", name: "Udemy" },
  { id: "alison", name: "Alison" },
  { id: "saylor", name: "Saylor Academy" },
  { id: "infosys", name: "Infosys Springboard" },
  { id: "aws", name: "AWS Academy (Credly)" },
  { id: "mindluster", name: "Mindluster" },
]

export function UploadSection({ onUpload, onBatchUpload, isVerifying }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [batchFiles, setBatchFiles] = useState<File[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState("auto")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  
  // Stopwatch state
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isVerifying) {
      setElapsedTime(0)
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 10)
      }, 10)
    }
    return () => clearInterval(interval)
  }, [isVerifying])

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const milliseconds = Math.floor((ms % 1000) / 100)
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds}`
  }

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
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf")
    if (droppedFiles.length > 0) {
      if (droppedFiles.length === 1) {
        setFile(droppedFiles[0])
        setBatchFiles([])
      } else {
        setBatchFiles(droppedFiles)
        setFile(droppedFiles[0])
      }
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(f => f.type === "application/pdf")
    if (selectedFiles.length > 0) {
      if (selectedFiles.length === 1) {
        setFile(selectedFiles[0])
        setBatchFiles([])
      } else {
        setBatchFiles(selectedFiles)
        setFile(selectedFiles[0])
      }
    }
  }, [])

  const handleStartVerification = useCallback(() => {
    if (batchFiles.length > 1 && onBatchUpload) {
      onBatchUpload(batchFiles, selectedPlatform)
    } else if (file) {
      onUpload(file, selectedPlatform)
    }
  }, [file, batchFiles, selectedPlatform, onUpload, onBatchUpload])

  const selectedPlatformName = selectPlatforms.find(p => p.id === selectedPlatform)?.name || "Auto-Detect"
  const isBatch = batchFiles.length > 1;

  return (
    <section id="verify" className="relative py-24 px-4 overflow-hidden z-10">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-stretch"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        >
          {/* LEFT PANEL: ENGINE CONSOLE */}
          <GlassCard className="p-8 relative">
            {/* Header with Timer */}
            <div className="flex justify-between items-center mb-10 pb-5 border-b border-glass-border">
              <h2 className="text-xl font-semibold text-text-primary tracking-tight">Verification Engine</h2>
              <div className="text-text-primary font-mono text-lg font-medium tracking-wider liquid-glass px-4 py-1 rounded-full">
                {formatTime(elapsedTime)}
              </div>
            </div>

            {/* Platform Dropdown */}
            <div className="mb-8 relative">
              <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">
                Verification Platform
              </label>
              <div className="relative z-20">
                <button
                  onClick={() => !isVerifying && setDropdownOpen(!dropdownOpen)}
                  disabled={isVerifying}
                  className="w-full liquid-glass rounded-2xl px-5 py-4 flex items-center justify-between transition-colors disabled:opacity-50 hover:bg-surface-2"
                >
                  <span className="font-medium text-sm text-text-primary">{selectedPlatformName}</span>
                  <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={smoothSpring}>
                    <ChevronDown className="w-5 h-5 text-text-secondary" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="absolute top-[calc(100%+8px)] left-0 right-0 liquid-glass border border-glass-border rounded-2xl shadow-2xl overflow-hidden origin-top"
                    >
                      {selectPlatforms.map((p) => (
                         <button
                           key={p.id}
                           onClick={() => { setSelectedPlatform(p.id); setDropdownOpen(false) }}
                           className="w-full text-left px-5 py-3 hover:bg-surface-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center justify-between"
                         >
                           {p.name}
                           {selectedPlatform === p.id && <Check className="w-4 h-4 text-text-primary" />}
                         </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Document Upload Zone */}
            <div className="mb-10 relative z-10">
              <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">
                Document Upload (Single Or Batch)
              </label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isVerifying && document.getElementById('file-upload')?.click()}
                className={`
                  relative rounded-3xl p-10 min-h-[220px] flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 overflow-hidden
                  ${isVerifying ? "liquid-glass border-white/20" : isDragging ? "liquid-glass border-white/30" : "bg-surface-1 border border-glass-border hover:bg-surface-2"}
                `}
              >
                <input 
                  type="file" 
                  id="file-upload"
                  accept=".pdf" 
                  multiple
                  onChange={handleFileSelect} 
                  disabled={isVerifying}
                  className="hidden" 
                />

                {isVerifying ? (
                  <div className="flex flex-col items-center justify-center space-y-4 relative z-10 w-full">
                    {/* Horizontal Glowing Scanline for security aesthetic */}
                    <motion.div 
                      className="absolute w-full h-[2px] bg-white/40 shadow-[0_0_15px_rgba(255,255,255,0.8)] z-20"
                      initial={{ top: "0%" }}
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                    />
                    <FileText className="w-10 h-10 text-white mb-2 glowing-pulse" />
                    <h3 className="text-white font-medium text-lg">Extracting Data...</h3>
                    <p className="text-text-secondary text-sm">Forensic analysis in progress</p>
                  </div>
                ) : file ? (
                  <div className="flex flex-col items-center justify-center space-y-3 z-10">
                    <FileText className="w-12 h-12 text-white" />
                    <h3 className="text-white font-medium text-sm truncate max-w-[280px]">
                      {isBatch ? `${batchFiles.length} Certificates Ready` : file.name}
                    </h3>
                    <p className="text-text-secondary text-xs">
                      {isBatch 
                        ? `Total: ${(batchFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB` 
                        : `${(file.size / 1024 / 1024).toFixed(2)} MB`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3 z-10">
                    <Upload className="w-12 h-12 text-text-secondary transition-colors" />
                    <h3 className="text-text-primary font-medium text-sm">Drag & Drop Document Here</h3>
                    <p className="text-text-secondary text-xs">Supports PDF</p>
                  </div>
                )}
              </div>
            </div>

            {/* Verify Button */}
            <GlassButton
              variant="primary"
              size="lg"
              onClick={handleStartVerification}
              disabled={isVerifying || !file}
              className="w-full"
            >
              {isVerifying ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
              ) : (
                <><CheckCircle className="w-5 h-5" /> Analyze & Verify</>
              )}
            </GlassButton>
          </GlassCard>

          {/* RIGHT PANEL: LIVE ANALYSIS SKELETON */}
          <GlassCard className="p-0 overflow-hidden flex flex-col">
            {/* Top Doc Area */}
            <div className="p-6 border-b border-glass-border flex items-center gap-4 bg-surface-1">
              <div className="w-10 h-10 rounded-xl liquid-glass flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {isBatch ? `Processing ${batchFiles.length} files...` : (file ? file.name : "Waiting for upload...")}
                </p>
              </div>
            </div>

            {/* Skeleton Grid Area */}
            <div className="p-8 space-y-10 flex-1 relative overflow-hidden">
              {/* If verifying, show subtle scanline across skeletons */}
              {isVerifying && <div className="scanline animate-scanline absolute inset-0 z-0 opacity-20 pointer-events-none" />}
              
              <div className="relative z-10 space-y-10">
                {/* Row 1 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest w-40">Platform</span>
                  {isVerifying ? (
                    <div className="h-6 w-32 rounded-lg liquid-glass animate-shimmer relative overflow-hidden" />
                  ) : (
                    <div className="h-6 w-32 bg-surface-1 rounded-lg ml-auto" />
                  )}
                </div>

                {/* Row 2 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest w-40">Candidate Name</span>
                  {isVerifying ? (
                    <div className="h-6 w-56 rounded-lg liquid-glass animate-shimmer relative overflow-hidden" />
                  ) : (
                    <div className="h-6 w-56 bg-surface-1 rounded-lg ml-auto" />
                  )}
                </div>

                {/* Row 3 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest w-40">Course Title</span>
                  {isVerifying ? (
                    <div className="h-6 w-64 rounded-lg liquid-glass animate-shimmer relative overflow-hidden" />
                  ) : (
                    <div className="h-6 w-64 bg-surface-1 rounded-lg ml-auto" />
                  )}
                </div>

                {/* Row 4 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest w-40">Completed Date</span>
                  {isVerifying ? (
                    <div className="h-6 w-28 rounded-lg liquid-glass animate-shimmer relative overflow-hidden" />
                  ) : (
                    <div className="h-6 w-28 bg-surface-1 rounded-lg ml-auto" />
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
          
        </motion.div>
      </div>
    </section>
  )
}
