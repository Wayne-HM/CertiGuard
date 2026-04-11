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
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.3 + index * 0.08, ease: "easeInOut" }}
      whileHover={{ scale: 1.01, x: 3 }}
      className="flex items-center gap-4 p-4 glass rounded-xl hover:border-primary/30 transition-colors duration-150 cursor-default group gpu-accelerate"
    >
      <motion.div 
        className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-150"
        whileHover={{ rotate: [-8, 8, 0] }}
        transition={{ duration: 0.3 }}
      >
        <Icon className="w-5 h-5 text-primary" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-bold tracking-wider uppercase opacity-70">{label}</p>
        <p className="font-bold text-foreground break-words whitespace-pre-wrap">{value}</p>
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

      // --- HEADER & LOGO ---
      const margin = 200
      ctx.fillStyle = "#0F172A"
      ctx.font = "bold 80px 'Segoe UI', Arial"
      ctx.textAlign = "left"
      ctx.fillText("CertiGuard", margin, margin + 80)
      
      ctx.fillStyle = "#10B981" // Emerald
      ctx.font = "bold 30px 'Segoe UI', Arial"
      ctx.fillText("FORENSIC AUTHENTICATION REPORT", margin, margin + 140)

      // Divider Line
      ctx.strokeStyle = "#E2E8F0"
      ctx.lineWidth = 4
      ctx.beginPath(); ctx.moveTo(margin, margin + 200); ctx.lineTo(W - margin, margin + 200); ctx.stroke()

      // --- STATUS CARD (Light Institutional) ---
      const cardY = margin + 350
      ctx.fillStyle = "#F8FAFC"
      ctx.beginPath(); ctx.roundRect(margin, cardY, W - margin * 2, 450, 40); ctx.fill()
      ctx.strokeStyle = "#10B981"
      ctx.lineWidth = 6
      ctx.beginPath(); ctx.roundRect(margin, cardY, W - margin * 2, 450, 40); ctx.stroke()

      ctx.fillStyle = "#0F172A"
      ctx.font = "bold 40px 'Segoe UI', Arial"
      ctx.fillText("VERIFICATION STATUS", margin + 80, cardY + 100)
      
      ctx.fillStyle = "#10B981"
      ctx.font = "bold 120px 'Segoe UI', Arial"
      ctx.fillText("AUTHENTIC", margin + 80, cardY + 280)
      
      ctx.fillStyle = "#64748B"
      ctx.font = "italic 40px 'Segoe UI', Arial"
      ctx.fillText("Secured by AI Signature • Validated via Global Blockchain Registry", margin + 80, cardY + 380)

      // --- CREDENTIAL DETAILS ---
      const detailY = cardY + 650
      const col1 = margin
      const col2 = W / 2 + 50

      const drawDetail = (label: string, value: string, x: number, y: number) => {
        ctx.fillStyle = "#64748B"
        ctx.font = "bold 35px 'Segoe UI', Arial"
        ctx.fillText(label.toUpperCase(), x, y)
        ctx.fillStyle = "#0F172A"
        ctx.font = "80px Georgia, serif"
        ctx.fillText(value || "N/A", x, y + 100)
      }

      drawDetail("Credential Holder", result.name, col1, detailY)
      drawDetail("Specialization", result.course, col1, detailY + 250)
      drawDetail("Issuing Authority", result.platform, col1, detailY + 500)
      drawDetail("Issue Date", result.issueDate, col1, detailY + 750)
      
      drawDetail("Certificate ID", result.certificateId || "N/A", col2, detailY)
      drawDetail("Verification URL", "HTTPS://CERTIGUARD.APP/VERIFY", col2, detailY + 250)

      // --- QR CODE SECTION ---
      const qrSize = 600
      const qrX = W - margin - qrSize
      const qrY = H - margin - qrSize - 100
      
      const qrImg = new Image()
      qrImg.src = qrDataUrl
      await new Promise(resolve => qrImg.onload = resolve)
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

      ctx.textAlign = "center"
      ctx.fillStyle = "#0F172A"
      ctx.font = "bold 35px 'Segoe UI', Arial"
      ctx.fillText("SECURE DIGITAL TWIN", qrX + qrSize/2, qrY + qrSize + 60)
      ctx.fillStyle = "#64748B"
      ctx.font = "30px 'Segoe UI', Arial"
      ctx.fillText("Scan to access live registry", qrX + qrSize/2, qrY + qrSize + 110)

      // --- FOOTER METADATA ---
      ctx.textAlign = "left"
      const footerY = H - margin
      ctx.fillStyle = "#94A3B8"
      ctx.font = "bold 30px 'Courier New', monospace"
      const reportHash = Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join("")
      ctx.fillText(`REPORT_HASH: ${reportHash.toUpperCase()}`, margin, footerY - 140)
      ctx.fillText(`GENERATED_AT: ${new Date().toISOString()}`, margin, footerY - 90)
      ctx.fillText("CERTIGUARD GLOBAL • INSTITUTIONAL GRADE AUTHENTICATION", margin, footerY - 40)

      // Final Vertical Border Accent
      ctx.fillStyle = "#10B981"
      ctx.fillRect(0, 0, 30, H)

      // --- CONVERT TO PDF ---
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      })
      
      const imgData = canvas.toDataURL("image/jpeg", 0.95)
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297) // Vertical A4
      
      const fileName = `CertiGuard_Authentic_${result.name?.replace(/\s+/g, "_") || "Verification"}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error("Report generation failed:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <section className="relative py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {/* Result Card */}
          <Card
            className={`
              relative overflow-hidden glass-strong rounded-3xl border-2 gpu-accelerate
              ${isActionRequired ? "border-amber-500/50" : isValid ? "border-primary/50" : "border-destructive/50"}
            `}
            style={{
              boxShadow: isActionRequired
                ? "0 0 40px oklch(0.7 0.2 60 / 0.15)"
                : isValid 
                ? "0 0 40px oklch(0.65 0.2 160 / 0.15)" 
                : "0 0 40px oklch(0.55 0.22 25 / 0.15)",
            }}
          >
            {/* Confetti for success */}
            <AnimatePresence>
              {isValid && <Confetti />}
            </AnimatePresence>
            
            <CardContent className="p-8 relative z-10">
              {/* Status Icon */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={quickSpring}
                  className="inline-flex relative"
                >
                  {isActionRequired ? (
                    <>
                      {/* Warning glow */}
                      <div className="absolute inset-0 bg-amber-500/25 blur-2xl rounded-full animate-pulse" />
                      <motion.div
                        animate={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="relative gpu-accelerate"
                      >
                        <AlertTriangle className="w-24 h-24 text-amber-500 drop-shadow-lg" />
                      </motion.div>
                    </>
                  ) : isValid ? (
                    <>
                      {/* Success glow */}
                      <div className="absolute inset-0 bg-primary/25 blur-2xl rounded-full animate-glow-pulse" />
                      
                      <motion.div
                        animate={{ scale: [1, 1.03, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="relative gpu-accelerate"
                      >
                        <CheckCircle2 className="w-24 h-24 text-primary drop-shadow-lg" />
                      </motion.div>
                      
                      {/* Sparkle */}
                      <motion.div
                        className="absolute -top-1 -right-1"
                        animate={{ rotate: [0, 12, 0], scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Sparkles className="w-5 h-5 text-primary" />
                      </motion.div>
                    </>
                  ) : (
                    <>
                      {/* Error glow */}
                      <div className="absolute inset-0 bg-destructive/25 blur-2xl rounded-full animate-glow-pulse" />
                      
                      <motion.div
                        initial={{ x: 0 }}
                        animate={{ x: [-2, 2, -2, 2, 0] }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="relative gpu-accelerate"
                      >
                        <XCircle className="w-24 h-24 text-destructive drop-shadow-lg" />
                      </motion.div>
                      
                      {/* Warning */}
                      <motion.div
                        className="absolute -top-1 -right-1"
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      >
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      </motion.div>
                    </>
                  )}
                </motion.div>

                {/* Status Text */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.35 }}
                >
                  <h2 className={`text-2xl sm:text-3xl font-bold mt-6 mb-2 ${isActionRequired ? "text-amber-500" : isValid ? "text-primary" : "text-destructive"}`}>
                    {isActionRequired ? "Verification Blocked: Captcha Required" : isValid ? "Verification Status: AUTHENTIC" : "Fake Certificate Detected"}
                  </h2>
                  <p className="text-muted-foreground font-medium">
                    {isActionRequired 
                      ? "The platform side is asking to verify you are a human. Please solve it on their site." 
                      : isValid 
                        ? "Institutional-grade verification successful. This credential is valid." 
                        : "This certificate could not be verified and may be fraudulent."}
                  </p>
                </motion.div>
              </div>

              {isActionRequired && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-6 glass rounded-2xl border border-amber-500/30 bg-amber-500/5"
                >
                  <h4 className="flex items-center gap-2 text-amber-500 font-semibold mb-3">
                    <Sparkles className="w-4 h-4" />
                    How to fix this:
                  </h4>
                  <ol className="text-sm space-y-3 text-muted-foreground list-decimal pl-4">
                    <li>Click the <strong>Solve Captcha on Site</strong> button below.</li>
                    <li>Verify the "Just a moment..." or captcha challenge in the new tab.</li>
                    <li>Once the certificate appears, return here and click <strong>Verify Another</strong> to re-check.</li>
                  </ol>
                  <div className="mt-6">
                    <Button
                      asChild
                      className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-12 shadow-lg shadow-amber-500/20"
                    >
                      <a href={result.verificationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Solve Captcha on Site
                      </a>
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Certificate Details */}
              <div className="space-y-4">
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4"
                >
                  Extracted Details
                </motion.h3>

                <div className="grid gap-3">
                  {details.map((item, index) => (
                    <DetailRow key={item.label} {...item} index={index} />
                  ))}
                </div>

                {/* Verification Link */}
                {result.verificationUrl && (
                  <motion.a
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.55, ease: "easeInOut" }}
                    whileHover={{ scale: 1.01, x: 3 }}
                    href={result.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 glass rounded-xl hover:border-primary/50 transition-colors duration-150 group gpu-accelerate"
                    style={{ borderWidth: 1, borderStyle: "solid", borderColor: "transparent" }}
                  >
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground font-bold tracking-wider uppercase opacity-70">Live Registry Link</p>
                        <p className="text-sm font-bold text-primary truncate max-w-[200px] sm:max-w-[300px]">
                          {result.verificationUrl}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-150" />
                    </motion.div>
                  </motion.a>
                )}

                {/* Additional Info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap gap-3 pt-4"
                >
                  <motion.div 
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="px-4 py-2 glass rounded-lg text-xs"
                  >
                    <span className="text-muted-foreground">Issue Date: </span>
                    <span className="text-foreground font-medium">{result.issueDate}</span>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="px-4 py-2 glass rounded-lg text-xs"
                  >
                    <span className="text-muted-foreground">Certificate ID: </span>
                    <span className="text-foreground font-medium font-mono">{result.certificateId}</span>
                  </motion.div>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.35 }}
                className="flex flex-col sm:flex-row gap-3 mt-8"
              >
                <div className="flex-1 flex flex-col gap-3">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={quickSpring}
                  >
                    <Button
                      size="lg"
                      onClick={downloadReport}
                      disabled={isDownloading}
                      className="w-full relative overflow-hidden bg-gradient-to-r from-primary to-primary/90 hover:opacity-95 text-white shadow-xl shadow-primary/10 transition-all duration-300 h-14 rounded-2xl font-bold tracking-tight"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                        {isDownloading ? (
                          <RotateCcw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Download className="w-5 h-5" />
                        )}
                        {isDownloading ? "Generating Forensic Report..." : "Secure Download PDF"}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                    </Button>
                  </motion.div>
                  
                  {/* Debug Log Toggle */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={quickSpring}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLog(!showLog)}
                      className="w-full text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 gap-2"
                    >
                      <Terminal className="w-3 h-3" />
                      {showLog ? "Hide Debug Log" : "Show Debug Log"}
                    </Button>
                  </motion.div>
                </div>
                
                <motion.div 
                  className="flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={quickSpring}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={onVerifyAnother}
                    className="w-full h-14 border-glass-border hover:bg-secondary hover:border-primary/50 transition-all duration-300 rounded-2xl group font-semibold"
                  >
                    <motion.div
                      className="mr-2"
                      whileHover={{ rotate: -360 }}
                      transition={{ duration: 0.4 }}
                    >
                      <RotateCcw className="w-4 h-4 group-hover:text-primary transition-colors duration-150" />
                    </motion.div>
                    <span className="group-hover:text-primary transition-colors duration-150">Verify Another</span>
                  </Button>
                </motion.div>
              </motion.div>

              {/* Debug Log Content */}
              <AnimatePresence>
                {showLog && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden mt-4"
                  >
                    <div className="p-4 glass-stronger rounded-xl border border-white/5 bg-black/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Verification Raw Output</span>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-destructive/40" />
                          <div className="w-2 h-2 rounded-full bg-warning/40" />
                          <div className="w-2 h-2 rounded-full bg-success/40" />
                        </div>
                      </div>
                      <pre className="text-[11px] font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed max-h-48 overflow-y-auto custom-scrollbar italic">
                        {result.rawOutput || "No debug information available for this certificate."}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>

            {/* Corner glows */}
            <div className={`absolute top-0 left-0 w-28 h-28 ${isActionRequired ? "bg-amber-500/8" : isValid ? "bg-success/8" : "bg-destructive/8"} blur-2xl pointer-events-none`} />
            <div className={`absolute bottom-0 right-0 w-28 h-28 ${isActionRequired ? "bg-amber-500/8" : isValid ? "bg-success/8" : "bg-destructive/8"} blur-2xl pointer-events-none`} />
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
