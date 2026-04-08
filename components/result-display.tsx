"use client"

import { useState, memo, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, User, BookOpen, Building2, ExternalLink, Download, RotateCcw, Sparkles, AlertTriangle, Terminal, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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
        <p className="font-medium text-foreground truncate">{value}</p>
      </div>
    </motion.div>
  )
})

export function ResultDisplay({ result, onVerifyAnother }: ResultDisplayProps) {
  const [showLog, setShowLog] = useState(false)
  const isValid = result.isValid

  const details = useMemo(() => [
    { icon: User, label: "Name", value: result.name },
    { icon: BookOpen, label: "Course", value: result.course },
    { icon: Building2, label: "Platform", value: result.platform },
    { icon: Clock, label: "Total Hours", value: result.totalHours || "N/A" },
  ], [result.name, result.course, result.platform, result.totalHours])

  const downloadReport = () => {
    const canvas = document.createElement("canvas")
    const W = 900, H = 560
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext("2d")!

    // --- Background ---
    const bgGrad = ctx.createLinearGradient(0, 0, W, H)
    bgGrad.addColorStop(0, "#0a0e1a")
    bgGrad.addColorStop(1, "#0d1224")
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // Subtle grid pattern
    ctx.strokeStyle = "rgba(56, 189, 248, 0.03)"
    ctx.lineWidth = 0.5
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

    // --- AI Score Badge (top-left) ---
    ctx.fillStyle = "rgba(16, 185, 129, 0.15)"
    ctx.beginPath(); ctx.roundRect(20, 18, 110, 52, 14); ctx.fill()
    ctx.strokeStyle = "rgba(16, 185, 129, 0.5)"
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.roundRect(20, 18, 110, 52, 14); ctx.stroke()
    // AI Score icon
    ctx.fillStyle = "#10b981"
    ctx.beginPath(); ctx.arc(46, 44, 14, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = "#0a0e1a"; ctx.font = "bold 11px 'Segoe UI'"; ctx.fillText("✓", 41, 48)
    ctx.fillStyle = "#94a3b8"; ctx.font = "bold 10px 'Segoe UI'"; ctx.fillText("AI SCORE", 66, 38)
    ctx.fillStyle = "#10b981"; ctx.font = "bold 16px 'Segoe UI'"
    ctx.fillText(isValid ? "100/100" : "0/100", 66, 56)

    // --- Main Card ---
    const cx = 120, cy = 90, cw = W - 160, ch = H - 130
    // Card glow
    ctx.shadowColor = isValid ? "rgba(6, 182, 212, 0.25)" : "rgba(239, 68, 68, 0.25)"
    ctx.shadowBlur = 30
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)"
    ctx.beginPath(); ctx.roundRect(cx, cy, cw, ch, 20); ctx.fill()
    ctx.shadowBlur = 0
    // Card border
    const borderGrad = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch)
    borderGrad.addColorStop(0, isValid ? "rgba(6, 182, 212, 0.6)" : "rgba(239, 68, 68, 0.6)")
    borderGrad.addColorStop(0.5, isValid ? "rgba(139, 92, 246, 0.3)" : "rgba(239, 68, 68, 0.3)")
    borderGrad.addColorStop(1, isValid ? "rgba(6, 182, 212, 0.6)" : "rgba(239, 68, 68, 0.6)")
    ctx.strokeStyle = borderGrad; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.roundRect(cx, cy, cw, ch, 20); ctx.stroke()

    // --- Shield Icon ---
    ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
    ctx.beginPath(); ctx.roundRect(cx + 30, cy + 28, 52, 52, 14); ctx.fill()
    ctx.fillStyle = "#06b6d4"; ctx.font = "28px 'Segoe UI'"; ctx.fillText("🛡️", cx + 40, cy + 63)

    // --- Header Text ---
    ctx.fillStyle = "#f1f5f9"; ctx.font = "bold 26px 'Segoe UI'"
    ctx.fillText("CERTIGUARD OFFICIAL", cx + 96, cy + 52)
    ctx.fillStyle = "#06b6d4"; ctx.font = "12px 'Segoe UI'"
    ctx.fillText("VERIFICATION CERTIFICATE", cx + 98, cy + 70)

    // --- Decorative GLOBAL-ID (top-right of card) ---
    ctx.fillStyle = "rgba(139, 92, 246, 0.15)"
    ctx.beginPath(); ctx.roundRect(cx + cw - 160, cy + 28, 130, 32, 8); ctx.fill()
    ctx.strokeStyle = "rgba(139, 92, 246, 0.4)"; ctx.lineWidth = 1
    ctx.beginPath(); ctx.roundRect(cx + cw - 160, cy + 28, 130, 32, 8); ctx.stroke()
    ctx.fillStyle = "#a78bfa"; ctx.font = "bold 10px 'Segoe UI'"
    ctx.fillText("GLOBAL-ID-882", cx + cw - 135, cy + 48)

    // Divider
    ctx.strokeStyle = "rgba(56, 189, 248, 0.12)"; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(cx + 30, cy + 100); ctx.lineTo(cx + cw - 30, cy + 100); ctx.stroke()

    // --- Presented To ---
    ctx.fillStyle = "#64748b"; ctx.font = "bold 11px 'Segoe UI'"
    ctx.fillText("PRESENTED TO", cx + 35, cy + 128)
    ctx.fillStyle = "#f8fafc"; ctx.font = "bold 32px Georgia, serif"
    ctx.fillText(result.name || "Alex Sterling", cx + 35, cy + 170)

    // --- Course / Specialization ---
    ctx.fillStyle = "#cbd5e1"; ctx.font = "18px 'Segoe UI'"
    ctx.fillText(result.course || "Advanced AI Specialization", cx + 35, cy + 205)

    // --- Verification Status ---
    ctx.fillStyle = isValid ? "#10b981" : "#ef4444"; ctx.font = "bold 15px 'Segoe UI'"
    ctx.fillText(`Verification Status: ${isValid ? "AUTHENTIC" : "FRAUDULENT"}`, cx + 35, cy + 245)

    // --- Platform badge (right side) ---
    ctx.fillStyle = isValid ? "rgba(6, 182, 212, 0.2)" : "rgba(239, 68, 68, 0.2)"
    ctx.beginPath(); ctx.arc(cx + cw - 65, cy + 185, 35, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = isValid ? "rgba(6, 182, 212, 0.5)" : "rgba(239, 68, 68, 0.5)"
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(cx + cw - 65, cy + 185, 35, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = isValid ? "#06b6d4" : "#ef4444"; ctx.font = "28px 'Segoe UI'"
    ctx.fillText("🎓", cx + cw - 80, cy + 194)

    // --- Bottom Bar ---
    ctx.strokeStyle = "rgba(56, 189, 248, 0.08)"; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(cx + 30, cy + ch - 80); ctx.lineTo(cx + cw - 30, cy + ch - 80); ctx.stroke()

    // IDs
    ctx.fillStyle = "#475569"; ctx.font = "12px 'Segoe UI'"
    ctx.fillText(`⊕ ID: 2991-X`, cx + 35, cy + ch - 52)
    ctx.fillText(`♟ ${result.platform || "Infosys"}`, cx + 180, cy + ch - 52)

    // SECURED BY AI badge
    ctx.fillStyle = "rgba(139, 92, 246, 0.15)"
    ctx.beginPath(); ctx.roundRect(cx + cw - 180, cy + ch - 70, 145, 30, 8); ctx.fill()
    ctx.strokeStyle = "rgba(139, 92, 246, 0.5)"; ctx.lineWidth = 1
    ctx.beginPath(); ctx.roundRect(cx + cw - 180, cy + ch - 70, 145, 30, 8); ctx.stroke()
    ctx.fillStyle = "#a78bfa"; ctx.font = "bold 11px 'Segoe UI'"
    ctx.fillText("SECURED BY AI", cx + cw - 155, cy + ch - 50)

    // --- Date & URL footer ---
    ctx.fillStyle = "#334155"; ctx.font = "10px 'Segoe UI'"
    ctx.fillText(`Verified on: ${result.issueDate}  |  Report ID: ${result.certificateId || "CERT-182203"}`, cx + 35, cy + ch - 18)

    // --- Download ---
    const link = document.createElement("a")
    link.download = `CertiGuard_Report_${result.name?.replace(/\s+/g, "_") || "certificate"}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
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
              ${isValid ? "border-success/50" : "border-destructive/50"}
            `}
            style={{
              boxShadow: isValid 
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
                  {isValid ? (
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
                  <h2 className={`text-2xl sm:text-3xl font-bold mt-6 mb-2 ${isValid ? "text-success" : "text-destructive"}`}>
                    {isValid ? "Verification Status: AUTHENTIC" : "Fake Certificate Detected"}
                  </h2>
                  <p className="text-muted-foreground">
                    {isValid ? "This certificate is authentic and secured by AI" : "This certificate could not be verified"}
                  </p>
                </motion.div>
              </div>

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
                      className="w-full relative overflow-hidden bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white shadow-lg shadow-neon-blue/20 gpu-accelerate"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" />
                        Download Report
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
            <div className={`absolute top-0 left-0 w-28 h-28 ${isValid ? "bg-success/8" : "bg-destructive/8"} blur-2xl pointer-events-none`} />
            <div className={`absolute bottom-0 right-0 w-28 h-28 ${isValid ? "bg-success/8" : "bg-destructive/8"} blur-2xl pointer-events-none`} />
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
