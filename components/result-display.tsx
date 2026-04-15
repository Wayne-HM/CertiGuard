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
  date?: string
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
      className="flex items-center gap-4 p-4 glass rounded-xl hover:border-neon-blue/30 transition-colors duration-150 cursor-default group gpu-accelerate"
    >
      <motion.div 
        className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-neon-blue/10 transition-colors duration-150"
        whileHover={{ rotate: [-8, 8, 0] }}
        transition={{ duration: 0.3 }}
      >
        <Icon className="w-5 h-5 text-neon-blue" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground break-words whitespace-pre-wrap">{value}</p>
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
    { icon: Calendar, label: "Issue Date", value: result.issueDate && result.issueDate !== "N/A" ? result.issueDate : (result.date || "N/A") },
    { icon: Clock, label: "Total Hours", value: result.totalHours || "N/A" },
  ], [result.name, result.course, result.platform, result.issueDate, result.date, result.totalHours])

  const downloadReport = async () => {
    setIsDownloading(true)
    try {
      const { jsPDF } = await import("jspdf")
      
      // 1. Generate QR Code
      const qrDataUrl = await QRCode.toDataURL(result.verificationUrl || "https://certiguard.app", {
        margin: 1,
        width: 250,
        color: {
          dark: "#00D4FF",
          light: "#00000000"
        }
      })

      const canvas = document.createElement("canvas")
      const W = 2000, H = 1414 // High-resolution A4
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext("2d")!

      // --- Helper: Draw Shield Icon ---
      const drawShieldIcon = (x: number, y: number, size: number) => {
        ctx.save()
        ctx.translate(x, y)
        
        // Shield Geometry (More rounded, premium look)
        ctx.beginPath()
        const r = size * 0.2
        ctx.moveTo(r, 0)
        ctx.lineTo(size - r, 0)
        ctx.quadraticCurveTo(size, 0, size, r)
        ctx.lineTo(size, size * 0.6)
        ctx.quadraticCurveTo(size, size * 0.9, size/2, size)
        ctx.quadraticCurveTo(0, size * 0.9, 0, size * 0.6)
        ctx.lineTo(0, r)
        ctx.quadraticCurveTo(0, 0, r, 0)
        ctx.closePath()
        
        const grad = ctx.createLinearGradient(0, 0, 0, size)
        grad.addColorStop(0, "#0EA5E9") // Sky Blue
        grad.addColorStop(1, "#0369A1") // Darker Blue
        ctx.fillStyle = grad
        ctx.fill()
        
        // Double Border for Premium Feel
        ctx.strokeStyle = "#00D4FF"
        ctx.lineWidth = 4
        ctx.stroke()
        
        ctx.beginPath()
        ctx.roundRect(size * 0.15, size * 0.15, size * 0.7, size * 0.7, r)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.restore()
      }

      // --- Helper: Draw Award Medallion ---
      const drawAwardMedallion = (x: number, y: number, size: number, valid: boolean) => {
        ctx.save()
        ctx.translate(x, y)
        // Glow
        const glow = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size)
        glow.addColorStop(0, valid ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)")
        glow.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = glow
        ctx.fillRect(-size/2, -size/2, size*2, size*2)
        
        // Circle
        const bgGrad = ctx.createLinearGradient(0, 0, size, size)
        bgGrad.addColorStop(0, "#00D4FF")
        bgGrad.addColorStop(1, "#22C55E")
        ctx.fillStyle = bgGrad
        ctx.beginPath()
        ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2)
        ctx.fill()
        
        // Ribbon Icon
        ctx.strokeStyle = "white"
        ctx.lineWidth = 8
        ctx.lineJoin = "round"
        ctx.beginPath()
        ctx.arc(size/2, size/2 - 5, size/4, 0, Math.PI * 2)
        ctx.moveTo(size/2 - 10, size/2 + 10)
        ctx.lineTo(size/2 - 20, size/2 + size/2.5)
        ctx.lineTo(size/2, size/2 + size/4)
        ctx.lineTo(size/2 + 20, size/2 + size/2.5)
        ctx.lineTo(size/2 + 10, size/2 + 10)
        ctx.stroke()
        ctx.restore()
      }

      // --- Background: Obsidian Deep ---
      const bgGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W)
      bgGrad.addColorStop(0, "#0A0F1C")
      bgGrad.addColorStop(1, "#020617")
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, W, H)

      // Subtle Tech Grid
      ctx.strokeStyle = "rgba(0, 212, 255, 0.03)"
      ctx.lineWidth = 1
      for (let x = 0; x < W; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = 0; y < H; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

      // --- 1. Header Section ---
      drawShieldIcon(120, 100, 100)
      ctx.textAlign = "left"
      ctx.fillStyle = "#FFFFFF"
      ctx.font = "bold 52px 'Segoe UI', sans-serif"
      ctx.fillText("CERTIGUARD OFFICIAL", 260, 155)
      ctx.fillStyle = "#64748B"
      ctx.font = "bold 20px 'Segoe UI', sans-serif"
      ctx.letterSpacing = "4px"
      ctx.fillText("VERIFICATION CERTIFICATE", 260, 195)
      ctx.letterSpacing = "0px"

      // Top Right Sparkle Seal
      const sealX = W - 250, sealY = 150
      ctx.beginPath(); ctx.arc(sealX, sealY, 60, 0, Math.PI * 2)
      ctx.strokeStyle = "rgba(34, 197, 94, 0.3)"; ctx.lineWidth = 2; ctx.stroke()
      ctx.beginPath(); ctx.arc(sealX, sealY, 50, 0, Math.PI * 2); ctx.setLineDash([5, 5])
      ctx.stroke(); ctx.setLineDash([])
      // Star Icon
      ctx.fillStyle = "#22C55E"
      ctx.font = "40px 'Segoe UI'"
      ctx.fillText("✦", sealX - 20, sealY + 15)

      // --- 2. Recipient Section ---
      ctx.fillStyle = "#94A3B8"
      ctx.font = "bold 24px 'Segoe UI', sans-serif"
      ctx.fillText("PRESENTED TO", 120, 380)
      
      ctx.fillStyle = "#F8FAFC"
      ctx.font = "italic bold 100px Georgia, serif"
      ctx.fillText(result.name || "Verified Participant", 120, 520)

      // Decorative divider
      const gradLine = ctx.createLinearGradient(120, 0, W-120, 0)
      gradLine.addColorStop(0, "rgba(0, 212, 255, 0.5)")
      gradLine.addColorStop(0.5, "rgba(79, 70, 229, 0.3)")
      gradLine.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = gradLine
      ctx.fillRect(120, 600, W - 240, 4)

      // --- 3. Verification Details ---
      // Course Info
      ctx.fillStyle = "#6366F1" // Indigo
      ctx.font = "32px 'Segoe UI'"
      ctx.fillText("📖", 120, 715)
      ctx.fillStyle = "#CBD5E1"
      ctx.font = "42px 'Segoe UI', sans-serif"
      ctx.fillText(result.course, 180, 715)

      // Status Badge
      ctx.fillStyle = "#22C55E"
      ctx.font = "32px 'Segoe UI'"
      ctx.fillText("✔️", 120, 790)
      ctx.font = "bold 38px 'Segoe UI', sans-serif"
      ctx.fillText("STATUS: AUTHENTIC", 180, 790)

      // Large Award Medallion on Right
      drawAwardMedallion(W - 480, 630, 220, result.isValid)

      // --- 4. QR & Metadata Footer ---
      // QR Code (Bottom Left as approved)
      const qrImg = new Image()
      qrImg.src = qrDataUrl
      await new Promise(resolve => qrImg.onload = resolve)
      ctx.drawImage(qrImg, 120, 950, 220, 220)
      
      ctx.fillStyle = "rgba(0, 212, 255, 0.1)"
      ctx.fillRect(120, 950, 220, 220) // Subtle overlay
      ctx.strokeStyle = "rgba(0, 212, 255, 0.3)"; ctx.lineWidth = 1
      ctx.strokeRect(120, 950, 220, 220)

      // Metadata Row
      const metaY = H - 150
      ctx.fillStyle = "#64748B"
      ctx.font = "bold 20px 'Segoe UI', sans-serif"
      const finalDate = result.issueDate && result.issueDate !== "N/A" ? result.issueDate : (result.date || "N/A")
      ctx.fillText("🌐 GLOBAL-ID: " + (result.certificateId || "CG-882-X"), 400, metaY)
      ctx.fillText("👤 ID: " + Math.random().toString(36).substr(2, 6).toUpperCase(), 750, metaY)
      ctx.fillText("📅 DATE: " + finalDate, 1050, metaY)

      // Secured by AI Badge
      const badgeX = W - 350, badgeY = H - 180
      ctx.fillStyle = "#0F172A"
      ctx.beginPath(); ctx.roundRect(badgeX, badgeY, 230, 50, 10); ctx.fill()
      ctx.strokeStyle = "#00D4FF"; ctx.lineWidth = 2; ctx.stroke()
      ctx.fillStyle = "#00D4FF"
      ctx.font = "bold 18px 'Segoe UI', sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("SECURED BY AI", badgeX + 115, badgeY + 32)
      ctx.textAlign = "left"

      // --- Final PDF Assembly ---
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      })
      
      const imgData = canvas.toDataURL("image/jpeg", 0.95)
      pdf.addImage(imgData, "JPEG", 0, 0, 297, 210)
      
      const fileName = `CertiGuard_Elite_${result.name?.replace(/\s+/g, "_") || "Verification"}.pdf`
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
              ${isActionRequired ? "border-amber-500/50" : isValid ? "border-success/50" : "border-destructive/50"}
            `}
            style={{
              boxShadow: isActionRequired
                ? "0 0 40px oklch(0.7 0.2 60 / 0.15)"
                : isValid 
                ? "0 0 40px oklch(0.65 0.2 160 / 0.2)" 
                : "0 0 40px oklch(0.55 0.22 25 / 0.2)",
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
                      <div className="absolute inset-0 bg-success/25 blur-2xl rounded-full animate-glow-pulse" />
                      
                      <motion.div
                        animate={{ scale: [1, 1.03, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="relative gpu-accelerate"
                      >
                        <CheckCircle2 className="w-24 h-24 text-success drop-shadow-lg" />
                      </motion.div>
                      
                      {/* Sparkle */}
                      <motion.div
                        className="absolute -top-1 -right-1"
                        animate={{ rotate: [0, 12, 0], scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Sparkles className="w-5 h-5 text-success" />
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
                  <h2 className={`text-2xl sm:text-3xl font-bold mt-6 mb-2 ${isActionRequired ? "text-amber-500" : isValid ? "text-success" : "text-destructive"}`}>
                    {isActionRequired ? "Verification Blocked: Captcha Required" : isValid ? "Verification Status: AUTHENTIC" : "Fake Certificate Detected"}
                  </h2>
                  <p className="text-muted-foreground">
                    {isActionRequired 
                      ? "The platform side is asking to verify you are a human. Please solve it on their site." 
                      : isValid 
                        ? "This certificate is authentic and secured by AI" 
                        : "This certificate could not be verified"}
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
                    className="flex items-center justify-between p-4 glass rounded-xl hover:border-neon-blue/50 transition-colors duration-150 group gpu-accelerate"
                    style={{ borderWidth: 1, borderStyle: "solid", borderColor: "transparent" }}
                  >
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-5 h-5 text-neon-blue" />
                      <div>
                        <p className="text-xs text-muted-foreground">Verification Link</p>
                        <p className="text-sm font-medium text-neon-blue truncate max-w-[200px] sm:max-w-[300px]">
                          {result.verificationUrl}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-neon-blue transition-colors duration-150" />
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
                    <span className="text-foreground font-medium">{result.issueDate && result.issueDate !== "N/A" ? result.issueDate : (result.date || "N/A")}</span>
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
                      className="w-full relative overflow-hidden bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white shadow-lg shadow-neon-blue/20 gpu-accelerate disabled:opacity-70"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isDownloading ? (
                          <RotateCcw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        {isDownloading ? "Generating Report..." : "Download Report"}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer" />
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
                    className="w-full h-full min-h-[44px] border-glass-border hover:bg-secondary hover:border-neon-blue/50 transition-all duration-150 group gpu-accelerate"
                  >
                    <motion.div
                      className="mr-2"
                      whileHover={{ rotate: -360 }}
                      transition={{ duration: 0.4 }}
                    >
                      <RotateCcw className="w-4 h-4 group-hover:text-neon-blue transition-colors duration-150" />
                    </motion.div>
                    <span className="group-hover:text-neon-blue transition-colors duration-150">Verify Another</span>
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
