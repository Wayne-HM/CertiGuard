"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, X, Send, Sparkles, MessageCircle, Zap, Shield, HelpCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const quickQuestions = [
  { icon: HelpCircle, text: "How does verification work?" },
  { icon: Shield, text: "What platforms are supported?" },
  { icon: Zap, text: "Is my data secure?" },
]

interface Message {
  role: "user" | "bot"
  content: string
}

export function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputMessage, setInputMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isHovering, setIsHovering] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = useCallback(async (text: string) => {
    const userText = text || inputMessage
    if (!userText.trim()) return

    const newMessages: Message[] = [...messages, { role: "user", content: userText }]
    setMessages(newMessages)
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      })

      if (!response.ok) throw new Error("Chat error")

      const data = await response.json()
      setMessages([...newMessages, { role: "bot", content: data.reply }])
    } catch (error) {
      console.error("Chat error:", error)
      setMessages([...newMessages, { role: "bot", content: "TERMINAL_TIMEOUT: UNABLE_TO_REACH_BRAIN_MODULE." }])
    } finally {
      setIsLoading(false)
    }
  }, [inputMessage, messages])

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30, rotateX: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40, rotateX: -10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute bottom-24 right-0 w-80 sm:w-[26rem] glass-strong rounded-[2.5rem] overflow-hidden mb-4 shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col max-h-[600px] diamond-border"
            style={{ transformPerspective: 1200 }}
          >
            <div className="absolute inset-0 noise-surface opacity-[0.05] pointer-events-none" />
            
            {/* High-Tech Header */}
            <motion.div 
              className="relative p-6 pt-10 overflow-hidden flex-shrink-0 border-b border-white/5 bg-[#0a0a0c]"
            >
               <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 opacity-50" />
               <motion.div 
                 className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
                 animate={{ opacity: [0.3, 1, 0.3] }}
                 transition={{ duration: 2, repeat: Infinity }}
               />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="relative w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/20 shadow-2xl diamond-border p-1"
                    animate={{ rotateY: [0, 180, 360] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  >
                     <div className="w-full h-full bg-primary/10 rounded-xl flex items-center justify-center diamond-border">
                        <Bot className="w-7 h-7 text-primary filter drop-shadow-[0_0_8px_rgba(124,255,160,0.5)]" />
                     </div>
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-black text-white italic tracking-tighter font-heading">PHANTOM_CORE</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] animate-pulse" />
                      <p className="text-[10px] text-primary/60 font-black tracking-[0.2em] uppercase italic">Module_Active</p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 diamond-border transition-all group"
                >
                  <X className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                </Button>
              </div>
            </motion.div>

            {/* Forensic Chat Body */}
            <div ref={scrollRef} className="p-6 overflow-y-auto flex-1 space-y-6 min-h-[400px] custom-scrollbar scroll-smooth">
              {/* Initial Welcome */}
              {messages.length === 0 && (
                <div className="flex gap-4 mb-6">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/20 diamond-border">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 glass-strong rounded-[1.5rem] rounded-tl-none p-4 border border-white/5 diamond-border relative overflow-hidden group">
                     <div className="absolute inset-0 bg-primary/[0.02] group-hover:bg-primary/[0.04] transition-colors" />
                    <p className="text-sm text-foreground/90 leading-relaxed italic font-medium relative z-10">
                      IDENTIFIED_USER. Initializing forensic assistance module. How can I help you navigate the obsidian grid today?
                    </p>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`
                    max-w-[85%] p-4 rounded-[1.5rem] text-sm italic font-medium diamond-border border
                    ${msg.role === "user" 
                      ? "bg-primary/10 text-primary border-primary/30 rounded-br-none" 
                      : "glass-strong rounded-tl-none text-foreground/90 border-white/10"}
                  `}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="glass-strong p-4 rounded-xl rounded-tl-none border-white/10 diamond-border">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                </div>
              )}

              {/* Quick Actions Base */}
              {messages.length === 0 && (
                <div className="space-y-3 pt-4">
                  <p className="text-[10px] text-primary/30 uppercase font-black tracking-[0.4em] ml-2">DATA_POINTS</p>
                  {quickQuestions.map((question) => (
                    <button
                      key={question.text}
                      onClick={() => handleSendMessage(question.text)}
                      className="w-full text-left text-sm font-bold italic font-heading px-5 py-4 glass-strong rounded-2xl hover:bg-primary/5 border border-white/5 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary flex items-center gap-4 group diamond-border"
                    >
                      <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-all diamond-border">
                        <question.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="tracking-tight">{question.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* High-Contrast Input */}
            <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl relative">
              <div className="absolute inset-0 noise-surface opacity-[0.03] pointer-events-none" />
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputMessage); }}
                className="flex gap-4 relative z-10"
              >
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="INQUIRE_SYSTEM..."
                  className="bg-white/5 border-white/5 h-14 rounded-2xl text-sm italic font-bold focus-visible:ring-primary/20 placeholder:text-muted-foreground/30 px-6 group-hover:bg-white/[0.08] transition-all"
                />
                <Button 
                  size="icon" 
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-white/5 hover:bg-primary/10 border border-white/5 hover:border-primary/50 shrink-0 h-14 w-14 rounded-2xl shadow-2xl transition-all active:scale-95 group diamond-border"
                >
                  <Send className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setIsHovering(true)}
        onHoverEnd={() => setIsHovering(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-16 h-16 rounded-[1.5rem] bg-[#0a0a0c] flex items-center justify-center shadow-2xl diamond-border border border-white/10 group overflow-hidden"
      >
        <div className="absolute inset-0 noise-surface opacity-[0.05] group-hover:opacity-[0.1] transition-opacity" />
        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
        
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-7 h-7 text-primary" />
            </motion.div>
          ) : (
            <motion.div 
               key="bot" 
               initial={{ scale: 0.8, opacity: 0 }} 
               animate={{ scale: 1, opacity: 1 }} 
               exit={{ scale: 0.8, opacity: 0 }}
               className="relative"
            >
              <Bot className="w-8 h-8 text-primary filter drop-shadow-[0_0_8px_rgba(124,255,160,0.4)]" />
              <motion.div 
                className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-[#0a0a0c] shadow-[0_0_10px_var(--accent)]"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}

