"use client"

import { useState, memo, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, User, BookOpen, Building2, ExternalLink, Download, RotateCcw, Sparkles, AlertTriangle, Terminal, Clock, Calendar, Check } from "lucide-react"
import { GlassCard, GlassButton, smoothSpring } from "@/components/ui/glass-container"
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

// B/W Confetti replacement: floating orbs
const Confetti = memo(function Confetti() {
  const particles = useMemo(() => 
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      scale: Math.random() * 0.5 + 0.5,
      duration: Math.random() * 1.5 + 1.5,
      delay: Math.random() * 0.3,
      yStart: -20,
      yEnd: "110%",
    })), []
  )

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          style={{ left: p.left }}
          initial={{ top: p.yStart, opacity: 1, scale: p.scale }}
          animate={{ top: p.yEnd, opacity: 0 }}
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
      className="flex items-center gap-4 p-4 rounded-xl liquid-glass group hover:bg-surface-2 transition-colors cursor-default"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-surface-1 border border-glass-border flex items-center justify-center transition-colors">
        <Icon className="w-5 h-5 text-text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">{label}</p>
        <p className="font-medium text-text-primary break-words whitespace-pre-wrap">{value}</p>
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

      // Minimal monochrome PDF generation
      const qrDataUrl = await QRCode.toDataURL(result.verificationUrl || "https://certiguardofficial.vercel.app", {
        margin: 2,
        width: 300,
        color: { dark: "#000000", light: "#FFFFFF" }
      })

      const canvas = document.createElement("canvas")
      const W = 2000, H = 1414 
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext("2d")!


      // =====================================================================
      //  BACKGROUND - Engine Console Dark (#0f121b)
      // =====================================================================
      ctx.fillStyle = "#0f121b"
      ctx.fillRect(0, 0, W, H)

      // Ambient glows (cyan and indigo)
      const drawOrb = (cx: number, cy: number, r: number, color: string) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        g.addColorStop(0, color)
        g.addColorStop(1, "rgba(15, 18, 27, 0)") // fade to bg
        ctx.fillStyle = g
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
      }
      drawOrb(W, 0, 800, "rgba(34, 211, 238, 0.08)") // top-right cyan
      drawOrb(0, H, 800, "rgba(79, 70, 229, 0.08)") // bottom-left indigo

      // =====================================================================
      //  BORDER FRAME (Dashed + Solid)
      // =====================================================================
      const pad = 60
      // Outer solid border (#1e2433)
      ctx.strokeStyle = "#1e2433"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.roundRect(pad, pad, W - pad * 2, H - pad * 2, 24)
      ctx.stroke()
      
      // Inner dashed border (#2a3143)
      ctx.strokeStyle = "#2a3143"
      ctx.lineWidth = 2
      ctx.setLineDash([12, 12])
      ctx.beginPath()
      ctx.roundRect(pad + 20, pad + 20, W - (pad + 20) * 2, H - (pad + 20) * 2, 16)
      ctx.stroke()
      ctx.setLineDash([])

      // Corner accents (Cyan)
      const cornerLen = 80
      const corners = [
        [pad + 20, pad + 20], [W - pad - 20, pad + 20], 
        [pad + 20, H - pad - 20], [W - pad - 20, H - pad - 20]
      ]
      ctx.strokeStyle = "#22d3ee" // cyan-400
      ctx.lineWidth = 4
      corners.forEach(([cx, cy]) => {
        const dx = cx < W / 2 ? 1 : -1
        const dy = cy < H / 2 ? 1 : -1
        ctx.beginPath()
        ctx.moveTo(cx + dx * cornerLen, cy)
        ctx.lineTo(cx, cy)
        ctx.lineTo(cx, cy + dy * cornerLen)
        ctx.stroke()
      })

      // =====================================================================
      //  HEADER BAR (Glowing Cyan Scanline)
      // =====================================================================
      const headerBarGrad = ctx.createLinearGradient(0, 0, W, 0)
      headerBarGrad.addColorStop(0, "rgba(34, 211, 238, 0)")
      headerBarGrad.addColorStop(0.5, "rgba(34, 211, 238, 1)")
      headerBarGrad.addColorStop(1, "rgba(34, 211, 238, 0)")
      ctx.fillStyle = headerBarGrad
      ctx.fillRect(W/2 - 400, pad + 140, 800, 3)
      // Add a glow under the line
      const glowGrad = ctx.createLinearGradient(0, 0, W, 0)
      glowGrad.addColorStop(0, "rgba(34, 211, 238, 0)")
      glowGrad.addColorStop(0.5, "rgba(34, 211, 238, 0.4)")
      glowGrad.addColorStop(1, "rgba(34, 211, 238, 0)")
      ctx.fillStyle = glowGrad
      ctx.fillRect(W/2 - 400, pad + 140, 800, 15)

      // =====================================================================
      //  LOGO & TITLE
      // =====================================================================
      // Shield Icon Background
      const shieldX = 140, shieldY = 130
      ctx.fillStyle = "#151923"
      ctx.beginPath()
      ctx.roundRect(shieldX - 20, shieldY - 20, 110, 110, 20)
      ctx.fill()
      ctx.strokeStyle = "#1e2433"
      ctx.lineWidth = 2
      ctx.stroke()

      // Shield Shape
      ctx.save()
      const shieldSize = 70
      ctx.beginPath()
      const sr = shieldSize * 0.18
      ctx.moveTo(shieldX + sr, shieldY)
      ctx.lineTo(shieldX + shieldSize - sr, shieldY)
      ctx.quadraticCurveTo(shieldX + shieldSize, shieldY, shieldX + shieldSize, shieldY + sr)
      ctx.lineTo(shieldX + shieldSize, shieldY + shieldSize * 0.58)
      ctx.quadraticCurveTo(shieldX + shieldSize, shieldY + shieldSize * 0.88, shieldX + shieldSize / 2, shieldY + shieldSize)
      ctx.quadraticCurveTo(shieldX, shieldY + shieldSize * 0.88, shieldX, shieldY + shieldSize * 0.58)
      ctx.lineTo(shieldX, shieldY + sr)
      ctx.quadraticCurveTo(shieldX, shieldY, shieldX + sr, shieldY)
      ctx.closePath()
      const shieldGrad = ctx.createLinearGradient(shieldX, shieldY, shieldX, shieldY + shieldSize)
      shieldGrad.addColorStop(0, "#22d3ee") // cyan-400
      shieldGrad.addColorStop(1, "#0284c7") // sky-600
      ctx.fillStyle = shieldGrad
      ctx.fill()
      // Checkmark inside shield
      ctx.strokeStyle = "#0f121b"
      ctx.lineWidth = 6
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      ctx.moveTo(shieldX + 18, shieldY + 38)
      ctx.lineTo(shieldX + 30, shieldY + 50)
      ctx.lineTo(shieldX + 52, shieldY + 26)
      ctx.stroke()
      ctx.restore()

      // Title Text
      ctx.textAlign = "left"
      ctx.fillStyle = "#ffffff"
      ctx.font = "700 48px 'Inter', 'Segoe UI', sans-serif"
      ctx.letterSpacing = "-1px"
      ctx.fillText("CERTIGUARD", 260, 175)
      ctx.fillStyle = "#94a3b8"
      ctx.font = "700 16px 'Inter', 'Segoe UI', sans-serif"
      ctx.letterSpacing = "8px"
      ctx.fillText("VERIFICATION ENGINE REPORT", 265, 210)
      ctx.letterSpacing = "0px"

      // Status Seal
      const statusColor = result.isValid ? "#22c55e" : "#ef4444"
      const statusText = result.isValid ? "VERIFIED" : "FAILED"
      ctx.save()
      ctx.textAlign = "center"
      const stampX = W - 180, stampY = 180
      ctx.beginPath()
      ctx.arc(stampX, stampY, 60, 0, Math.PI * 2)
      ctx.strokeStyle = statusColor
      ctx.lineWidth = 4
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(stampX, stampY, 50, 0, Math.PI * 2)
      ctx.setLineDash([5, 5])
      ctx.strokeStyle = statusColor + "99"
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = statusColor
      ctx.font = "800 18px 'Inter', 'Segoe UI', sans-serif"
      ctx.letterSpacing = "2px"
      ctx.fillText(statusText, stampX, stampY + 6)
      ctx.restore()

      // =====================================================================
      //  "THIS CERTIFIES THAT" + NAME
      // =====================================================================
      ctx.textAlign = "center"
      ctx.fillStyle = "#64748b"
      ctx.font = "700 16px 'Inter', 'Segoe UI', sans-serif"
      ctx.letterSpacing = "6px"
      ctx.fillText("THIS CERTIFIES THAT", W / 2, 340)
      ctx.letterSpacing = "0px"

      // Recipient Name 
      ctx.fillStyle = "#ffffff"
      const nameText = result.name || "Verified Participant"
      let nameFontSize = 90
      ctx.font = `italic 700 ${nameFontSize}px 'Playfair Display', Georgia, serif`
      while (ctx.measureText(nameText).width > W - 400 && nameFontSize > 40) {
        nameFontSize -= 4
        ctx.font = `italic 700 ${nameFontSize}px 'Playfair Display', Georgia, serif`
      }
      ctx.fillText(nameText, W / 2, 450)

      // Scanline under name
      const nameWidth = Math.min(ctx.measureText(nameText).width + 120, W - 400)
      ctx.fillStyle = headerBarGrad
      ctx.fillRect(W / 2 - nameWidth / 2, 490, nameWidth, 2)

      // =====================================================================
      //  COURSE TITLE
      // =====================================================================
      ctx.fillStyle = "#94a3b8"
      ctx.font = "700 16px 'Inter', 'Segoe UI', sans-serif"
      ctx.letterSpacing = "4px"
      ctx.fillText("HAS SUCCESSFULLY COMPLETED", W / 2, 560)
      ctx.letterSpacing = "0px"

      ctx.fillStyle = "#f8fafc"
      const courseText = result.course || "Certificate Course"
      let courseFontSize = 42
      ctx.font = `800 ${courseFontSize}px 'Inter', 'Segoe UI', sans-serif`
      while (ctx.measureText(courseText).width > W - 500 && courseFontSize > 20) {
        courseFontSize -= 2
        ctx.font = `800 ${courseFontSize}px 'Inter', 'Segoe UI', sans-serif`
      }
      ctx.fillText(courseText, W / 2, 620)

      // =====================================================================
      //  DETAILS GRID (4 columns) - Skeleton Style
      // =====================================================================
      ctx.textAlign = "left"
      const gridY = 720
      const gridH = 140
      const colWidth = (W - 320) / 4
      const gridStartX = 160
      const finalDate = result.issueDate && result.issueDate !== "N/A" ? result.issueDate : (result.date || "N/A")
      const gridItems = [
        { label: "PLATFORM", value: result.platform || "N/A", accent: "#22d3ee" },
        { label: "COMPLETED DATE", value: finalDate, accent: "#818cf8" },
        { label: "TOTAL HOURS", value: result.totalHours || "N/A", accent: "#c084fc" },
        { label: "CERTIFICATE ID", value: result.certificateId || "N/A", accent: "#38bdf8" },
      ]

      gridItems.forEach((item, i) => {
        const x = gridStartX + i * colWidth
        // Card background (engine console style)
        ctx.fillStyle = "#151923"
        ctx.beginPath()
        ctx.roundRect(x, gridY, colWidth - 24, gridH, 16)
        ctx.fill()
        ctx.strokeStyle = "#1e2433"
        ctx.lineWidth = 2
        ctx.stroke()
        
        // Label
        ctx.fillStyle = "#64748b"
        ctx.font = "700 12px 'Inter', 'Segoe UI', sans-serif"
        ctx.letterSpacing = "2px"
        ctx.fillText(item.label, x + 24, gridY + 46)
        ctx.letterSpacing = "0px"
        
        // Value skeleton box
        ctx.fillStyle = "#1b233a"
        ctx.beginPath()
        ctx.roundRect(x + 24, gridY + 66, colWidth - 72, 44, 8)
        ctx.fill()
        
        // Value text over skeleton box
        ctx.fillStyle = "#e2e8f0"
        let valFont = 18
        ctx.font = `700 ${valFont}px 'Inter', 'Segoe UI', sans-serif`
        while (ctx.measureText(item.value).width > colWidth - 100 && valFont > 12) {
          valFont -= 2
          ctx.font = `700 ${valFont}px 'Inter', 'Segoe UI', sans-serif`
        }
        ctx.fillText(item.value, x + 36, gridY + 95)
      })

      // =====================================================================
      //  STATUS BANNER
      // =====================================================================
      const bannerY = 900
      const bannerH = 80
      ctx.fillStyle = "#151923"
      ctx.beginPath()
      ctx.roundRect(160, bannerY, W - 320, bannerH, 16)
      ctx.fill()
      ctx.strokeStyle = result.isValid ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"
      ctx.lineWidth = 2
      ctx.stroke()
      
      // Gradient glow behind text
      const bannerGrad = ctx.createLinearGradient(W/2 - 200, bannerY, W/2 + 200, bannerY)
      if (result.isValid) {
        bannerGrad.addColorStop(0, "rgba(34, 197, 94, 0)")
        bannerGrad.addColorStop(0.5, "rgba(34, 197, 94, 0.15)")
        bannerGrad.addColorStop(1, "rgba(34, 197, 94, 0)")
      } else {
        bannerGrad.addColorStop(0, "rgba(239, 68, 68, 0)")
        bannerGrad.addColorStop(0.5, "rgba(239, 68, 68, 0.15)")
        bannerGrad.addColorStop(1, "rgba(239, 68, 68, 0)")
      }
      ctx.fillStyle = bannerGrad
      ctx.fill()

      ctx.textAlign = "center"
      ctx.fillStyle = result.isValid ? "#4ade80" : "#f87171"
      ctx.font = "800 24px 'Inter', 'Segoe UI', sans-serif"
      ctx.letterSpacing = "4px"
      ctx.fillText(result.isValid ? "✓  VERIFICATION STATUS : AUTHENTIC" : "✕  VERIFICATION STATUS : FAILED", W / 2, bannerY + 50)
      ctx.letterSpacing = "0px"

      // =====================================================================
      //  FOOTER: QR Code + Branding
      // =====================================================================
      // QR Code Box
      const qrImg = new Image()
      qrImg.src = qrDataUrl
      await new Promise(resolve => qrImg.onload = resolve)
      const qrSize = 160
      const qrX = 160, qrY = 1040
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.roundRect(qrX, qrY, qrSize, qrSize, 12)
      ctx.fill()
      ctx.drawImage(qrImg, qrX + 10, qrY + 10, qrSize - 20, qrSize - 20)
      
      // QR Frame (Engine style)
      ctx.strokeStyle = "#22d3ee"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 16)
      ctx.stroke()
      
      ctx.textAlign = "center"
      ctx.fillStyle = "#64748b"
      ctx.font = "700 12px 'Inter', 'Segoe UI', sans-serif"
      ctx.letterSpacing = "2px"
      ctx.fillText("SCAN TO VERIFY", qrX + qrSize / 2, qrY + qrSize + 36)

      // Center: Verification URL text
      ctx.textAlign = "center"
      ctx.fillStyle = "#64748b"
      ctx.font = "500 18px 'Inter', 'Segoe UI', sans-serif"
      ctx.fillText("Verify this certificate digitally at", W / 2, 1080)
      ctx.fillStyle = "#22d3ee"
      ctx.font = "700 22px 'Inter', 'Segoe UI', sans-serif"
      const displayUrl = result.verificationUrl || "certiguardofficial.vercel.app"
      const truncatedUrl = displayUrl.length > 70 ? displayUrl.substring(0, 67) + "..." : displayUrl
      ctx.fillText(truncatedUrl, W / 2, 1120)

      // Timestamp
      ctx.fillStyle = "#475569"
      ctx.font = "500 14px 'Inter', 'Segoe UI', sans-serif"
      const now = new Date()
      ctx.fillText(`Generated by Engine on ${now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} at ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`, W / 2, 1170)

      // Right side: "Secured by AI" badge
      const badgeW = 220, badgeH = 54
      const badgeX = W - 160 - badgeW, badgeY2 = 1090
      ctx.fillStyle = "#151923"
      ctx.beginPath()
      ctx.roundRect(badgeX, badgeY2, badgeW, badgeH, 12)
      ctx.fill()
      ctx.strokeStyle = "#1e2433"
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = "#22d3ee"
      ctx.font = "800 16px 'Inter', 'Segoe UI', sans-serif"
      ctx.letterSpacing = "4px"
      ctx.fillText("SECURED BY AI", badgeX + badgeW / 2, badgeY2 + 34)
      ctx.letterSpacing = "0px"

      // Bottom Disclaimer
      ctx.textAlign = "center"
      ctx.fillStyle = "#334155"
      ctx.font = "500 14px 'Inter', 'Segoe UI', sans-serif"
      ctx.fillText("This document is an automated engine report generated by CertiGuard AI.", W / 2, H - 100)

      // =====================================================================
      //  EXPORT TO PDF
      // =====================================================================
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      })


      const imgData = canvas.toDataURL("image/jpeg", 0.95)
      pdf.addImage(imgData, "JPEG", 0, 0, 297, 210)
      pdf.save(`CertiGuard_Report_${result.name?.replace(/\s+/g, "_") || "Verification"}.pdf`)

    } catch (error) {
      console.error("Report generation failed:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <section className="relative py-16 px-4 z-10">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
        >
          {/* Result Card */}
          <GlassCard interactive={false} className="p-8">
            <AnimatePresence>
              {isValid && <Confetti />}
            </AnimatePresence>
            
            <div className="text-center mb-10 relative z-10">
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={smoothSpring}
                className="inline-flex relative mb-6"
              >
                {isActionRequired ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/10 blur-xl rounded-full" />
                    <AlertTriangle className="w-20 h-20 text-white relative z-10" />
                  </div>
                ) : isValid ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-glow-pulse" />
                    <CheckCircle2 className="w-20 h-20 text-white relative z-10" />
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ rotate: [0, 15, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-6 h-6 text-white" />
                    </motion.div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/5 blur-xl rounded-full" />
                    <XCircle className="w-20 h-20 text-text-secondary relative z-10" />
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mb-2">
                  {isActionRequired ? "Action Required" : isValid ? "Authentic Certificate" : "Verification Failed"}
                </h2>
                <p className="text-text-secondary">
                  {isActionRequired 
                    ? "The platform requires a manual captcha check." 
                    : isValid 
                      ? "This certificate has been verified via our neural engine." 
                      : "We could not verify the authenticity of this document."}
                </p>
              </motion.div>
            </div>

            {isActionRequired && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 bg-surface-2 rounded-2xl border border-glass-border"
              >
                <h4 className="font-semibold mb-3 text-text-primary">How to proceed:</h4>
                <ol className="text-sm space-y-3 text-text-secondary list-decimal pl-4 mb-6">
                  <li>Click <strong>Solve on Site</strong> below.</li>
                  <li>Complete the human verification challenge in the new tab.</li>
                  <li>Return here and re-verify your certificate.</li>
                </ol>
                <GlassButton variant="primary" size="md" className="w-full">
                  <a href={result.verificationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full">
                    <ExternalLink className="w-4 h-4" /> Solve on Site
                  </a>
                </GlassButton>
              </motion.div>
            )}

            {/* Certificate Details */}
            <div className="space-y-4">
              <motion.h3 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-4 terminal-text"
              >
                &gt; Extracted_Data_Nodes
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
                  transition={{ duration: 0.35, delay: 0.6 }}
                  href={result.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 liquid-glass rounded-xl hover:bg-surface-2 transition-colors mt-2"
                >
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-text-primary" />
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-text-secondary">Source Link</p>
                      <p className="text-sm font-medium text-text-primary truncate max-w-[200px] sm:max-w-[300px]">
                        {result.verificationUrl}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-text-secondary" />
                </motion.a>
              )}
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 mt-8"
            >
              <div className="flex-1 flex flex-col gap-4">
                <GlassButton
                  variant="primary"
                  size="lg"
                  onClick={downloadReport}
                  disabled={isDownloading}
                  className="w-full"
                >
                  {isDownloading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isDownloading ? "Generating..." : "Download Report"}
                </GlassButton>

                <GlassButton
                  variant="secondary"
                  size="md"
                  onClick={() => setShowLog(!showLog)}
                  className="w-full"
                >
                  <Terminal className="w-4 h-4" />
                  {showLog ? "Hide Console" : "View Console"}
                </GlassButton>
              </div>

              <div className="flex-1">
                <GlassButton
                  variant="ghost"
                  size="lg"
                  onClick={onVerifyAnother}
                  className="w-full h-[104px] sm:h-full border border-glass-border"
                >
                  <RotateCcw className="w-5 h-5 mb-1" />
                  Verify Another
                </GlassButton>
              </div>
            </motion.div>

            {/* Terminal Log */}
            <AnimatePresence>
              {showLog && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-6 overflow-hidden rounded-xl bg-black border border-glass-border"
                >
                  <div className="p-4 flex items-center justify-between border-b border-glass-border bg-surface-1">
                    <span className="text-[10px] text-text-secondary terminal-text tracking-widest">system_log.txt</span>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-surface-2" />
                      <div className="w-2.5 h-2.5 rounded-full bg-surface-2" />
                      <div className="w-2.5 h-2.5 rounded-full bg-surface-2" />
                    </div>
                  </div>
                  <div className="p-4 bg-black/50 overflow-x-auto">
                    <pre className="text-[10px] text-text-secondary terminal-text whitespace-pre-wrap">
                      {result.rawOutput || "No console output available."}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  )
}
