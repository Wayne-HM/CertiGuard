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
import Link from "next/link"

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
  const [history, setHistory] = useState<VerificationRecord[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/history`)
      if (!response.ok) throw new Error("Failed to fetch history")
      const data = await response.json()
      setHistory(data.verifications)
      setStats(data.stats)
    } catch (error) {
      console.error("Dashboard error:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchDashboardData()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
      </div>
    )
  }

  const statCards = [
    { 
      label: "Total Verifications", 
      value: stats?.total || 0, 
      change: "+12%",
      icon: FileText,
      color: "text-neon-blue"
    },
    { 
      label: "Valid Certificates", 
      value: stats?.valid || 0, 
      change: "+8%",
      icon: CheckCircle2,
      color: "text-success"
    },
    { 
      label: "Fake Detected", 
      value: stats?.fake || 0, 
      change: "-3%",
      icon: XCircle,
      color: "text-destructive"
    },
    { 
      label: "Avg. Time", 
      value: stats?.avgTime || "2.1s", 
      change: "-15%",
      icon: Clock,
      color: "text-neon-cyan"
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                    Dashboard
                  </span>
                </h1>
                <p className="text-muted-foreground">
                  Track your verification history and analytics
                </p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-glass-border hover:bg-secondary/50 group"
              >
                <RefreshCw className={`w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh Data
              </Button>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="glass-strong border-glass-border hover:border-neon-blue/30 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                          <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <TrendingUp className="w-4 h-4 text-success" />
                            <span className="text-sm text-success">{stat.change}</span>
                          </div>
                        </div>
                        <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center ${stat.color}`}>
                          <stat.icon className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Recent Verifications Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="glass-strong border-glass-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Verification History</CardTitle>
                  <Link href="/#verify">
                    <Button variant="outline" className="border-glass-border">
                      Verify New
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead>Certificate ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Course</TableHead>
                        <TableHead className="hidden sm:table-cell">Platform</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Date</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.length > 0 ? (
                        history.map((record, index) => (
                          <motion.tr
                            key={record.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="border-border hover:bg-secondary/50"
                          >
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {record.id}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {record.name}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground italic">
                              {record.course}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">
                              {record.platform}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  record.status === "valid"
                                    ? "bg-success/20 text-success"
                                    : "bg-destructive/20 text-destructive"
                                }`}
                              >
                                {record.status === "valid" ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                {record.status === "valid" ? "Valid" : "Fake"}
                              </span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground">
                              {record.date}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="glass-strong border-glass-border">
                                  <DropdownMenuItem>
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Download Report
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </motion.tr>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                            No verifications found. Start by verifying a certificate!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        <Footer />
      </div>
    </main>
  )
}
