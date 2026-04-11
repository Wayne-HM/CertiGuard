"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp,
  FileText,
  ExternalLink,
  MoreHorizontal,
  Loader2,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AnimatedBackground } from "@/components/animated-background"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useAuth } from "@/components/auth-context"
import { useRouter } from "next/navigation"

interface VerificationRecord {
  id: string
  name: string
  course: string
  platform: string
  date: string
  status: "valid" | "fake"
  isValid: boolean
}

interface Stats {
  total: number
  valid: number
  fake: number
  avgTime: string
}

export default function DashboardPage() {
  const { user, isInitialized } = useAuth()
  const router = useRouter()
  const [history, setHistory] = useState<VerificationRecord[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure hydration is complete
  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id }),
      })
      
      if (!response.ok) throw new Error("Failed to fetch history")
      const data = await response.json()
      setHistory(data?.verifications || [])
      setStats(data?.stats || null)
    } catch (error) {
      console.error("Dashboard error:", error)
      setHistory([])
      setStats(null)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        router.push("/")
      } else {
        fetchDashboardData()
      }
    }
  }, [isInitialized, user, router, fetchDashboardData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchDashboardData()
  }

  // Pre-hydration rendering
  if (!mounted || !isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const statCards = [
    { 
      label: "Total Verifications", 
      value: stats?.total ?? 0, 
      icon: FileText,
      color: "text-primary/80"
    },
    { 
      label: "Valid Certificates", 
      value: stats?.valid ?? 0, 
      icon: CheckCircle2,
      color: "text-emerald-400"
    },
    { 
      label: "Fake Detected", 
      value: stats?.fake ?? 0, 
      icon: XCircle,
      color: "text-destructive"
    },
    { 
      label: "Avg. Time", 
      value: stats?.avgTime ?? "2.1s", 
      icon: Clock,
      color: "text-primary"
    },
  ]

  return (
    <main className="relative min-h-screen bg-black">
      {/* Background disabled temporarily for stability testing */}
      {/* <AnimatedBackground /> */}
      
      <div className="relative z-10">
        <Navbar />
        
        <div className="pt-24 pb-12 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Dashboard
                  </span>
                </h1>
                <p className="text-muted-foreground">
                  Track your verification history
                </p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map((stat) => (
                <Card key={stat.label} className="bg-neutral-900/50 border-neutral-800">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-neutral-400 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold">{stat.value}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center ${stat.color}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Table */}
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-800">
                      <TableHead>Certificate ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Course</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.length > 0 ? (
                      history.map((record) => (
                        <TableRow key={record.id} className="border-neutral-800">
                          <TableCell className="font-mono text-xs">{record.id}</TableCell>
                          <TableCell>{record.name}</TableCell>
                          <TableCell className="hidden md:table-cell italic">{record.course}</TableCell>
                          <TableCell>
                            <span className={record.status === "valid" ? "text-emerald-400" : "text-destructive"}>
                              {record.status === "valid" ? "Valid" : "Fake"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-neutral-500">
                          No history found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    </main>
  )
}
