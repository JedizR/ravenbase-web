"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { MessageSquare, Send, Loader2, History } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  listSessionsV1ChatSessionsGet,
  getSessionV1ChatSessionsSessionIdGet,
  deleteSessionV1ChatSessionsSessionIdDelete,
} from "@/src/lib/api-client/services.gen"
import type {
  ChatSessionSummary,
  ChatSessionDetail,
} from "@/src/lib/api-client/types.gen"
import { useProfile } from "@/contexts/ProfileContext"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChatSessionSidebar } from "./ChatSessionSidebar"
import { ChatMessage, type Message } from "./ChatMessage"
import { type Citation } from "./CitationCard"

type ChatState = "idle" | "streaming" | "error"

export function MemoryChat() {
  const { getToken } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { activeProfile } = useProfile()

  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [chatState, setChatState] = useState<ChatState>("idle")
  const [input, setInput] = useState("")
  const [model, setModel] = useState<"haiku" | "sonnet">("haiku")
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [sessionsOpen, setSessionsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Session list query
  const { data: sessionList, isLoading } = useQuery({
    queryKey: ["chat", "sessions"],
    queryFn: () => listSessionsV1ChatSessionsGet(),
    staleTime: 10_000,
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load a past session
  const loadSession = useCallback(
    async (sid: string) => {
      const detail: ChatSessionDetail =
        await getSessionV1ChatSessionsSessionIdGet({ sessionId: sid })
      setSessionId(sid)
      const loaded: Message[] = (
        detail.messages as unknown as Array<{
          role: string
          content: string
          created_at: string
        }>
      ).map((m) => ({
        id: crypto.randomUUID(),
        role: m.role as "user" | "assistant",
        content: m.content,
        citations: [],
      }))
      setMessages(loaded)
      setSessionsOpen(false)
    },
    []
  )

  // Delete a session
  const deleteSession = useCallback(
    async (sid: string) => {
      await deleteSessionV1ChatSessionsSessionIdDelete({ sessionId: sid })
      queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] })
      if (sessionId === sid) {
        setSessionId(null)
        setMessages([])
      }
    },
    [sessionId, queryClient]
  )

  // Handle send — SSE via fetch() with streaming reader
  const handleSend = useCallback(async () => {
    if (!input.trim() || chatState === "streaming") return
    const userMessage = input.trim()
    setInput("")
    setChatState("streaming")

    // Optimistic user message
    const userMsgId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: userMessage },
    ])

    // Empty assistant message with streaming cursor
    const asstMsgId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { id: asstMsgId, role: "assistant", content: "", isStreaming: true },
    ])

    const token = await getToken()
    const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/chat/message`

    // CRITICAL: check 402 BEFORE starting stream reader
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: userMessage,
        session_id: sessionId,
        profile_id: activeProfile?.id ?? null,
        model,
      }),
    })

    if (response.status === 402) {
      setChatState("error")
      setShowUpgradeDialog(true)
      // Remove the streaming assistant message
      setMessages((prev) => prev.filter((m) => m.id !== asstMsgId))
      return
    }

    if (!response.ok) {
      setChatState("error")
      setMessages((prev) =>
        prev.map((m) =>
          m.id === asstMsgId ? { ...m, isStreaming: false, isError: true } : m
        )
      )
      return
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter((l) =>
          l.startsWith("data:")
        )
        for (const line of lines) {
          const event = JSON.parse(line.slice(5).trim())
          if (event.type === "session") {
            setSessionId(event.session_id)
          }
          if (event.type === "token") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === asstMsgId
                  ? { ...m, content: m.content + event.content }
                  : m
              )
            )
          }
          if (event.type === "done") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === asstMsgId
                  ? {
                      ...m,
                      citations: event.citations as Citation[],
                      isStreaming: false,
                    }
                  : m
              )
            )
            setChatState("idle")
            queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] })
          }
          if (event.type === "error") {
            setChatState("error")
            setMessages((prev) =>
              prev.map((m) =>
                m.id === asstMsgId
                  ? { ...m, isStreaming: false, isError: true }
                  : m
              )
            )
          }
        }
      }
    } catch {
      setChatState("error")
      setMessages((prev) =>
        prev.map((m) =>
          m.id === asstMsgId ? { ...m, isStreaming: false, isError: true } : m
        )
      )
    }
  }, [
    input,
    chatState,
    sessionId,
    activeProfile,
    model,
    getToken,
    queryClient,
  ])

  // Textarea key handler — Enter sends, Shift+Enter inserts newline
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[100dvh]">
      {/* Desktop sidebar */}
      <ChatSessionSidebar
        sessions={sessionList?.items ?? []}
        activeSessionId={sessionId}
        onSelectSession={loadSession}
        onDeleteSession={deleteSession}
        isLoading={isLoading}
        className="hidden md:flex w-64 flex-col"
      />

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-lg">Chat</h1>
            <span className="text-xs font-mono text-muted-foreground">
              ◆ MEMORY_CHAT
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Model selector */}
            <Select
              value={model}
              onValueChange={(v) => setModel(v as "haiku" | "sonnet")}
            >
              <SelectTrigger className="w-40 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="haiku">Haiku (fast)</SelectItem>
                <SelectItem value="sonnet">Sonnet (detailed)</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSessionsOpen(true)}
              aria-label="Open session history"
            >
              <History className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4"
          aria-live="polite"
          aria-atomic="false"
          aria-label="Chat messages"
        >
          {messages.length === 0 && chatState === "idle" && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">
                Ask me anything about your memories.
              </p>
              <p className="text-xs mt-1">
                I&apos;ll search your knowledge base and answer with
                citations.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input — sticky bottom with safe-area */}
        <div className="p-4 border-t border-border bg-background pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-end gap-2 max-w-3xl mx-auto">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your memories..."
              className="flex-1 min-h-[48px] max-h-[200px] resize-none"
              aria-label="Chat message input"
            />
            <Button
              onClick={handleSend}
              disabled={chatState === "streaming" || !input.trim()}
              size="icon"
              className="h-[48px] w-[48px] shrink-0 rounded-full"
              aria-label="Send message"
            >
              {chatState === "streaming" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Mobile session drawer */}
      <Sheet open={sessionsOpen} onOpenChange={setSessionsOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <ChatSessionSidebar
            sessions={sessionList?.items ?? []}
            activeSessionId={sessionId}
            onSelectSession={loadSession}
            onDeleteSession={deleteSession}
            isLoading={isLoading}
            className="flex-col h-full border-0"
          />
        </SheetContent>
      </Sheet>

      {/* Upgrade dialog (402) */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insufficient Credits</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have enough credits to process this request. Upgrade
            to Pro for more credits.
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setShowUpgradeDialog(false)}
              variant="outline"
            >
              Close
            </Button>
            <Button onClick={() => router.push("/dashboard/settings")}>
              Upgrade
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
