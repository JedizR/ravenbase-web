import { useEffect } from "react"

type InboxAction = "next" | "prev" | "accept" | "reject" | "chat" | "help"

interface UseKeyboardInboxOptions {
  onAction: (action: InboxAction) => void
  enabled: boolean
}

export function useKeyboardInbox({ onAction, enabled }: UseKeyboardInboxOptions) {
  useEffect(() => {
    if (!enabled) return

    const handler = (e: KeyboardEvent) => {
      // Ignore when user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (e.key) {
        case "j":
        case "J":
        case "ArrowDown":
          e.preventDefault()
          onAction("next")
          break
        case "k":
        case "K":
        case "ArrowUp":
          e.preventDefault()
          onAction("prev")
          break
        case "Enter":
          e.preventDefault()
          onAction("accept")
          break
        case "Backspace":
          e.preventDefault()
          onAction("reject")
          break
        case "c":
        case "C":
          e.preventDefault()
          onAction("chat")
          break
        case "?":
          e.preventDefault()
          onAction("help")
          break
        case "Escape":
          e.preventDefault()
          onAction("help")
          break
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [enabled, onAction])
}
