"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { Upload, FileSearch, Globe, ShieldCheck, CheckCircle2, Cpu } from "lucide-react"

interface VerificationStep {
  id: number
  label: string
  description: string
  icon: React.ElementType
}

const steps: VerificationStep[] = [
  { id: 1, label: "Uploading", description: "Processing your certificate", icon: Upload },
  { id: 2, label: "Extracting Text", description: "OCR analysis in progress", icon: FileSearch },
  { id: 3, label: "Detecting Platform", description: "Identifying certificate source", icon: Globe },
  { id: 4, label: "Verifying", description: "Cross-referencing with database", icon: ShieldCheck },
  { id: 5, label: "Complete", description: "Verification finished", icon: CheckCircle2 },
]

// Optimized spring config
const quickSpring = { stiffness: 300, damping: 30, mass: 0.8 }
const smoothTransition = { duration: 0.25, ease: [0.4, 0, 0.2, 1] }

interface VerificationStepperProps {
  currentStep: number
  progress: number
}

// Memoized step card for performance
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
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.4, 0, 0.2, 1] }}
      className="relative"
    >
      {/* Connector line (desktop) */}
      {index < steps.length - 1 && (
        <div className="hidden sm:block absolute top-8 left-1/2 w-full h-0.5 overflow-hidden">
          <div className="relative w-full h-full bg-border/50">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: isComplete ? 1 : 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-cyan origin-left gpu-accelerate"
            />
          </div>
        </div>
      )}

      {/* Step Card */}
      <motion.div
        whileHover={{ scale: 1.02, y: -3 }}
        transition={quickSpring}
        className={`
          relative glass-card rounded-xl p-4 text-center overflow-hidden gpu-accelerate
          transition-colors duration-200
          ${isActive ? "border-neon-blue/50" : "border-transparent"}
          ${isComplete ? "border-success/30" : ""}
        `}
        style={{ 
          borderWidth: 1, 
          borderStyle: "solid",
          boxShadow: isActive ? "0 0 20px oklch(0.7 0.2 220 / 0.15)" : "none"
        }}
      >
        {/* Active overlay */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-b from-neon-blue/8 to-transparent pointer-events-none animate-glow-pulse" />
        )}
        
        {/* Icon */}
        <motion.div
          animate={isActive ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 1.2, repeat: isActive ? Infinity : 0 }}
          className={`
            relative inline-flex items-center justify-center w-14 h-14 rounded-xl mb-3 mx-auto gpu-accelerate
            ${isComplete ? "bg-success/20" : isActive ? "bg-neon-blue/20" : "bg-secondary/50"}
          `}
        >
          {/* Pulse ring for active */}
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-neon-blue/40"
              animate={{ scale: [1, 1.25], opacity: [0.5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
          
          <step.icon
            className={`
              w-7 h-7 relative z-10 transition-colors duration-200
              ${isComplete ? "text-success" : isActive ? "text-neon-blue" : "text-muted-foreground"}
            `}
          />
        </motion.div>

        {/* Label */}
        <h4 className={`
          font-semibold mb-1 text-sm transition-colors duration-200
          ${isComplete ? "text-success" : isActive ? "text-foreground" : "text-muted-foreground"}
        `}>
          {step.label}
        </h4>

        {/* Description */}
        <p className="text-xs text-muted-foreground hidden sm:block">
          {step.description}
        </p>

        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="active-step-indicator"
            className="absolute -bottom-px left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-gradient-to-r from-neon-blue via-neon-cyan to-neon-purple rounded-full"
            transition={smoothTransition}
          />
        )}

        {/* Complete checkmark */}
        {isComplete && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={quickSpring}
            className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-success rounded-full flex items-center justify-center shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
})

export function VerificationStepper({ currentStep, progress }: VerificationStepperProps) {
  return (
    <section className="relative py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={quickSpring}
            className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-neon-cyan/10 mb-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="gpu-accelerate"
            >
              <Cpu className="w-7 h-7 text-neon-cyan" />
            </motion.div>
          </motion.div>
          
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-neon-cyan to-neon-blue bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_linear_infinite]">
              Verification Progress
            </span>
          </h2>
          <p className="text-muted-foreground">
            AI-powered analysis in progress
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="mb-12"
        >
          <div className="relative h-3 bg-secondary/50 rounded-full overflow-hidden glass">
            {/* Background shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            
            {/* Progress fill */}
            <motion.div 
              className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-neon-blue via-neon-cyan to-neon-purple gpu-accelerate"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
            
            {/* Glow at progress end */}
            <motion.div 
              className="absolute top-0 h-full w-6 rounded-full bg-white/30 blur-sm"
              animate={{ left: `calc(${progress}% - 12px)` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
            
            {/* Pulse dot */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-neon-cyan"
              animate={{ 
                left: `calc(${progress}% - 6px)`,
                scale: [1, 1.3, 1],
                opacity: [1, 0.6, 1]
              }}
              transition={{ 
                left: { duration: 0.35, ease: "easeOut" },
                scale: { duration: 0.8, repeat: Infinity },
                opacity: { duration: 0.8, repeat: Infinity }
              }}
            />
          </div>
          
          <div className="flex justify-between mt-3">
            <span className="text-sm text-muted-foreground animate-text-glow-pulse">
              Processing...
            </span>
            <motion.span 
              className="text-sm font-medium text-neon-cyan"
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
