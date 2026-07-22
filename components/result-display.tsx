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
      const W = 1200, H = 1600 
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext("2d")!

      const loadFont = async (family: string, url: string, weight: string, style = "normal") => {
        const font = new FontFace(family, `url(${url})`, { weight, style })
        await font.load()
        document.fonts.add(font)
      }


      // =====================================================================
      //  BACKGROUND
      // =====================================================================
      ctx.fillStyle = "#000000" // Match dark page background
      ctx.fillRect(0, 0, W, H)

      // Ambient glows
      const drawOrb = (cx: number, cy: number, r: number, color: string) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        g.addColorStop(0, color)
        g.addColorStop(1, "rgba(0, 0, 0, 0)")
        ctx.fillStyle = g
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
      }
      drawOrb(W / 2, 0, 800, "rgba(34, 211, 238, 0.08)")
      drawOrb(W / 2, H, 800, "rgba(79, 70, 229, 0.08)")

      // =====================================================================
      //  HEADER (CertiGuard Text)
      // =====================================================================
      ctx.textAlign = "left"
      ctx.fillStyle = "#ffffff"
      ctx.font = "800 28px 'Inter', sans-serif"
      ctx.fillText("CERTIGUARD", 80, 80)
      
      // Small shield next to text
      ctx.beginPath()
      ctx.moveTo(50, 60)
      ctx.lineTo(60, 65)
      ctx.lineTo(60, 75)
      ctx.lineTo(50, 82)
      ctx.lineTo(40, 75)
      ctx.lineTo(40, 65)
      ctx.closePath()
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.stroke()

      // =====================================================================
      //  MAIN VERTICAL CARD
      // =====================================================================
      const cardX = 80
      const cardY = 120
      const cardW = W - 160
      const cardH = H - 200
      
      // Card background
      ctx.fillStyle = "#151923" // surface-1
      ctx.beginPath()
      ctx.roundRect(cardX, cardY, cardW, cardH, 32)
      ctx.fill()
      
      // Glass streak
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(cardX, cardY, cardW, cardH, 32)
      ctx.clip()
      const streakGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH)
      streakGrad.addColorStop(0, "rgba(255,255,255,0.06)")
      streakGrad.addColorStop(0.3, "rgba(255,255,255,0.01)")
      streakGrad.addColorStop(0.5, "rgba(255,255,255,0)")
      ctx.fillStyle = streakGrad
      ctx.fill()
      ctx.restore()

      // Card border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"
      ctx.lineWidth = 2
      ctx.stroke()
      
      // Status glow around card
      const statusColor = result.isValid ? "#22c55e" : "#ef4444"
      const statusColorRgba = result.isValid ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)"
      
      ctx.shadowColor = statusColor
      ctx.shadowBlur = 40
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      ctx.strokeStyle = statusColorRgba
      ctx.stroke()
      ctx.shadowBlur = 0 // reset

      // =====================================================================
      //  STATUS ICON & TEXT
      // =====================================================================
      const iconY = cardY + 140
      ctx.beginPath()
      ctx.arc(W / 2, iconY, 50, 0, Math.PI * 2)
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 8
      ctx.stroke()
      
      if (result.isValid) {
        // Checkmark
        ctx.beginPath()
        ctx.moveTo(W / 2 - 15, iconY)
        ctx.lineTo(W / 2 - 5, iconY + 12)
        ctx.lineTo(W / 2 + 20, iconY - 15)
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 8
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.stroke()
        
        // Sparkle
        ctx.beginPath()
        ctx.moveTo(W / 2 + 40, iconY - 40)
        ctx.lineTo(W / 2 + 45, iconY - 55)
        ctx.lineTo(W / 2 + 60, iconY - 60)
        ctx.lineTo(W / 2 + 45, iconY - 65)
        ctx.lineTo(W / 2 + 40, iconY - 80)
        ctx.lineTo(W / 2 + 35, iconY - 65)
        ctx.lineTo(W / 2 + 20, iconY - 60)
        ctx.lineTo(W / 2 + 35, iconY - 55)
        ctx.closePath()
        ctx.fillStyle = "#ffffff"
        ctx.fill()
      } else {
        // X mark
        ctx.beginPath()
        ctx.moveTo(W / 2 - 20, iconY - 20)
        ctx.lineTo(W / 2 + 20, iconY + 20)
        ctx.moveTo(W / 2 + 20, iconY - 20)
        ctx.lineTo(W / 2 - 20, iconY + 20)
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 8
        ctx.lineCap = "round"
        ctx.stroke()
      }
      
      // Text
      ctx.textAlign = "center"
      ctx.fillStyle = "#ffffff"
      ctx.font = "800 48px 'Inter', sans-serif"
      ctx.fillText(result.isValid ? "Authentic Certificate" : "Verification Failed", W / 2, iconY + 120)
      
      ctx.fillStyle = "#94a3b8"
      ctx.font = "500 22px 'Inter', sans-serif"
      ctx.fillText(result.isValid ? "This certificate has been verified via our neural engine." : "We could not verify the authenticity of this document.", W / 2, iconY + 160)

      // =====================================================================
      //  DATA ROWS
      // =====================================================================
      ctx.textAlign = "left"
      ctx.fillStyle = "#cbd5e1"
      ctx.font = "700 14px 'Inter', sans-serif"
      ctx.letterSpacing = "2px"
      ctx.fillText("> EXTRACTED_DATA_NODES", cardX + 80, iconY + 260)
      ctx.letterSpacing = "0px"
      
      const finalDate = result.issueDate && result.issueDate !== "N/A" ? result.issueDate : (result.date || "N/A")
      const detailItems = [
        { label: "NAME", value: result.name || "N/A", drawIcon: (cx: number, cy: number) => {
          ctx.beginPath(); ctx.arc(cx, cy - 6, 8, 0, Math.PI*2); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx, cy + 12, 12, Math.PI, 0); ctx.stroke();
        }},
        { label: "COURSE", value: result.course || "N/A", drawIcon: (cx: number, cy: number) => {
          ctx.beginPath(); ctx.rect(cx - 10, cy - 8, 10, 16); ctx.rect(cx, cy - 8, 10, 16); ctx.stroke();
        }},
        { label: "PLATFORM", value: result.platform || "N/A", drawIcon: (cx: number, cy: number) => {
          ctx.beginPath(); ctx.rect(cx - 8, cy - 10, 16, 20); ctx.stroke();
        }},
        { label: "ISSUE DATE", value: finalDate, drawIcon: (cx: number, cy: number) => {
          ctx.beginPath(); ctx.rect(cx - 10, cy - 8, 20, 18); ctx.moveTo(cx - 10, cy - 2); ctx.lineTo(cx + 10, cy - 2); ctx.stroke();
        }},
        { label: "TOTAL HOURS", value: result.totalHours || "N/A", drawIcon: (cx: number, cy: number) => {
          ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI*2); ctx.moveTo(cx, cy - 4); ctx.lineTo(cx, cy); ctx.lineTo(cx + 3, cy + 3); ctx.stroke();
        }},
        { label: "CERTIFICATE ID", value: result.certificateId || "N/A", drawIcon: (cx: number, cy: number) => {
          ctx.beginPath(); ctx.rect(cx - 12, cy - 6, 24, 12); ctx.arc(cx - 12, cy, 6, Math.PI/2, Math.PI*1.5); ctx.stroke();
        }}
      ]
      
      let currentY = iconY + 290
      
      detailItems.forEach(item => {
        // Row background
        ctx.fillStyle = "#0f121b" 
        ctx.beginPath()
        ctx.roundRect(cardX + 80, currentY, cardW - 160, 100, 16)
        ctx.fill()
        ctx.strokeStyle = "rgba(255, 255, 255, 0.03)"
        ctx.lineWidth = 1
        ctx.stroke()
        
        // Icon box
        ctx.fillStyle = "#151923"
        ctx.beginPath()
        ctx.roundRect(cardX + 100, currentY + 20, 60, 60, 12)
        ctx.fill()
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"
        ctx.stroke()
        
        // Draw icon
        ctx.strokeStyle = "#94a3b8"
        ctx.lineWidth = 2
        item.drawIcon(cardX + 130, currentY + 50)
        
        // Label
        ctx.fillStyle = "#64748b"
        ctx.font = "700 12px 'Inter', sans-serif"
        ctx.letterSpacing = "2px"
        ctx.fillText(item.label, cardX + 190, currentY + 44)
        ctx.letterSpacing = "0px"
        
        // Value
        ctx.fillStyle = "#f8fafc"
        let valFont = 24
        ctx.font = `600 ${valFont}px 'Inter', sans-serif`
        while (ctx.measureText(item.value).width > cardW - 380 && valFont > 14) {
          valFont -= 2
          ctx.font = `600 ${valFont}px 'Inter', sans-serif`
        }
        ctx.fillText(item.value, cardX + 190, currentY + 76)
        
        currentY += 112
      })

      // =====================================================================
      //  QR CODE & SOURCE LINK (Bottom)
      // =====================================================================
      const qrY = currentY + 10
      const qrImg = new Image()
      qrImg.src = qrDataUrl
      await new Promise(resolve => qrImg.onload = resolve)
      
      // Link Box container
      ctx.fillStyle = "#0f121b"
      ctx.beginPath()
      ctx.roundRect(cardX + 80, qrY, cardW - 160, 120, 16)
      ctx.fill()
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)"
      ctx.stroke()
      
      // QR Box
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.roundRect(cardX + 100, qrY + 16, 88, 88, 8)
      ctx.fill()
      ctx.drawImage(qrImg, cardX + 104, qrY + 20, 80, 80)
      
      await Promise.all([
        loadFont("Inter", "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf", "400"),
        loadFont("Inter", "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf", "500"),
        loadFont("Inter", "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf", "600"),
        loadFont("Inter", "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf", "700"),
        loadFont("Inter", "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuDyYMZg.ttf", "800"),
      ])
      
      // Source Link Info
      ctx.fillStyle = "#64748b"
      ctx.font = "600 12px 'Inter', sans-serif"
      ctx.letterSpacing = "2px"
      ctx.fillText("SOURCE LINK", cardX + 220, qrY + 54)
      ctx.letterSpacing = "0px"
      
      ctx.fillStyle = "#38bdf8"
      ctx.font = "500 18px 'Inter', sans-serif"
      const displayUrl = result.verificationUrl || "certiguardofficial.vercel.app"
      const truncatedUrl = displayUrl.length > 55 ? displayUrl.substring(0, 52) + "..." : displayUrl
      ctx.fillText(truncatedUrl, cardX + 220, qrY + 86)
      
      // Secured by AI Badge
      ctx.fillStyle = "#151923"
      ctx.beginPath()
      ctx.roundRect(cardX + cardW - 220, qrY + 35, 120, 50, 12)
      ctx.fill()
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"
      ctx.stroke()
      ctx.textAlign = "center"
      ctx.fillStyle = "#64748b"
      ctx.font = "600 12px 'Inter', sans-serif"
      ctx.fillText("SECURED BY AI", cardX + cardW - 160, qrY + 65)

      // Footer
      ctx.fillStyle = "#334155"
      ctx.font = "400 12px 'Inter', sans-serif"
      const now = new Date()
      ctx.fillText(`Automated Verification Record — ${now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} at ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`, W / 2, H - 30)

      // =====================================================================
      //  EXPORT TO PDF
      // =====================================================================
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      })

      const imgData = canvas.toDataURL("image/jpeg", 0.95)
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297)
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
