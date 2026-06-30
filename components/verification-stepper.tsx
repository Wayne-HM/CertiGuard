"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { Upload, FileSearch, Globe, ShieldCheck, CheckCircle2, Cpu, Loader2 } from "lucide-react"
import { GlassCard, smoothSpring } from "@/components/ui/glass-container"

interface VerificationStep {
  id: number
  label: string
  description: string
  icon: React.ElementType
}

const steps: VerificationStep[] = [
  { id: 1, label: "Uploading", description: "Processing document", icon: Upload },
  { id: 2, label: "Extracting", description: "OCR text analysis", icon: FileSearch },
  { id: 3, label: "Platform", description: "Source detection", icon: Globe },
  { id: 4, label: "Verifying", description: "Database matching", icon: ShieldCheck },
  { id: 5, label: "Complete", description: "Analysis finished", icon: CheckCircle2 },
]

interface VerificationStepperProps {
  currentStep: number
  progress: number
}

const StepCard = memo(function StepCard({ 
  step, 
  index, 
  isActive, 
  isComplete 
}: { 
  step: VerificationStep
  index: number
  isActive: boolean
  isComplete: boolean 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.19, 1, 0.22, 1] }}
      className="relative"
    >
      {/* Connector line (desktop) */}
      {index < steps.length - 1 && (
        <div className="hidden sm:block absolute top-8 left-1/2 w-full h-px overflow-hidden z-0">
          <div className="relative w-full h-full bg-glass-border">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: isComplete ? 1 : 0 }}
              transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
              className="absolute inset-0 bg-white origin-left"
            />
          </div>
        </div>
      )}

      {/* Step Card */}
      <GlassCard
        className={`p-4 text-center z-10 transition-colors duration-300 ${isActive ? 'bg-surface-2' : ''}`}
        interactive={false}
      >
        {/* Active overlay pulse */}
        {isActive && (
          <div className="absolute inset-0 bg-white/5 pointer-events-none glowing-pulse" />
        )}
        
        {/* Icon */}
        <motion.div
          animate={isActive ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
          className={`
            relative inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 mx-auto
            ${isComplete ? "bg-white/10" : isActive ? "bg-white/20" : "bg-transparent border border-glass-border"}
          `}
        >
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-xl border border-white/40"
              animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          
          <step.icon
            className={`
              w-5 h-5 relative z-10 transition-colors duration-200
              ${isComplete ? "text-text-primary" : isActive ? "text-text-primary" : "text-text-secondary"}
            `}
          />
        </motion.div>

        {/* Label */}
        <h4 className={`
          font-semibold mb-1 text-xs uppercase tracking-wider transition-colors duration-200
          ${isComplete ? "text-text-primary" : isActive ? "text-text-primary" : "text-text-secondary"}
        `}>
          {step.label}
        </h4>

        {/* Description - Terminal style */}
        <p className="text-[10px] text-text-secondary hidden sm:block terminal-text opacity-70">
          {isActive ? "> " : ""}{step.description}
          {isActive && <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity }}>_</motion.span>}
        </p>

        {/* Complete checkmark */}
        {isComplete && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={smoothSpring}
            className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          >
            <CheckCircle2 className="w-3 h-3 text-black" />
          </motion.div>
        )}
      </GlassCard>
    </motion.div>
  )
})

export function VerificationStepper({ currentStep, progress }: VerificationStepperProps) {
  return (
    <section className="relative py-16 px-4 z-10">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={smoothSpring}
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl liquid-glass mb-4 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <Cpu className="w-6 h-6 text-text-primary" />
          </motion.div>
          
          <h2 className="text-2xl sm:text-3xl font-semibold mb-2 text-text-primary tracking-tight">
            Security Analysis Protocol
          </h2>
          <p className="text-sm text-text-secondary terminal-text tracking-widest uppercase">
            &gt; Initializing neural verification engine...
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
          className="mb-12"
        >
          <div className="relative h-2 bg-surface-1 rounded-full overflow-hidden border border-glass-border">
            {/* Progress fill */}
            <motion.div 
              className="absolute top-0 left-0 h-full rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
          
          <div className="flex justify-between mt-4">
            <span className="text-xs text-text-secondary terminal-text uppercase tracking-widest flex items-center gap-1">
              {progress < 100 ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processing chunk {(progress / 10).toFixed(0)}/10...
                </>
              ) : (
                "Analysis complete"
              )}
            </span>
            <motion.span 
              className="text-xs font-bold text-text-primary terminal-text"
              key={progress}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.15 }}
            >
              {progress}%
            </motion.span>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {steps.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              index={index}
              isActive={currentStep === step.id}
              isComplete={currentStep > step.id}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
