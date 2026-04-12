"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { toast } from "sonner"
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
    // We now allow guest fetches (no user.id) to retrieve global statistics
    console.log("Fetching dashboard data for user:", user?.id || "Guest")
    setIsLoading(true)

    try {
      // Use GET as verified by manual browser check
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://certiguard-ksm9.onrender.com"
      const response = await fetch(`${API_URL}/history?id=${user.id}`)
      
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)
      
      const data = await response.json()
      console.log("Dashboard data received:", data)

      // Strict array check to prevent .map crashes
      const historyData = Array.isArray(data?.verifications) ? data.verifications : []
      const statsData = data?.stats || null

      setHistory(historyData)
      setStats(statsData)
    } catch (error: any) {
      console.error("Dashboard Fetch Error:", error)
      toast.error("Failed to load history")
      setHistory([])
      setStats(null)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isInitialized) {
      fetchDashboardData()
    }
  }, [isInitialized, fetchDashboardData])

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
      value: stats?.total ?? (history.length > 0 ? history.length : 0), 
      icon: FileText,
      color: "text-primary/80"
    },
    { 
      label: "Valid Certificates", 
      value: stats?.valid ?? history.filter(h => h.status === "valid").length, 
      icon: CheckCircle2,
      color: "text-emerald-400"
    },
    { 
      label: "Fake Detected", 
      value: stats?.fake ?? history.filter(h => h.status === "fake").length, 
      icon: XCircle,
      color: "text-destructive"
    },
    { 
      label: "Avg. Time", 
      value: stats?.avgTime ?? "1.4s", 
      icon: Clock,
      color: "text-primary"
    },
  ]

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <Navbar />
        
        <div className="pt-24 pb-12 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-primary via-emerald-400 to-accent bg-clip-text text-transparent italic">
                    {user ? "Your Dashboard" : "Global Dashboard"}
                  </span>
                </h1>
                <p className="text-muted-foreground">
                  {user 
                    ? `Welcome back, ${user.name}! Track your private verification history.`
                    : "Track global verification trends and statistics across all platforms."}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {!user && (
                  <p className="text-xs text-amber-400/70 hidden md:block italic">
                    Public Mode: Sign in to see your personal records
                  </p>
                )}
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="border-glass-border hover:bg-secondary/50 group"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map((stat) => (
                <Card key={stat.label} className="glass-strong border-glass-border hover:border-primary/30 transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Verifications Table */}
            <Card className="glass-strong border-glass-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">
                  {user ? "Your Verification History" : "Recent Global Verifications"}
                </CardTitle>
                <Link href="/#verify">
                  <Button variant="outline" className="border-glass-border">
                    Verify New
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-glass-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-secondary/50">
                      <TableRow className="border-glass-border hover:bg-transparent">
                        <TableHead>Certificate ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Course</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell text-right">Date</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.length > 0 ? (
                        history.map((record) => (
                          <TableRow key={record.id || Math.random().toString()} className="border-glass-border hover:bg-secondary/30">
                            <TableCell className="font-mono text-[10px] text-muted-foreground">
                              {record.id || "N/A"}
                            </TableCell>
                            <TableCell className="font-medium text-sm">
                              {record.name || "Unknown"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground italic text-sm">
                              {record.course || "General"}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                                  record.status === "valid" || record.isValid
                                    ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                                    : "bg-destructive/10 text-destructive border border-destructive/20"
                                }`}
                              >
                                {record.status === "valid" || record.isValid ? "Valid" : "Fake"}
                              </span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground text-xs text-right text-nowrap">
                              {record.date || "Just now"}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="glass-strong border-glass-border p-1">
                                  <DropdownMenuItem className="rounded-md cursor-pointer focus:bg-secondary text-xs">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="rounded-md cursor-pointer focus:bg-secondary text-xs">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Report
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-16 text-muted-foreground italic">
                            No verification history available.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    </main>
  )
}
