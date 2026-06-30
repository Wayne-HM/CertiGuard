"use client"

import { useState, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import { AnimatedBackground } from "@/components/animated-background"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { UploadSection } from "@/components/upload-section"
import { VerificationStepper } from "@/components/verification-stepper"
import { PlatformsSection } from "@/components/platforms-section"
import { FloatingAssistant } from "@/components/floating-assistant"
import { Footer } from "@/components/footer"
import { useAuth } from "@/components/auth-context"
import { toast } from "sonner"

const ResultDisplay = dynamic(
  () => import("@/components/result-display").then((mod) => mod.ResultDisplay),
  { ssr: false }
)

type VerificationResult = any // Since we are importing ResultDisplay dynamically, we can define the type or import it separately.

type VerificationState = "idle" | "verifying" | "complete"

export default function Home() {
  const { user } = useAuth()
  const [verificationState, setVerificationState] = useState<VerificationState>("idle")
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [batchResults, setBatchResults] = useState<any[] | null>(null)

  const handleUpload = useCallback(async (file: File, platform: string = "auto") => {
    console.log("Starting verification for:", file.name, "on platform:", platform, "User:", user?.id || "Guest")
    setVerificationState("verifying")
    setCurrentStep(1)
    setProgress(10)

    // Simulate progress while waiting for backend
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) return prev + 2;
        if (prev < 60) return prev + 1;
        if (prev < 95) return prev + 0.5;
        return prev;
      });
      
      // Update steps based on progress
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
      if (user?.id) {
        formData.append("user_id", user.id)
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://certiguard-ksm9.onrender.com"
      const response = await fetch(`${API_URL}/verify`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }

      const data = await response.json()
      console.log("Verification successful:", data)
      
      clearInterval(interval)
      setProgress(100)
      setCurrentStep(5)
      
      // Artificial delay for smooth transition
      setTimeout(() => {
        setResult(data)
        setVerificationState("complete")
      }, 800)

    } catch (error) {
      console.error("Verification error:", error)
      clearInterval(interval)
      toast.error("Analysis server could not be reached. Falling back to error state.")
      
      setResult({
        isValid: false,
        name: "Upload Failed",
        course: "Check Backend Connection",
        platform: "Error",
        verificationUrl: "",
        issueDate: "N/A",
        certificateId: "ERROR",
      })
      setVerificationState("complete")
    }
  }, [])

  const handleBatchUpload = useCallback(async (files: File[], platform: string = "auto") => {
    console.log(`Starting batch verification for ${files.length} files, platform: ${platform}`)
    setVerificationState("verifying")
    setCurrentStep(1)
    setProgress(10)
    setBatchResults(null)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) return prev + 1;
        if (prev < 60) return prev + 0.5;
        if (prev < 95) return prev + 0.2;
        return prev;
      });
      setProgress(p => {
        if (p > 20) setCurrentStep(2);
        if (p > 40) setCurrentStep(3);
        if (p > 60) setCurrentStep(4);
        if (p > 80) setCurrentStep(5);
        return p;
      });
    }, 300);

    try {
      const formData = new FormData()
      files.forEach((file, i) => formData.append(`certificate_${i}`, file))
      formData.append("platform", platform)
      if (user?.id) formData.append("user_id", user.id)

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://certiguard-ksm9.onrender.com"
      const response = await fetch(`${API_URL}/verify-batch`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error(`Server responded with ${response.status}`)
      const data = await response.json()
      console.log("Batch verification complete:", data)

      clearInterval(interval)
      setProgress(100)
      setCurrentStep(5)

      setTimeout(() => {
        setBatchResults(data.results || [])
        // Use first result as primary display, attach batch info
        const primary = data.results?.[0] || {
          isValid: false, name: "Batch Complete", course: `${data.summary?.total || 0} certificates processed`,
          platform: "Batch", verificationUrl: "", issueDate: "N/A",
        }
        primary._batchSummary = data.summary
        primary._batchResults = data.results
        setResult(primary)
        setVerificationState("complete")
      }, 800)

    } catch (error) {
      console.error("Batch error:", error)
      clearInterval(interval)
      toast.error("Batch analysis server could not be reached.")
      setResult({
        isValid: false, name: "Batch Upload Failed",
        course: "Check Backend Connection", platform: "Error",
        verificationUrl: "", issueDate: "N/A", certificateId: "ERROR",
      })
      setVerificationState("complete")
    }
  }, [user])

  const handleVerifyAnother = useCallback(() => {
    setVerificationState("idle")
    setCurrentStep(0)
    setProgress(0)
    setResult(null)
    setBatchResults(null)
  }, [])

  // Scroll to verification section when starting
  useEffect(() => {
    if (verificationState === "verifying") {
      const element = document.getElementById("verify")
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
  }, [verificationState])

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <Navbar />

        {/* Hero Section */}
        <HeroSection />

        {/* Upload Section - Always visible unless showing results */}
        {verificationState !== "complete" && (
          <UploadSection 
            onUpload={handleUpload}
            onBatchUpload={handleBatchUpload}
            isVerifying={verificationState === "verifying"} 
          />
        )}

        {/* Verification Progress */}
        {verificationState === "verifying" && (
          <VerificationStepper currentStep={currentStep} progress={progress} />
        )}

        {/* Results */}
        {verificationState === "complete" && result && (
          <ResultDisplay result={result} onVerifyAnother={handleVerifyAnother} />
        )}

        {/* Supported Platforms */}
        <PlatformsSection />

        {/* Footer */}
        <Footer />
      </div>

      {/* Floating AI Assistant */}
      <FloatingAssistant />
    </main>
  )
}
