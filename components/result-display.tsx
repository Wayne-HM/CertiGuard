"use client"

import { useState, memo, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, User, BookOpen, Building2, ExternalLink, Download, RotateCcw, Sparkles, AlertTriangle, Terminal, Clock, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import QRCode from "qrcode"

export interface VerificationResult {
  isValid: boolean
  name: string
  course: string
  platform: string
  verificationUrl: string
  issueDate: string
  certificateId: string
  rawOutput: string
  totalHours?: string
  status?: "valid" | "fake" | "manual_check" | "action_required" | "error"
}

interface ResultDisplayProps {
  result: VerificationResult
  onVerifyAnother: () => void
}

// Optimized spring configs
const quickSpring = { stiffness: 300, damping: 30, mass: 0.8 }
const smoothTransition = { duration: 0.25, ease: [0.4, 0, 0.2, 1] }

const confettiColors = ["#3B82F6", "#06B6D4", "#8B5CF6", "#22C55E", "#F59E0B"]

// Memoized confetti with reduced particle count
const Confetti = memo(function Confetti() {
  const particles = useMemo(() => 
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      color: confettiColors[i % confettiColors.length],
      left: `${Math.random() * 100}%`,
      scale: Math.random() * 0.5 + 0.5,
      duration: Math.random() * 1.5 + 1.5,
      delay: Math.random() * 0.3,
      rotate: Math.random() * 720 - 360,
    })), []
  )

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 rounded-full gpu-accelerate"
          style={{ backgroundColor: p.color, left: p.left }}
          initial={{ top: -10, opacity: 1, scale: p.scale, rotate: 0 }}
          animate={{ top: "110%", opacity: 0, rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  )
})

// Memoized detail row
const DetailRow = memo(function DetailRow({ 
  icon: Icon, 
  label, 
  value,
  index 
}: { 
  icon: React.ElementType
  label: string
  value: string
  index: number 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.02, x: 5 }}
      className="flex items-center gap-5 p-5 glass-strong rounded-2xl hover:border-primary/40 transition-all duration-300 cursor-default group gpu-accelerate diamond-border"
    >
      <div className="absolute inset-0 noise-surface opacity-[0.02] pointer-events-none" />
      <motion.div 
        className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300 diamond-border border-primary/20"
        whileHover={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.4 }}
      >
        <Icon className="w-6 h-6 text-primary" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-50 mb-0.5">{label}</p>
        <p className="font-bold text-lg text-foreground break-words whitespace-pre-wrap tracking-tight italic font-heading">{value}</p>
      </div>
    </motion.div>
  )
})

