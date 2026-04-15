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
      setMessages([...newMessages, { role: "bot", content: "Sorry, I'm having trouble connecting to my brain right now. Please try again later!" }])
    } finally {
      setIsLoading(false)
    }
  }, [inputMessage, messages])

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, rotateX: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, rotateX: -15 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-20 right-0 w-80 sm:w-96 glass-strong rounded-2xl overflow-hidden mb-4 shadow-2xl shadow-black/30 flex flex-col max-h-[500px]"
            style={{ transformPerspective: 1000 }}
          >
            {/* Header */}
            <motion.div 
              className="relative bg-gradient-to-r from-primary via-emerald-400 to-accent p-4 overflow-hidden flex-shrink-0"
              style={{ backgroundSize: "200% 100%" }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="relative w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 shadow-lg"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Bot className="w-5 h-5 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-white flex items-center gap-2 tracking-tight">CertiGuard AI</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      <p className="text-[10px] text-white/80 font-medium">System Online</p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>

            {/* Chat Body */}
            <div ref={scrollRef} className="p-4 overflow-y-auto flex-1 space-y-4 min-h-[300px] scrollbar-hide">
              {/* Initial Welcome */}
              {messages.length === 0 && (
                <div className="flex gap-3 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 glass rounded-2xl rounded-tl-none p-3 shadow-sm">
                    <p className="text-sm text-foreground leading-relaxed">
                      Greetings! I'm the CertiGuard intelligence module. How can I assist you with certification integrity today?
                    </p>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`
                    max-w-[85%] p-3 rounded-2xl text-sm shadow-sm
                    ${msg.role === "user" 
                      ? "bg-primary text-white rounded-br-none" 
                      : "glass rounded-tl-none text-foreground border-glass-border"}
                  `}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="glass p-3 rounded-2xl rounded-tl-none border-glass-border">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {messages.length === 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest pl-1">Knowledge Bases</p>
                  {quickQuestions.map((question) => (
                    <button
                      key={question.text}
                      onClick={() => handleSendMessage(question.text)}
                      className="w-full text-left text-[11px] px-3 py-2.5 glass rounded-xl hover:bg-secondary/80 hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground flex items-center gap-3 group shadow-sm"
                    >
                      <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <question.icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      {question.text}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/50 bg-secondary/10 backdrop-blur-sm">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputMessage); }}
                className="flex gap-2"
              >
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Inquiry..."
                  className="bg-secondary/50 border-glass-border h-10 rounded-xl text-sm focus-visible:ring-primary/30"
                />
                <Button 
                  size="icon" 
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-primary hover:bg-emerald-600 shrink-0 h-10 w-10 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setIsHovering(true)}
        onHoverEnd={() => setIsHovering(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-xl shadow-primary/20 border border-white/10"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="bot" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
              <Bot className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-background flex items-center justify-center animate-bounce">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
        )}
      </motion.button>

    </div>
  )
}
