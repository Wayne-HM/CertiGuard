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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      {/* Connector line (desktop) */}
      {index < steps.length - 1 && (
        <div className="hidden sm:block absolute top-10 left-1/2 w-full h-px overflow-hidden">
          <div className="relative w-full h-full bg-white/5">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: isComplete ? 1 : 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 bg-gradient-to-r from-primary to-accent origin-left gpu-accelerate"
            />
          </div>
        </div>
      )}

      {/* Step Card */}
      <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        transition={quickSpring}
        className={`
          relative glass-strong rounded-2xl p-6 text-center overflow-hidden gpu-accelerate diamond-border
          transition-all duration-500
          ${isActive ? "border-primary shadow-[0_0_30px_rgba(124,255,160,0.1)]" : "border-glass-border"}
          ${isComplete ? "border-primary/40 bg-primary/[0.03]" : ""}
        `}
      >
        <div className="absolute inset-0 noise-surface opacity-[0.03] pointer-events-none" />
        
        {/* Active scan line effect */}
        {isActive && (
          <motion.div 
            className="absolute inset-x-0 h-[2px] bg-primary/20 blur-[1px] z-20 pointer-events-none"
            animate={{ top: ["-10%", "110%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        )}
        
        {/* Icon */}
        <motion.div
          animate={isActive ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
          transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
          className={`
            relative inline-flex items-center justify-center w-16 h-16 rounded-[1.25rem] mb-5 mx-auto gpu-accelerate diamond-border
            ${isComplete ? "bg-primary/20" : isActive ? "bg-primary/25 shadow-2xl shadow-primary/20" : "bg-white/5"}
          `}
        >
          {/* Pulse ring for active */}
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-[1.25rem] border-2 border-primary/50"
              animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          
          <step.icon
            className={`
              w-8 h-8 relative z-10 transition-all duration-500
              ${isComplete ? "text-primary scale-90" : isActive ? "text-primary scale-110" : "text-muted-foreground/60"}
            `}
          />
        </motion.div>

        {/* Label */}
        <h4 className={`
          font-black mb-1.5 text-sm tracking-tighter transition-colors duration-500 font-heading
          ${isComplete ? "text-primary italic" : isActive ? "text-foreground" : "text-muted-foreground/50"}
        `}>
          {step.label}
        </h4>

        {/* Description */}
        <p className="text-[9px] text-muted-foreground hidden sm:block uppercase tracking-[0.2em] font-black opacity-40 group-hover:opacity-80 transition-opacity">
          {step.description}
        </p>

        {/* Complete checkmark transition */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-lg flex items-center justify-center shadow-2xl border border-primary-foreground/20"
            >
              <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
})

export function VerificationStepper({ currentStep, progress }: VerificationStepperProps) {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Background Decorative */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl pointer-events-none opacity-20 blur-[100px] bg-primary/10 rounded-full" />

      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={quickSpring}
            className="inline-flex items-center justify-center w-20 h-20 rounded-[1.5rem] bg-primary/10 mb-8 diamond-border"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="gpu-accelerate"
            >
              <Cpu className="w-10 h-10 text-primary" />
            </motion.div>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter font-heading">
            <span className="bg-gradient-to-br from-primary via-accent to-emerald-400 bg-clip-text text-transparent italic glow-text pb-1">
              Neural Processing Core
            </span>
          </h2>
          <p className="text-muted-foreground/80 text-lg max-w-md mx-auto font-medium">
            Active forensic screening across multi-chain credential networks.
          </p>
        </motion.div>

        {/* Progress Rail */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20"
        >
          <div className="relative h-6 bg-white/5 rounded-2xl overflow-hidden shadow-inner border border-white/5">
            {/* Energy Rail Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />
            
            {/* Progress Fill (Liquid style) */}
            <motion.div 
              className="absolute top-0 left-0 h-full rounded-2xl bg-gradient-to-r from-primary via-accent to-primary background-animate gpu-accelerate"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ backgroundSize: '200% 100%' }}
            />
            
            {/* Lead Glow */}
            <motion.div 
              className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent blur-xl pointer-events-none"
              animate={{ left: `calc(${progress}% - 40px)` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            
            {/* Digital Tracking Line */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(90deg, transparent 96%, var(--primary) 96%)', backgroundSize: '20px 100%' }} />
          </div>
          
          <div className="flex justify-between mt-6 px-1">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">
                SCALING FORENSIC ANALYSIS...
              </span>
            </div>
            <motion.div 
              className="flex items-center gap-2"
              key={progress}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <span className="text-xs font-black text-primary tracking-widest font-heading">{progress}%</span>
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">REAL-TIME SYNC</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
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

