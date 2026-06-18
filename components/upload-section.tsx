"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, CheckCircle, Loader2, ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

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
        setElapsedTime(prev => prev + 10) // tick every 10ms
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
        setFile(droppedFiles[0]) // use first file for preview
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
        setFile(selectedFiles[0]) // preview first file
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

  // Check if we are handling batch vs single in UI
  const isBatch = batchFiles.length > 1;

  return (
    <section id="verify" className="relative py-24 px-4 overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-stretch">
          
          {/* LEFT PANEL: ENGINE CONSOLE */}
          <div className="bg-[#0f121b] border border-[#1e2433] rounded-[1.5rem] p-8 shadow-2xl relative overflow-visible">
            {/* Header with Timer */}
            <div className="flex justify-between items-center mb-10 pb-5 border-b border-[#1e2433]">
              <h2 className="text-xl font-bold text-white tracking-tight">Certificate Verification Engine</h2>
              <div className="text-white font-mono text-lg font-bold tracking-wider">
                {formatTime(elapsedTime)}
              </div>
            </div>

            {/* Platform Dropdown */}
            <div className="mb-8 relative">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Verification Platform
              </label>
              <div className="relative">
                <button
                  onClick={() => !isVerifying && setDropdownOpen(!dropdownOpen)}
                  disabled={isVerifying}
                  className="w-full bg-[#151923] border border-[#1e2433] hover:border-cyan-500/50 text-white rounded-xl px-5 py-4 flex items-center justify-between transition-colors disabled:opacity-50"
                >
                  <span className="font-medium text-sm">{selectedPlatformName}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>
                
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#151923] border border-[#1e2433] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
                    >
                      {selectPlatforms.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPlatform(p.id); setDropdownOpen(false) }}
                          className="w-full text-left px-5 py-3 hover:bg-[#1a2133] text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center justify-between"
                        >
                          {p.name}
                          {selectedPlatform === p.id && <Check className="w-4 h-4 text-cyan-400" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Document Upload Zone */}
            <div className="mb-10">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Document Upload (Single Or Batch)
              </label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isVerifying && document.getElementById('file-upload')?.click()}
                className={`
                  relative rounded-2xl p-10 min-h-[220px] flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 overflow-hidden
                  ${isVerifying ? "border-2 border-dashed border-cyan-500/50 bg-[#111727]" : isDragging ? "border-2 border-dashed border-cyan-400 bg-[#111727]" : "border-2 border-dashed border-[#2a3143] bg-[#151923] hover:border-cyan-500/50 hover:bg-[#1a1f2b]"}
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
                    {/* Horizontal Glowing Scanline */}
                    <motion.div 
                      className="absolute w-[120%] h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,1)] z-20"
                      initial={{ top: "-10%" }}
                      animate={{ top: ["-10%", "110%", "-10%"] }}
                      transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                    />
                    <FileText className="w-10 h-10 text-cyan-400 mb-2" />
                    <h3 className="text-cyan-400 font-medium text-lg">Extracting Details...</h3>
                    <p className="text-slate-400 text-sm">Please do not close this window</p>
                  </div>
                ) : file ? (
                  <div className="flex flex-col items-center justify-center space-y-3 z-10">
                    <FileText className="w-12 h-12 text-white/80" />
                    <h3 className="text-white font-medium text-sm truncate max-w-[280px]">
                      {isBatch ? `${batchFiles.length} Certificates Ready` : file.name}
                    </h3>
                    <p className="text-slate-500 text-xs">
                      {isBatch 
                        ? `Total: ${(batchFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB` 
                        : `${(file.size / 1024 / 1024).toFixed(2)} MB`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3 z-10">
                    <Upload className="w-12 h-12 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    <h3 className="text-slate-300 font-medium text-sm">Drag & Drop Certificate Here</h3>
                    <p className="text-slate-500 text-xs">Supports PDF</p>
                  </div>
                )}
              </div>
            </div>

            {/* Verify Button */}
            <Button
              onClick={handleStartVerification}
              disabled={isVerifying || !file}
              className="w-full bg-gradient-to-r from-[#2b4c9e] to-[#4231a3] hover:from-[#355bd6] hover:to-[#5642d6] text-white font-bold h-14 rounded-xl shadow-[0_0_20px_rgba(43,76,158,0.2)] transition-all flex items-center justify-center gap-2 text-base"
            >
              {isVerifying ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
              ) : (
                <><CheckCircle className="w-5 h-5" /> Analyze & Verify</>
              )}
            </Button>
          </div>

          {/* RIGHT PANEL: LIVE ANALYSIS SKELETON */}
          <div className="bg-[#0f121b] border border-[#1e2433] rounded-[1.5rem] shadow-2xl overflow-hidden h-full flex flex-col">
            {/* Top Doc Area */}
            <div className="p-6 border-b border-[#1e2433] flex items-center gap-4 bg-[#121621]">
              <div className="w-10 h-10 rounded-lg bg-[#1e2433] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-300 truncate">
                  {isBatch ? `Processing ${batchFiles.length} files...` : (file ? file.name : "Waiting for upload...")}
                </p>
              </div>
            </div>

            {/* Skeleton Grid Area */}
            <div className="p-8 space-y-10 flex-1 bg-[#0f121b]">
              {/* Row 1 */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest w-40">Platform</span>
                {isVerifying ? (
                  <div className="h-6 w-32 bg-[#1b233a] rounded-md animate-pulse ml-auto" />
                ) : (
                  <div className="h-6 w-32 bg-[#151923] rounded-md ml-auto" />
                )}
              </div>

              {/* Row 2 */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest w-40">Candidate Name</span>
                {isVerifying ? (
                  <div className="h-6 w-56 bg-[#1b233a] rounded-md animate-pulse ml-auto" />
                ) : (
                  <div className="h-6 w-56 bg-[#151923] rounded-md ml-auto" />
                )}
              </div>

              {/* Row 3 */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest w-40">Course Title</span>
                {isVerifying ? (
                  <div className="h-6 w-64 bg-[#1b233a] rounded-md animate-pulse ml-auto" />
                ) : (
                  <div className="h-6 w-64 bg-[#151923] rounded-md ml-auto" />
                )}
              </div>

              {/* Row 4 */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest w-40">Completed Date</span>
                {isVerifying ? (
                  <div className="h-6 w-28 bg-[#1b233a] rounded-md animate-pulse ml-auto" />
                ) : (
                  <div className="h-6 w-28 bg-[#151923] rounded-md ml-auto" />
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  )
}
