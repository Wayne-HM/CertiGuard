"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isInitialized: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize session from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem("certiguard_user")
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          // Verify session with backend
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: userData.id }),
          })

          if (response.ok) {
            const freshUser = await response.json()
            setUser(freshUser)
            localStorage.setItem("certiguard_user", JSON.stringify(freshUser))
          } else if (response.status === 401) {
            // Only wipe if explicitly unauthorized and not a temporary network issue
            console.warn("Session invalid, clearing user data")
            localStorage.removeItem("certiguard_user")
            setUser(null)
          }
        } catch (err) {
          console.error("Auth init error (likely network):", err)
          // Keep the local user for now to allow offline/slow-start access
        }
      }
      setIsInitialized(true)
    }

    initAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      const userData = { id: data.id, name: data.name, email: data.email }
      setUser(userData)
      localStorage.setItem("certiguard_user", JSON.stringify(userData))
      toast.success(`Welcome back, ${data.name}!`)
    } catch (err: any) {
      toast.error(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      // Automatically log in after registration
      const userData = { id: data.id, name: data.name, email: data.email }
      setUser(userData)
      localStorage.setItem("certiguard_user", JSON.stringify(userData))
      toast.success("Account created successfully!")
    } catch (err: any) {
      toast.error(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("certiguard_user")
    toast.info("Signed out successfully.")
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, isInitialized }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
