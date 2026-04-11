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
  RefreshCw,
  Zap,
  Activity,
  Search,
  Hash,
  Globe
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AnimatedBackground } from "@/components/animated-background"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

interface VerificationRecord {
  id: string
  name: string
  course: string
  platform: string
  status: "valid" | "fake" | "manual_check" | "action_required"
  date: string
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
    if (isInitialized && !user) {
      router.push("/")
    } else if (isInitialized && user) {
      fetchDashboardData()
    }
  }, [isInitialized, user, router])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchDashboardData()
  }

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden">
        <div className="absolute inset-0 noise-surface opacity-[0.05]" />
        <div className="absolute inset-0 bg-primary/5 blur-[150px] rounded-full" />
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="relative mb-8"
        >
           <Shield className="w-16 h-16 text-primary filter drop-shadow-[0_0_15px_rgba(124,255,160,0.5)]" />
        </motion.div>
        <div className="flex flex-col items-center gap-2">
           <Loader2 className="w-8 h-8 animate-spin text-primary/60 mb-2" />
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 italic">Initializing_Forensic_Dashboard</p>
        </div>
      </div>
    )
  }

  const statCards = [
    { 
      label: "TOTAL_NODES", 
      value: stats?.total || 0, 
      change: "+12.5%",
      icon: Activity,
      color: "text-primary/60"
    },
    { 
      label: "VALID_STATE", 
      value: stats?.valid || 0, 
      change: "+8.2%",
      icon: CheckCircle2,
      color: "text-primary"
    },
    { 
      label: "ANOMALIES", 
      value: stats?.fake || 0, 
      change: "-3.1%",
      icon: XCircle,
      color: "text-accent"
    },
    { 
      label: "LATENCY_AVG", 
      value: stats?.avgTime || "1.8s", 
      change: "-18%",
      icon: Zap,
      color: "text-primary/80"
    },
  ]

  return (
    <main className="relative min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 flex flex-col">
        <Navbar />
        
        <div className="pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            {/* High-Tech Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mb-14 flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10 border-b border-white/5"
            >
              <div>
                <motion.div 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/5 border border-primary/20 mb-6 diamond-border"
                >
                   <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                   <span className="text-[10px] font-black tracking-[0.3em] text-primary italic">SESSION_ACTIVE</span>
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter italic font-heading">
                  <span className="bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
                    DATA_CENTRAL
                  </span>
                </h1>
                <p className="text-muted-foreground/40 text-lg italic font-medium tracking-tight">
                  Real-time analytics and distributed verification history.
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="relative group flex-1 lg:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="SEARCH_RECORDS..." 
                      className="pl-12 h-14 bg-white/5 border-white/5 focus:border-primary/40 rounded-2xl italic font-bold text-sm tracking-tight transition-all group-hover:bg-white/[0.08]"
                    />
                 </div>
                <Button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-14 px-8 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl diamond-border transition-all group shrink-0"
                >
                  <RefreshCw className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-700 ${isRefreshing ? "animate-spin text-primary" : "text-muted-foreground"}`} />
                </Button>
              </div>
            </motion.div>

            {/* Tactical Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {statCards.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Card className="glass-strong border border-white/5 rounded-[2rem] hover:border-primary/30 transition-all duration-500 diamond-border relative overflow-hidden group">
                    <div className="absolute inset-0 noise-surface opacity-[0.03] pointer-events-none" />
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <CardContent className="p-8">
                      <div className="flex flex-col gap-6">
                        <div className={`w-14 h-14 rounded-2xl bg-[#0a0a0c] flex items-center justify-center diamond-border border border-white/5 group-hover:border-primary/20 transition-all ${stat.color}`}>
                          <stat.icon className="w-7 h-7 filter drop-shadow-[0_0_8px_currentColor]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] mb-2">{stat.label}</p>
                          <p className="text-4xl font-black text-white italic tracking-tighter">{stat.value}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-primary/5 border border-primary/20">
                               <TrendingUp className="w-3 h-3 text-primary" />
                               <span className="text-[10px] font-black text-primary italic">{stat.change}</span>
                            </div>
                            <span className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-widest">Global_Shift</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Cinematic History Table */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="glass-strong border border-white/5 rounded-[2.5rem] overflow-hidden diamond-border relative">
                <div className="absolute inset-0 noise-surface opacity-[0.03] pointer-events-none" />
                <CardHeader className="p-10 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 bg-black/20">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center diamond-border border border-primary/20">
                        <Hash className="w-5 h-5 text-primary" />
                     </div>
                     <CardTitle className="text-2xl font-black italic tracking-tighter font-heading text-white">RECORDS_LEDGER</CardTitle>
                  </div>
                  <Link href="/#verify">
                    <Button className="h-12 px-8 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl diamond-border border border-primary/30 transition-all font-black italic text-xs tracking-widest">
                      INITIATE_SYNC
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/5 hover:bg-transparent h-16 bg-black/40">
                          <TableHead className="pl-10 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">Node_ID</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">Principal_Entity</TableHead>
                          <TableHead className="hidden md:table-cell text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">Protocol_Source</TableHead>
                          <TableHead className="hidden sm:table-cell text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">Grid_Platform</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">Integrity_Status</TableHead>
                          <TableHead className="hidden lg:table-cell text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">TimeStamp</TableHead>
                          <TableHead className="w-20 pr-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.length > 0 ? (
                          history.map((record, index) => (
                            <motion.tr
                              key={record.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.4, delay: index * 0.05 }}
                              className="border-white/5 hover:bg-white/[0.03] group transition-colors h-20"
                            >
                              <TableCell className="pl-10 font-mono text-[11px] font-black text-muted-foreground/30 group-hover:text-primary transition-colors">
                                #{record.id}
                              </TableCell>
                              <TableCell className="font-black text-white italic tracking-tighter text-base">
                                {record.name}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-muted-foreground/60 italic font-medium">
                                {record.course}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                 <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                                   {record.platform}
                                 </span>
                              </TableCell>
                              <TableCell>
                                <div
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest diamond-border border ${
                                    record.status === "valid"
                                      ? "bg-primary/10 text-primary border-primary/20"
                                      : "bg-accent/10 text-accent border-accent/20"
                                  }`}
                                >
                                  {record.status === "valid" ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 filter drop-shadow-[0_0_5px_currentColor]" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5 filter drop-shadow-[0_0_5px_currentColor]" />
                                  )}
                                  {record.status === "valid" ? "VALID_NODE" : "ANOMALY_DET"}
                                </div>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-[11px] font-bold text-muted-foreground/30 italic">
                                {new Date(record.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="pr-10">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                                      <MoreHorizontal className="w-5 h-5 text-muted-foreground/40 group-hover:text-white" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="glass-strong border border-white/5 rounded-2xl p-2 w-48 diamond-border shadow-2xl">
                                     <div className="absolute inset-0 noise-surface opacity-[0.03] pointer-events-none" />
                                    <DropdownMenuItem className="rounded-xl h-11 focus:bg-primary/10 focus:text-primary cursor-pointer transition-colors px-4 text-xs font-black italic tracking-widest">
                                      <ExternalLink className="w-4 h-4 mr-3" />
                                      VIEW_ORIGIN
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-xl h-11 focus:bg-primary/10 focus:text-primary cursor-pointer transition-colors px-4 text-xs font-black italic tracking-widest">
                                      <FileText className="w-4 h-4 mr-3" />
                                      EXTRACT_REP
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </motion.tr>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-32 text-muted-foreground/20 italic font-black uppercase tracking-[0.3em]">
                               NULL_HISTORY_ARRAY. InitialSyncRequired.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
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

