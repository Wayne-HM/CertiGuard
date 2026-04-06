"use client"

import { useState, memo, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion"
import { Shield, Menu, X, User, Moon, Sun, Sparkles, LogOut, Settings, Bell, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-context"
import { AuthModal } from "@/components/auth-modal"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#verify", label: "Verify" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/#about", label: "About" },
]

// Optimized spring config for 120fps
const quickSpring = { stiffness: 400, damping: 35, mass: 0.8 }
const smoothTransition = { duration: 0.2, ease: [0.4, 0, 0.2, 1] }

// Memoized nav link component
const NavLink = memo(function NavLink({ 
  link, 
  isHovered, 
  onHover 
}: { 
  link: typeof navLinks[0]
  isHovered: boolean
  onHover: (href: string | null) => void 
}) {
  return (
    <Link
      href={link.href}
      className="relative px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
      onMouseEnter={() => onHover(link.href)}
      onMouseLeave={() => onHover(null)}
      onClick={() => {
        if (link.href.startsWith("/#")) {
          const id = link.href.substring(2);
          const element = document.getElementById(id);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }
      }}
    >
      <span className="relative z-10">{link.label}</span>
      
      {/* Hover background */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            layoutId="navbar-hover-bg"
            className="absolute inset-0 rounded-lg bg-secondary/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>
      
      {/* Underline */}
      <motion.div
        className="absolute bottom-1 left-1/2 h-0.5 bg-gradient-to-r from-neon-blue to-neon-cyan rounded-full"
        initial={{ width: 0, x: "-50%" }}
        animate={{ width: isHovered ? "60%" : 0, x: "-50%" }}
        transition={{ duration: 0.15 }}
      />
    </Link>
  )
})

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)
  
  // Auth states
  const { user, logout, isInitialized } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  
  const { scrollY } = useScroll()
  
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50)
  })

  const openAuth = useCallback((mode: "login" | "signup") => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
      >
        <motion.div 
          className="max-w-7xl mx-auto"
          animate={{ scale: isScrolled ? 0.99 : 1 }}
          transition={smoothTransition}
        >
          <motion.div 
            className={`
              relative overflow-hidden rounded-2xl px-6 py-3 flex items-center justify-between gpu-accelerate
              transition-all duration-300
              ${isScrolled ? "glass-strong shadow-lg shadow-black/10" : "glass"}
            `}
            style={{ 
              borderWidth: 1, 
              borderStyle: "solid",
              borderColor: isScrolled ? "oklch(0.5 0.1 220 / 0.25)" : "oklch(0.5 0.1 220 / 0.15)"
            }}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group relative z-10">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-neon-blue/20 blur-md rounded-full" />
                <Shield className="w-8 h-8 text-neon-blue relative z-10" />
              </motion.div>
              
              <span className="text-xl font-bold bg-gradient-to-r from-neon-blue via-neon-cyan to-neon-purple bg-clip-text text-transparent">
                CertiGuard
              </span>
              
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, ...quickSpring }}
                className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-blue/10 text-[10px] font-medium text-neon-blue border border-neon-blue/20"
              >
                <Sparkles className="w-2.5 h-2.5" />
                PRO
              </motion.span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 relative z-10">
              {navLinks.map((link) => (
                <NavLink 
                  key={link.href} 
                  link={link} 
                  isHovered={hoveredLink === link.href}
                  onHover={setHoveredLink}
                />
              ))}
            </div>

            {/* Right Side */}
            <div className="hidden md:flex items-center gap-3 relative z-10">

              {!isInitialized ? (
                <div className="w-9 h-9 rounded-full bg-secondary animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={quickSpring}>
                      <Button variant="ghost" size="icon" className="relative group p-0 overflow-hidden rounded-full">
                        <Avatar className="w-9 h-9 border-2 border-neon-blue/30 group-hover:border-neon-blue transition-colors">
                          <AvatarFallback className="bg-neon-blue/10 text-neon-blue text-xs font-bold">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-background" />
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 glass-strong border-glass-border p-2">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-glass-border" />
                    <Link href="/dashboard">
                      <DropdownMenuItem className="focus:bg-secondary/50 cursor-pointer rounded-lg">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem className="focus:bg-secondary/50 cursor-pointer rounded-lg">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-secondary/50 cursor-pointer rounded-lg">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-glass-border" />
                    <DropdownMenuItem 
                      onClick={logout}
                      className="focus:bg-destructive/10 text-destructive cursor-pointer rounded-lg font-medium"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => openAuth("login")}
                    className="text-muted-foreground hover:text-foreground hover:bg-white/5"
                  >
                    Sign In
                  </Button>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={quickSpring}>
                    <Button 
                      onClick={() => openAuth("signup")}
                      className="bg-gradient-to-r from-neon-blue to-neon-purple text-white px-5 h-9 rounded-xl shadow-lg shadow-neon-blue/20"
                    >
                      Get Started
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="md:hidden"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="glass-strong rounded-2xl mt-2 p-4 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                
                <div className="pt-3 mt-2 border-t border-glass-border flex items-center justify-between">
                  
                  {user ? (
                    <Button 
                      variant="outline" 
                      onClick={logout}
                      className="text-destructive border-destructive/20 hover:bg-destructive/10"
                    >
                      Sign Out
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => openAuth("signup")}
                      className="bg-neon-blue text-white rounded-lg px-6"
                    >
                      Get Started
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authMode} 
      />
    </>
  )
}