export function ResultDisplay({ result, onVerifyAnother }: ResultDisplayProps) {
  const [showLog, setShowLog] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const isValid = result.isValid
  const isActionRequired = result.status === "action_required"

  const details = useMemo(() => [
    { icon: User, label: "Name", value: result.name },
    { icon: BookOpen, label: "Course", value: result.course },
    { icon: Building2, label: "Platform", value: result.platform },
    { icon: Calendar, label: "Issue Date", value: result.issueDate },
    { icon: Clock, label: "Total Hours", value: result.totalHours || "N/A" },
  ], [result.name, result.course, result.platform, result.issueDate, result.totalHours])

  const downloadReport = async () => {
    setIsDownloading(true)
    try {
      const { jsPDF } = await import("jspdf")
      
      // 1. Generate QR Code (Professional Dark Mode QR)
      const qrDataUrl = await QRCode.toDataURL(result.verificationUrl || "https://certiguard.app", {
        margin: 1,
        width: 300,
        color: {
          dark: "#0F172A", // Deep Slate
          light: "#FFFFFF"
        }
      })

      const canvas = document.createElement("canvas")
      // High-resolution for A4 print quality (300 DPI)
      const W = 2480, H = 3508 // A4 Vertical at 300DPI
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext("2d")!

      // --- ULTRA-CLEAN BACKGROUND ---
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, W, H)

      // Subtle Institutional Watermark
      ctx.globalAlpha = 0.03
      ctx.fillStyle = "#0F172A"
      ctx.font = "bold 200px 'Segoe UI', Arial"
      ctx.textAlign = "center"
      ctx.translate(W/2, H/2)
      ctx.rotate(-Math.PI / 4)
      for(let i = -3; i < 3; i++) {
        for(let j = -3; j < 3; j++) {
          ctx.fillText("CERTIGUARD", i * 1500, j * 400)
        }
      }
      ctx.rotate(Math.PI / 4)
      ctx.translate(-W/2, -H/2)
      ctx.globalAlpha = 1.0

      // --- HEADER & IDENTITY ---
      const margin = 160
      const primaryCol = "#10B981" // Emerald
      const darkCol = "#050505" // Obsidian
      const grayCol = "#64748B"
      
      // Top Accent Bar
      ctx.fillStyle = primaryCol
      ctx.fillRect(0, 0, W, 40)
      
      // Certificate ID - Prominent Top Right
      ctx.textAlign = "right"
      ctx.fillStyle = darkCol
      ctx.font = "bold 45px 'Courier New', monospace"
      ctx.fillText(`REPORT_ID: ${result.certificateId || "N/A"}`, W - margin, margin)
      
      // Brand Logo
      ctx.textAlign = "left"
      ctx.font = "900 80px 'Segoe UI', Arial"
      ctx.fillStyle = darkCol
      ctx.fillText("CERTIGUARD", margin, margin)
      ctx.font = "bold 30px 'Segoe UI', Arial"
      ctx.fillStyle = primaryCol
      ctx.fillText("FORENSIC AUTHENTICATION UNIT", margin, margin + 50)

      // Divider
      ctx.strokeStyle = "#F1F5F9"
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(margin, margin + 120); ctx.lineTo(W - margin, margin + 120); ctx.stroke()

      // --- HERO STATUS SECTION ---
      const statusY = margin + 250
      ctx.fillStyle = "#F8FAFC"
      ctx.beginPath(); ctx.roundRect(margin, statusY, W - margin * 2, 500, 60); ctx.fill()
      
      // Decorative corner accents
      ctx.fillStyle = primaryCol
      ctx.fillRect(margin, statusY, 120, 10)
      ctx.fillRect(margin, statusY, 10, 120)

      ctx.textAlign = "left"
      ctx.fillStyle = grayCol
      ctx.font = "bold 40px 'Segoe UI', Arial"
      ctx.fillText("AUTHENTICATION_RESULT", margin + 100, statusY + 120)
      
      ctx.fillStyle = primaryCol
      ctx.font = "900 160px 'Segoe UI', Arial"
      ctx.fillText("VERIFIED", margin + 100, statusY + 300)
      
      ctx.fillStyle = darkCol
      ctx.font = "italic 45px Georgia, serif"
      ctx.fillText("Parity Confirmed with Distributed Ledger", margin + 100, statusY + 400)

      // --- DATA GRID ---
      const gridY = statusY + 700
      const colWidth = (W - margin * 2) / 2
      
      const drawBlock = (label: string, value: string, x: number, y: number) => {
        ctx.fillStyle = grayCol
        ctx.font = "bold 35px 'Segoe UI', Arial"
        ctx.fillText(label.toUpperCase(), x, y)
        ctx.fillStyle = darkCol
        ctx.font = "80px 'Segoe UI', Arial"
        ctx.fillText(value || "N/A", x, y + 100)
        // Underline
        ctx.strokeStyle = "#F1F5F9"
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(x, y + 150); ctx.lineTo(x + colWidth - 40, y + 150); ctx.stroke()
      }

      drawBlock("Credential Holder", result.name, margin, gridY)
      drawBlock("Platform Protocol", result.platform, margin + colWidth, gridY)
      drawBlock("Specialization", result.course, margin, gridY + 300)
      drawBlock("Issue Date", result.issueDate, margin + colWidth, gridY + 300)
      drawBlock("Total Duration", result.totalHours || "N/A", margin, gridY + 600)
      drawBlock("Validation URL", "REGISTERED_NODE", margin + colWidth, gridY + 600)

      // --- QR CODE & FINAL ATTESTATION ---
      const qrSize = 550
      const qrX = W - margin - qrSize
      const qrY = H - margin - qrSize - 100
      
      const qrImg = new Image()
      qrImg.src = qrDataUrl
      await new Promise(resolve => qrImg.onload = resolve)
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

      // Signature Area
      ctx.textAlign = "left"
      ctx.fillStyle = darkCol
      ctx.font = "italic 60px 'Segoe UI', Arial"
      ctx.fillText("CertiGuard AI", margin, qrY + 100)
      ctx.font = "bold 30px 'Segoe UI', Arial"
      ctx.fillStyle = grayCol
      ctx.fillText("DIGITAL SIGNATURE ATTESTED", margin, qrY + 160)
      
      // Footer Bottom
      ctx.textAlign = "left"
      ctx.fillStyle = "#CBD5E1"
      ctx.font = "bold 30px 'Courier New', monospace"
      const reportHash = Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join("")
      ctx.fillText(`SHA-256: ${reportHash.toUpperCase()}`, margin, H - 120)
      ctx.fillText(`TIMESTAMP: ${new Date().toISOString()}`, margin, H - 70)

      // Final Render
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      })
      
      const imgData = canvas.toDataURL("image/jpeg", 0.95)
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297)
      
      const fileName = `CertiGuard_Report_${result.name?.replace(/\s+/g, "_") || "Verification"}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error("Report generation failed:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <section className="relative py-24 px-4 overflow-hidden">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Main Result Card */}
          <Card
            className={`
              relative overflow-hidden glass-strong rounded-[3rem] border-2 gpu-accelerate diamond-border
              ${isActionRequired ? "border-warning/50 shadow-[0_0_60px_rgba(255,180,0,0.15)]" : isValid ? "border-primary/50 shadow-[0_0_60px_rgba(124,255,160,0.15)]" : "border-destructive/50 shadow-[0_0_60px_rgba(255,50,50,0.15)]"}
            `}
          >
            <div className="absolute inset-0 noise-surface opacity-[0.05] pointer-events-none" />
            
            {/* Confetti for success */}
            <AnimatePresence>
              {isValid && <Confetti />}
            </AnimatePresence>
            
            <CardContent className="p-12 relative z-10">
              {/* Status Header */}
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={quickSpring}
                  className="inline-flex relative mb-8"
                >
                  {isActionRequired ? (
                    <>
                      <div className="absolute inset-0 bg-warning/30 blur-[60px] rounded-full animate-pulse" />
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="relative glass rounded-[2rem] p-8 border-warning/40 shadow-2xl diamond-border"
                      >
                        <AlertTriangle className="w-20 h-20 text-warning" />
                      </motion.div>
                    </>
                  ) : isValid ? (
                    <>
                      <div className="absolute inset-0 bg-primary/30 blur-[80px] rounded-full animate-aurora" />
                      <motion.div
                        animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="relative glass rounded-[2.5rem] p-10 border-primary/40 shadow-2xl diamond-border"
                      >
                        <CheckCircle2 className="w-24 h-24 text-primary" />
                        <motion.div
                          className="absolute -top-4 -right-4"
                          animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 180, 270, 360] }}
                          transition={{ duration: 4, repeat: Infinity }}
                        >
                          <Sparkles className="w-10 h-10 text-primary-foreground drop-shadow-[0_0_10px_var(--primary)]" />
                        </motion.div>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-destructive/30 blur-[60px] rounded-full" />
                      <motion.div
                        animate={{ x: [-5, 5, -5, 5, 0] }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="relative glass rounded-[2rem] p-8 border-destructive/40 shadow-2xl"
                      >
                        <XCircle className="w-20 h-20 text-destructive" />
                      </motion.div>
                    </>
                  )}
                </motion.div>

                {/* Status Text Block */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <h2 className={`text-4xl md:text-5xl font-black mt-2 mb-4 tracking-tighter font-heading italic ${isActionRequired ? "text-warning" : isValid ? "text-primary glow-text" : "text-destructive"}`}>
                    {isActionRequired ? "CAPTCHA REQUIRED" : isValid ? "STATUS: AUTHENTIC" : "AUTHENTICATION FAILED"}
                  </h2>
                  <p className="text-muted-foreground/80 text-lg font-medium max-w-lg mx-auto leading-relaxed">
                    {isActionRequired 
                      ? "Direct algorithmic access blocked. Manual human attestation required via host provider." 
                      : isValid 
                        ? "Institutional-grade verification completed. Document parity confirmed against global networks." 
                        : "High-probability anomaly detected. Credential origin cannot be established."}
                  </p>
                </motion.div>
              </div>

              {isActionRequired && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-12 p-8 glass-strong rounded-3xl border-warning/30 bg-warning/[0.03] shadow-inner diamond-border"
                >
                  <h4 className="flex items-center gap-3 text-warning font-black tracking-widest text-xs uppercase mb-5">
                    <Terminal className="w-4 h-4" />
                    Resolution Protocol
                  </h4>
                  <ul className="text-sm space-y-4 text-muted-foreground/90 font-medium">
                    <li className="flex gap-4">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center text-[10px] font-black">01</span>
                      Execute "Solve Captcha" protocol at the source provider.
                    </li>
                    <li className="flex gap-4">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center text-[10px] font-black">02</span>
                      Establish persistent browser session on the external site.
                    </li>
                    <li className="flex gap-4">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center text-[10px] font-black">03</span>
                      Re-initialize verification sequence on CertiGuard.
                    </li>
                  </ul>
                  <div className="mt-8">
                    <Button
                      asChild
                      className="w-full bg-warning hover:bg-warning/90 text-black font-black h-16 rounded-2xl shadow-xl shadow-warning/20 text-lg tracking-tight"
                    >
                      <a href={result.verificationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3">
                        <ExternalLink className="w-6 h-6" />
                        OVERRIDE & SOLVE
                      </a>
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Data Extraction Grid */}
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-50">
                    Extracted Forensic Metadata
                  </h3>
                  <div className="h-px flex-1 bg-white/5 mx-6" />
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-accent/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  </div>
                </div>

                <div className="grid gap-4">
                  {details.map((item, index) => (
                    <DetailRow key={item.label} {...item} index={index} />
                  ))}
                </div>

                {/* Secure Link Box */}
                {result.verificationUrl && (
                  <motion.a
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    href={result.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-5 glass-strong rounded-2xl hover:border-primary/60 transition-all duration-300 group gpu-accelerate diamond-border border-primary/20 bg-primary/[0.02]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center diamond-border border-primary/30">
                        <Globe className="w-6 h-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-50 mb-0.5">Global Link</p>
                        <p className="text-sm font-bold text-primary truncate max-w-[200px] sm:max-w-md italic tracking-tighter">
                          {result.verificationUrl}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </motion.a>
                )}

                {/* ID Badges */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="flex flex-wrap gap-4 pt-6"
                >
                  <div className="px-5 py-2.5 glass-strong rounded-xl text-[10px] font-black tracking-widest border border-white/5 uppercase">
                    <span className="text-muted-foreground opacity-60">ID:// </span>
                    <span className="text-primary font-mono">{result.certificateId}</span>
                  </div>
                  <div className="px-5 py-2.5 glass-strong rounded-xl text-[10px] font-black tracking-widest border border-white/5 uppercase">
                    <span className="text-muted-foreground opacity-60">AUTH:// </span>
                    <span className="text-foreground">{isValid ? "POSITIVE" : "UNKNOWN"}</span>
                  </div>
                </motion.div>
              </div>

              {/* Action Buttons Layer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 mt-12"
              >
                <div className="flex-1 flex flex-col gap-4">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={quickSpring}>
                    <Button
                      size="lg"
                      onClick={downloadReport}
                      disabled={isDownloading}
                      className="w-full relative overflow-hidden bg-primary text-primary-foreground h-16 rounded-2xl shadow-2xl shadow-primary/30 font-black tracking-tight"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3 text-xl italic font-heading">
                        {isDownloading ? (
                          <RotateCcw className="w-6 h-6 animate-spin" />
                        ) : (
                          <Download className="w-6 h-6" />
                        )}
                        {isDownloading ? "BUILDING PDF..." : "SECURE EXPORT"}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />
                    </Button>
                  </motion.div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLog(!showLog)}
                    className="w-full text-[10px] font-black tracking-[0.3em] text-muted-foreground hover:text-primary hover:bg-primary/5 uppercase gap-3 py-6"
                  >
                    <Terminal className="w-4 h-4" />
                    {showLog ? "TERMINATE LOG" : "ACCESS CONSOLE"}
                  </Button>
                </div>
                
                <motion.div className="flex-1" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={quickSpring}>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={onVerifyAnother}
                    className="w-full h-16 border-glass-border hover:border-primary/50 bg-white/5 hover:bg-primary/5 transition-all duration-500 rounded-2xl group font-black tracking-tight"
                  >
                    <RotateCcw className="mr-3 w-5 h-5 group-hover:rotate-[-180deg] transition-transform duration-500 group-hover:text-primary" />
                    <span className="text-lg italic font-heading group-hover:text-primary">Next Target</span>
                  </Button>
                </motion.div>
              </motion.div>

              {/* Console Output */}
              <AnimatePresence>
                {showLog && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-6"
                  >
                    <div className="p-8 glass-stronger rounded-3xl border border-white/5 bg-black/60 shadow-inner diamond-border relative">
                      <div className="absolute top-4 right-6 flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500/50" />
                        <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                        <div className="w-2 h-2 rounded-full bg-green-500/50" />
                      </div>
                      <div className="flex items-center gap-3 mb-6">
                        <Terminal className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">CORE_DEBUG_SEQUENCE_V4</span>
                      </div>
                      <pre className="text-[11px] font-mono whitespace-pre-wrap text-muted-foreground/80 leading-relaxed max-h-60 overflow-y-auto custom-scrollbar italic tracking-tight">
                        {`> INITIALIZING NEURAL SCAN...\n> BUFFERING GLOBAL REGISTRY...\n> PARSING DOCUMENT STRUCTURE...\n\n${result.rawOutput || "NULL_RESPONSE: DATA_NOT_FOUND"}`}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>

            {/* Ambient Corner Atmosphere */}
            <div className={`absolute top-0 left-0 w-60 h-60 ${isActionRequired ? "bg-warning/10" : isValid ? "bg-primary/10" : "bg-destructive/10"} blur-[100px] pointer-events-none opacity-40`} />
            <div className={`absolute bottom-0 right-0 w-60 h-60 ${isActionRequired ? "bg-warning/10" : isValid ? "bg-primary/10" : "bg-destructive/10"} blur-[100px] pointer-events-none opacity-40`} />
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
