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

      // --- Load Professional Google Fonts ---
      const loadFont = async (family: string, url: string, weight: string = "normal", style: string = "normal") => {
        try {
          const face = new FontFace(family, `url(${url})`, { weight, style })
          const loaded = await face.load()
          document.fonts.add(loaded)
        } catch { /* graceful fallback */ }
      }

      await Promise.all([
        loadFont("Inter", "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf", "400"),
        loadFont("Inter", "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZhrib2Bg-4.ttf", "600"),
        loadFont("Inter", "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf", "700"),
        loadFont("Playfair Display", "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDTbtPY_Q.ttf", "700"),
        loadFont("Playfair Display", "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTbtbK-F2rA0s.ttf", "700", "italic"),
      ])

      // 1. Generate QR Code — use verification URL or CertiGuard production URL
      const qrDataUrl = await QRCode.toDataURL(result.verificationUrl || "https://certiguardofficial.vercel.app", {
        margin: 2,
        width: 300,
        color: {
          dark: "#E2E8F0",
          light: "#00000000"
        }
      })

      const canvas = document.createElement("canvas")
      const W = 2000, H = 1414 // High-resolution A4 landscape
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext("2d")!

      // =====================================================================
      //  BACKGROUND
      // =====================================================================
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
      bgGrad.addColorStop(0, "#0B1120")
      bgGrad.addColorStop(0.5, "#0F172A")
      bgGrad.addColorStop(1, "#020617")
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, W, H)

      // Subtle dot grid
      ctx.fillStyle = "rgba(100, 116, 139, 0.06)"
      for (let x = 60; x < W; x += 40) {
        for (let y = 60; y < H; y += 40) {
          ctx.beginPath()
          ctx.arc(x, y, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Ambient glow orbs
      const drawOrb = (cx: number, cy: number, r: number, color: string) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        g.addColorStop(0, color)
        g.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = g
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
      }
      drawOrb(300, 200, 400, "rgba(14, 165, 233, 0.06)")
      drawOrb(W - 400, H - 300, 500, "rgba(99, 102, 241, 0.05)")
      drawOrb(W / 2, H / 2, 600, "rgba(6, 182, 212, 0.03)")

      // =====================================================================
      //  BORDER FRAME
      // =====================================================================
      const pad = 50
      ctx.strokeStyle = "rgba(148, 163, 184, 0.08)"
      ctx.lineWidth = 1
      ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2)
      // Inner border
      ctx.strokeStyle = "rgba(148, 163, 184, 0.04)"
      ctx.strokeRect(pad + 12, pad + 12, W - (pad + 12) * 2, H - (pad + 12) * 2)
      // Corner accents
      const cornerLen = 60
      const corners = [
        [pad, pad], [W - pad, pad], [pad, H - pad], [W - pad, H - pad]
      ]
      ctx.strokeStyle = "rgba(14, 165, 233, 0.3)"
      ctx.lineWidth = 2
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
      //  HEADER BAR (gradient accent line)
      // =====================================================================
      const headerBarGrad = ctx.createLinearGradient(100, 0, W - 100, 0)
      headerBarGrad.addColorStop(0, "rgba(14, 165, 233, 0)")
      headerBarGrad.addColorStop(0.2, "rgba(14, 165, 233, 0.6)")
      headerBarGrad.addColorStop(0.5, "rgba(6, 182, 212, 0.8)")
      headerBarGrad.addColorStop(0.8, "rgba(99, 102, 241, 0.6)")
      headerBarGrad.addColorStop(1, "rgba(99, 102, 241, 0)")
      ctx.fillStyle = headerBarGrad
      ctx.fillRect(100, 100, W - 200, 3)

      // =====================================================================
      //  LOGO & TITLE
      // =====================================================================
      // Shield icon
      ctx.save()
      const shieldX = 120, shieldY = 130
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
      shieldGrad.addColorStop(0, "#0EA5E9")
      shieldGrad.addColorStop(1, "#0369A1")
      ctx.fillStyle = shieldGrad
      ctx.fill()
      ctx.strokeStyle = "rgba(56, 189, 248, 0.5)"
      ctx.lineWidth = 2
      ctx.stroke()
      // Checkmark inside shield
      ctx.strokeStyle = "#FFFFFF"
      ctx.lineWidth = 5
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      ctx.moveTo(shieldX + 18, shieldY + 38)
      ctx.lineTo(shieldX + 30, shieldY + 50)
      ctx.lineTo(shieldX + 52, shieldY + 26)
      ctx.stroke()
      ctx.restore()

      // Title text
      ctx.textAlign = "left"
      ctx.fillStyle = "#F1F5F9"
      ctx.font = "700 44px 'Inter', 'Segoe UI', sans-serif"
      ctx.fillText("CERTIGUARD", 210, 172)
      ctx.fillStyle = "#64748B"
      ctx.font = "600 16px 'Inter', 'Segoe UI', sans-serif"
      ctx.letterSpacing = "6px"
      ctx.fillText("VERIFICATION REPORT", 215, 200)
      ctx.letterSpacing = "0px"

      // Status seal (top right)
      const statusColor = result.isValid ? "#22C55E" : "#EF4444"
      const statusText = result.isValid ? "VERIFIED" : "FAILED"
      ctx.save()
      ctx.textAlign = "center"
      const stampX = W - 200, stampY = 172
      // Outer ring
      ctx.beginPath()
      ctx.arc(stampX, stampY, 55, 0, Math.PI * 2)
      ctx.strokeStyle = statusColor
      ctx.lineWidth = 3
      ctx.stroke()
      // Inner ring dashed
      ctx.beginPath()
      ctx.arc(stampX, stampY, 45, 0, Math.PI * 2)
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = statusColor + "80"
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.setLineDash([])
      // Status text
      ctx.fillStyle = statusColor
      ctx.font = "700 16px 'Inter', 'Segoe UI', sans-serif"
      ctx.fillText(statusText, stampX, stampY + 6)
      ctx.restore()

      // =====================================================================
      //  DIVIDER
      // =====================================================================
      const divY1 = 240
      const divGrad1 = ctx.createLinearGradient(120, 0, W - 120, 0)
      divGrad1.addColorStop(0, "rgba(148, 163, 184, 0)")
      divGrad1.addColorStop(0.3, "rgba(148, 163, 184, 0.15)")
      divGrad1.addColorStop(0.7, "rgba(148, 163, 184, 0.15)")
      divGrad1.addColorStop(1, "rgba(148, 163, 184, 0)")
      ctx.fillStyle = divGrad1
      ctx.fillRect(120, divY1, W - 240, 1)

      // =====================================================================
      //  "THIS CERTIFIES THAT" + NAME
      // =====================================================================
      ctx.textAlign = "center"
      ctx.fillStyle = "#64748B"
      ctx.font = "600 18px 'Inter', 'Segoe UI', sans-serif"
      ctx.letterSpacing = "5px"
      ctx.fillText("THIS CERTIFIES THAT", W / 2, 310)
      ctx.letterSpacing = "0px"

      // Recipient Name — large, elegant serif
      ctx.fillStyle = "#F8FAFC"
      const nameText = result.name || "Verified Participant"
      // Scale font if name is too long
      let nameFontSize = 88
      ctx.font = `italic 700 ${nameFontSize}px 'Playfair Display', Georgia, serif`
      while (ctx.measureText(nameText).width > W - 300 && nameFontSize > 40) {
        nameFontSize -= 4
        ctx.font = `italic 700 ${nameFontSize}px 'Playfair Display', Georgia, serif`
      }
      ctx.fillText(nameText, W / 2, 420)

      // Underline decoration
      const nameWidth = Math.min(ctx.measureText(nameText).width + 80, W - 300)
      const ulGrad = ctx.createLinearGradient(W / 2 - nameWidth / 2, 0, W / 2 + nameWidth / 2, 0)
      ulGrad.addColorStop(0, "rgba(14, 165, 233, 0)")
      ulGrad.addColorStop(0.3, "rgba(14, 165, 233, 0.4)")
      ulGrad.addColorStop(0.5, "rgba(6, 182, 212, 0.6)")
      ulGrad.addColorStop(0.7, "rgba(14, 165, 233, 0.4)")
      ulGrad.addColorStop(1, "rgba(14, 165, 233, 0)")
      ctx.fillStyle = ulGrad
      ctx.fillRect(W / 2 - nameWidth / 2, 445, nameWidth, 2)

      // =====================================================================
      //  COURSE TITLE
      // =====================================================================
      ctx.fillStyle = "#94A3B8"
      ctx.font = "600 16px 'Inter', 'Segoe UI', sans-serif"
      ctx.letterSpacing = "3px"
      ctx.fillText("HAS SUCCESSFULLY COMPLETED", W / 2, 510)
      ctx.letterSpacing = "0px"

      ctx.fillStyle = "#E2E8F0"
      const courseText = result.course || "Certificate Course"
      let courseFontSize = 38
      ctx.font = `700 ${courseFontSize}px 'Inter', 'Segoe UI', sans-serif`
      while (ctx.measureText(courseText).width > W - 400 && courseFontSize > 20) {
        courseFontSize -= 2
        ctx.font = `700 ${courseFontSize}px 'Inter', 'Segoe UI', sans-serif`
      }
      ctx.fillText(courseText, W / 2, 570)

      // =====================================================================
      //  DETAILS GRID (4 columns)
      // =====================================================================
      ctx.textAlign = "left"
      const gridY = 660
      const gridH = 130
      // Semi-transparent card backgrounds
      const colWidth = (W - 280) / 4
      const gridStartX = 140
      const finalDate = result.issueDate && result.issueDate !== "N/A" ? result.issueDate : (result.date || "N/A")
      const gridItems = [
        { label: "PLATFORM", value: result.platform || "N/A", accent: "#0EA5E9" },
        { label: "ISSUE DATE", value: finalDate, accent: "#06B6D4" },
        { label: "TOTAL HOURS", value: result.totalHours || "N/A", accent: "#8B5CF6" },
        { label: "CERTIFICATE ID", value: result.certificateId || "N/A", accent: "#6366F1" },
      ]

      gridItems.forEach((item, i) => {
        const x = gridStartX + i * colWidth
        // Card background
        ctx.fillStyle = "rgba(15, 23, 42, 0.6)"
        ctx.beginPath()
        ctx.roundRect(x, gridY, colWidth - 20, gridH, 16)
        ctx.fill()
        ctx.strokeStyle = "rgba(148, 163, 184, 0.08)"
        ctx.lineWidth = 1
        ctx.stroke()
        // Top accent line
        ctx.fillStyle = item.accent
        ctx.fillRect(x + 20, gridY, colWidth - 60, 2)
        // Label
        ctx.fillStyle = "#64748B"
        ctx.font = "600 14px 'Inter', 'Segoe UI', sans-serif"
        ctx.letterSpacing = "2px"
        ctx.fillText(item.label, x + 20, gridY + 40)
        ctx.letterSpacing = "0px"
        // Value
        ctx.fillStyle = "#E2E8F0"
        let valFont = 24
        ctx.font = `700 ${valFont}px 'Inter', 'Segoe UI', sans-serif`
        // Shrink value text if needed
        while (ctx.measureText(item.value).width > colWidth - 50 && valFont > 14) {
          valFont -= 2
          ctx.font = `700 ${valFont}px 'Inter', 'Segoe UI', sans-serif`
        }
        ctx.fillText(item.value, x + 20, gridY + 80)
      })

      // =====================================================================
      //  STATUS BANNER
      // =====================================================================
      const bannerY = 840
      const bannerH = 70
      const bannerGrad = ctx.createLinearGradient(140, bannerY, W - 140, bannerY)
      if (result.isValid) {
        bannerGrad.addColorStop(0, "rgba(34, 197, 94, 0.08)")
        bannerGrad.addColorStop(0.5, "rgba(34, 197, 94, 0.15)")
        bannerGrad.addColorStop(1, "rgba(34, 197, 94, 0.08)")
      } else {
        bannerGrad.addColorStop(0, "rgba(239, 68, 68, 0.08)")
        bannerGrad.addColorStop(0.5, "rgba(239, 68, 68, 0.15)")
        bannerGrad.addColorStop(1, "rgba(239, 68, 68, 0.08)")
      }
      ctx.fillStyle = bannerGrad
      ctx.beginPath()
      ctx.roundRect(140, bannerY, W - 280, bannerH, 12)
      ctx.fill()
      ctx.strokeStyle = result.isValid ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.textAlign = "center"
      ctx.fillStyle = result.isValid ? "#22C55E" : "#EF4444"
      ctx.font = "700 28px 'Inter', 'Segoe UI', sans-serif"
      ctx.letterSpacing = "4px"
      ctx.fillText(result.isValid ? "✓  VERIFICATION STATUS: AUTHENTIC" : "✕  VERIFICATION STATUS: FAILED", W / 2, bannerY + 46)
      ctx.letterSpacing = "0px"

      // =====================================================================
      //  FOOTER: QR Code + Branding + Badge
      // =====================================================================
      const footerDivY = 960
      const footerDivGrad = ctx.createLinearGradient(120, 0, W - 120, 0)
      footerDivGrad.addColorStop(0, "rgba(148, 163, 184, 0)")
      footerDivGrad.addColorStop(0.3, "rgba(148, 163, 184, 0.1)")
      footerDivGrad.addColorStop(0.7, "rgba(148, 163, 184, 0.1)")
      footerDivGrad.addColorStop(1, "rgba(148, 163, 184, 0)")
      ctx.fillStyle = footerDivGrad
      ctx.fillRect(120, footerDivY, W - 240, 1)

      // QR Code (bottom left)
      const qrImg = new Image()
      qrImg.src = qrDataUrl
      await new Promise(resolve => qrImg.onload = resolve)
      const qrSize = 180
      const qrX = 160, qrY = 1000
      // QR border
      ctx.fillStyle = "rgba(15, 23, 42, 0.8)"
      ctx.beginPath()
      ctx.roundRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 60, 12)
      ctx.fill()
      ctx.strokeStyle = "rgba(148, 163, 184, 0.1)"
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
      // QR label
      ctx.textAlign = "center"
      ctx.fillStyle = "#475569"
      ctx.font = "600 12px 'Inter', 'Segoe UI', sans-serif"
      ctx.letterSpacing = "2px"
      ctx.fillText("SCAN TO VERIFY", qrX + qrSize / 2, qrY + qrSize + 30)
      ctx.letterSpacing = "0px"

      // Center: Verification URL text
      ctx.textAlign = "center"
      ctx.fillStyle = "#475569"
      ctx.font = "400 18px 'Inter', 'Segoe UI', sans-serif"
      ctx.fillText("Verify this certificate at", W / 2, 1060)
      ctx.fillStyle = "#0EA5E9"
      ctx.font = "600 20px 'Inter', 'Segoe UI', sans-serif"
      const displayUrl = result.verificationUrl || "certiguardofficial.vercel.app"
      // Truncate URL display if too long
      const truncatedUrl = displayUrl.length > 70 ? displayUrl.substring(0, 67) + "..." : displayUrl
      ctx.fillText(truncatedUrl, W / 2, 1095)

      // Timestamp
      ctx.fillStyle = "#334155"
      ctx.font = "400 14px 'Inter', 'Segoe UI', sans-serif"
      const now = new Date()
      ctx.fillText(`Report generated on ${now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} at ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`, W / 2, 1140)

      // Right side: "Secured by AI" badge
      const badgeW = 200, badgeH = 50
      const badgeX = W - 180 - badgeW / 2, badgeY2 = 1040
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)"
      ctx.beginPath()
      ctx.roundRect(badgeX, badgeY2, badgeW, badgeH, 10)
      ctx.fill()
      ctx.strokeStyle = "rgba(14, 165, 233, 0.3)"
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.fillStyle = "#0EA5E9"
      ctx.font = "700 16px 'Inter', 'Segoe UI', sans-serif"
      ctx.letterSpacing = "3px"
      ctx.fillText("SECURED BY AI", badgeX + badgeW / 2, badgeY2 + 32)
      ctx.letterSpacing = "0px"

      // Bottom bar
      const bottomBarGrad = ctx.createLinearGradient(100, 0, W - 100, 0)
      bottomBarGrad.addColorStop(0, "rgba(14, 165, 233, 0)")
      bottomBarGrad.addColorStop(0.2, "rgba(99, 102, 241, 0.4)")
      bottomBarGrad.addColorStop(0.5, "rgba(6, 182, 212, 0.6)")
      bottomBarGrad.addColorStop(0.8, "rgba(14, 165, 233, 0.4)")
      bottomBarGrad.addColorStop(1, "rgba(14, 165, 233, 0)")
      ctx.fillStyle = bottomBarGrad
      ctx.fillRect(100, H - 100, W - 200, 2)

      // Bottom text
      ctx.textAlign = "center"
      ctx.fillStyle = "#334155"
      ctx.font = "400 14px 'Inter', 'Segoe UI', sans-serif"
      ctx.fillText("This document is an automated verification report generated by CertiGuard AI — certiguardofficial.vercel.app", W / 2, H - 65)

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

      const fileName = `CertiGuard_Report_${result.name?.replace(/\s+/g, "_") || "Verification"}.pdf`
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
