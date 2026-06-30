"use client"

import { useState, memo, useCallback, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "framer-motion"
import { Shield, Menu, X, User, LogOut, Settings, LayoutDashboard, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-context"
import { AuthModal } from "@/components/auth-modal"
import { GlassButton, smoothSpring } from "@/components/ui/glass-container"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#verify", label: "Verify" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/#about", label: "About" },
]

// Memoized nav link component - Apple style with smooth layout animation for the active indicator
const NavLink = memo(function NavLink({
  link,
  isActive,
}: {
  link: typeof navLinks[0]
  isActive: boolean
}) {
  return (
    <Link
      href={link.href}
      className={`relative px-4 py-2 text-sm transition-colors duration-300 ${isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
      onClick={(e) => {
        if (link.href.startsWith("/#")) {
          e.preventDefault()
          const id = link.href.substring(2)
          const element = document.getElementById(id)
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        }
      }}
    >
      <span className="relative z-10">{link.label}</span>

      {isActive && (
        <motion.div
          layoutId="navbar-active-indicator"
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </Link>
  )
})

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, logout, isInitialized } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [activeSection, setActiveSection] = useState<string>("home")
  const { theme, setTheme } = useTheme()

  const { scrollY } = useScroll()

  // Dynamic values mapped directly to scroll using framer-motion useTransform for 60fps performance
  const navWidth = useTransform(scrollY, [0, 100], ["100%", "96%"])
  const navY = useTransform(scrollY, [0, 100], [0, 10])
  const bgOpacity = useTransform(scrollY, [0, 100], [0, 0.4])
  const blurValue = useTransform(scrollY, [0, 100], [0, 30])
  const shadowOpacity = useTransform(scrollY, [0, 100], [0, 0.2])

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50)
  })

  const openAuth = useCallback((mode: "login" | "signup") => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }, [])

  const checkActiveSection = useCallback(() => {
    const sections = ["home", "verify", "about"]
    for (const section of sections) {
      const element = document.getElementById(section)
      if (element) {
        const rect = element.getBoundingClientRect()
        // Determine active section based on what's most prominent on screen
        if (rect.top <= 150 && rect.bottom >= 150) {
          setActiveSection(section)
          return
        }
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", checkActiveSection, { passive: true })
    return () => window.removeEventListener("scroll", checkActiveSection)
  }, [checkActiveSection])

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex justify-center"
        style={{ width: "100%" }}
      >
        <motion.div
          className="relative flex items-center justify-between rounded-full px-6 py-3 border border-glass-border"
          style={{
            width: navWidth,
            y: navY,
            maxWidth: "80rem",
            background: useTransform(bgOpacity, (v) => `rgba(0, 0, 0, ${v})`),
            backdropFilter: useTransform(blurValue, (v) => `blur(${v}px)`),
            WebkitBackdropFilter: useTransform(blurValue, (v) => `blur(${v}px)`),
            boxShadow: useTransform(shadowOpacity, (v) => `0 10px 30px rgba(0, 0, 0, ${v}), inset 0 1px 1px rgba(255, 255, 255, ${v * 0.5})`),
          }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={smoothSpring}
            >
              <Shield className="w-7 h-7 text-text-primary" strokeWidth={1.5} />
            </motion.div>
            <span className="text-xl font-semibold text-text-primary tracking-tight">
              CertiGuard
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                link={link}
                isActive={activeSection === (link.href.startsWith("/#") ? link.href.substring(2) : link.href.substring(1) || "home")}
              />
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {!isInitialized ? (
              <div className="w-8 h-8 rounded-full bg-surface-2 animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={smoothSpring}
                  >
                    <Button variant="ghost" size="icon" className="relative p-0 rounded-full border border-glass-border">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-surface-1 text-text-primary text-xs font-medium">
                          {user.name && user.name.length >= 2
                            ? user.name.substring(0, 2).toUpperCase()
                            : (user.name?.charAt(0).toUpperCase() || "CG")
                          }
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 liquid-glass border border-glass-border rounded-2xl p-2 shadow-2xl"
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-text-primary">{user.name}</p>
                      <p className="text-xs text-text-secondary">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-glass-border" />
                  <Link href="/dashboard">
                    <DropdownMenuItem className="rounded-xl cursor-pointer focus:bg-surface-2 text-text-secondary hover:text-text-primary transition-colors">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem className="rounded-xl cursor-pointer focus:bg-surface-2 text-text-secondary hover:text-text-primary transition-colors">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl cursor-pointer focus:bg-surface-2 text-text-secondary hover:text-text-primary transition-colors">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-glass-border" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="rounded-xl cursor-pointer focus:bg-surface-2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => openAuth("login")}
                  className="text-text-secondary hover:text-text-primary hover:bg-surface-1 rounded-full px-4 h-9 transition-colors"
                >
                  Sign In
                </Button>
                <GlassButton variant="primary" size="md" onClick={() => openAuth("signup")}>
                  Get Started
                </GlassButton>
              </div>
            )}
            {/* Theme Toggle */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={smoothSpring}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="relative p-0 w-9 h-9 rounded-full border border-glass-border bg-surface-1 text-text-secondary hover:text-text-primary flex items-center justify-center overflow-hidden"
              >
                <div className="relative w-4 h-4 flex items-center justify-center">
                  <Sun className={`absolute transition-all duration-300 ${theme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'} w-4 h-4`} />
                  <Moon className={`absolute transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'} w-4 h-4`} />
                </div>
              </Button>
            </motion.div>

          </div>

          {/* Mobile Menu Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-text-secondary hover:text-text-primary rounded-full transition-colors"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </motion.div>
        </motion.div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
              className="md:hidden absolute top-full left-4 right-4 mt-4"
            >
              <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-3xl border border-glass-border rounded-3xl p-4 space-y-2 shadow-2xl origin-top">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-3 rounded-2xl text-text-secondary hover:text-text-primary hover:bg-surface-1 transition-colors"
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
                      className="text-text-primary border-glass-border hover:bg-surface-2 rounded-full px-5 transition-colors"
                    >
                      Sign Out
                    </Button>
                  ) : (
                    <GlassButton variant="primary" size="md" onClick={() => { setIsOpen(false); openAuth("signup") }}>
                      Get Started
                    </GlassButton>
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
        defaultMode={authMode} 
      />
    </>
  )
}