"use client"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"

interface ShortcutOverlayProps {
  isOpen: boolean
  onClose: () => void
}

const shortcuts = [
  { keys: ["J", "↓"], label: "Next conflict" },
  { keys: ["K", "↑"], label: "Previous conflict" },
  { keys: ["Enter ↵"], label: "Accept AI suggestion" },
  { keys: ["⌫ Backspace"], label: "Keep existing memory" },
  { keys: ["C"], label: "Open conversational chat" },
  { keys: ["?"], label: "Show/hide this overlay" },
  { keys: ["Esc"], label: "Close overlay / cancel chat" },
]

export function ShortcutOverlay({ isOpen, onClose }: ShortcutOverlayProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-lg animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground tracking-wider">
              ◆ KEYBOARD_SHORTCUTS
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              ✕
            </Button>
          </div>

          <div className="space-y-2">
            {shortcuts.map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {s.keys.map((k) => (
                    <Kbd key={k} className="text-xs">
                      {k}
                    </Kbd>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
