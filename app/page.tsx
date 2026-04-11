"use client"

import { useState, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { AnimatedBackground } from "@/components/animated-background"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { UploadSection } from "@/components/upload-section"
import { VerificationStepper } from "@/components/verification-stepper"
import { PlatformsSection } from "@/components/platforms-section"
import { FloatingAssistant } from "@/components/floating-assistant"
import { Footer } from "@/components/footer"

const ResultDisplay = dynamic(
  () => import("@/components/result-display").then((mod) => mod.ResultDisplay),
  { ssr: false }
)

type VerificationResult = any
type VerificationState = "idle" | "verifying" | "complete"

export default function Home() {
  const [verificationState, setVerificationState] = useState<VerificationState>("idle")
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<VerificationResult | null>(null)

  const handleUpload = useCallback(async (file: File, platform: string = "auto") => {
    setVerificationState("verifying")
    setCurrentStep(1)
    setProgress(10)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) return prev + 2;
        if (prev < 60) return prev + 1;
        if (prev < 95) return prev + 0.5;
        return prev;
      });
      
      setProgress(p => {
        if (p > 20) setCurrentStep(2);
        if (p > 40) setCurrentStep(3);
        if (p > 60) setCurrentStep(4);
        if (p > 80) setCurrentStep(5);
        return p;
      });
    }, 200);

    try {
      const formData = new FormData()
      formData.append("certificate", file)
      formData.append("platform", platform)

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://certiguard-ksm9.onrender.com"
      const response = await fetch(`${API_URL}/verify`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error(`Server responded with ${response.status}`)

      const data = await response.json()
      clearInterval(interval)
      setProgress(100)
      setCurrentStep(5)
      
      setTimeout(() => {
        setResult(data)
        setVerificationState("complete")
      }, 800)

    } catch (error) {
      clearInterval(interval)
      setResult({
        isValid: false,
        name: "Verification Error",
        course: "Connection Protocol Failed",
        platform: "NULL",
        verificationUrl: "",
        issueDate: "N/A",
        certificateId: "ERROR_NODE",
      })
      setVerificationState("complete")
    }
  }, [])

  const handleVerifyAnother = useCallback(() => {
    setVerificationState("idle")
    setCurrentStep(0)
    setProgress(0)
    setResult(null)
  }, [])

  useEffect(() => {
    if (verificationState === "verifying") {
      const element = document.getElementById("verify-anchor")
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
  }, [verificationState])

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <AnimatedBackground />

      <div className="relative z-10 flex flex-col">
        <Navbar />

        <AnimatePresence mode="wait">
          {verificationState === "idle" && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <HeroSection />
            </motion.div>
          )}
        </AnimatePresence>

        <div id="verify-anchor" className="relative scroll-mt-24">
          <AnimatePresence mode="wait">
            {verificationState !== "complete" ? (
              <motion.div
                key="verifying-module"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <UploadSection 
                  onUpload={handleUpload} 
                  isVerifying={verificationState === "verifying"} 
                />
                
                <AnimatePresence>
                  {verificationState === "verifying" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <VerificationStepper currentStep={currentStep} progress={progress} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="results-module"
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {result && <ResultDisplay result={result} onVerifyAnother={handleVerifyAnother} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <PlatformsSection />
        <Footer />
      </div>

      <FloatingAssistant />
    </main>
  )
}

