"use client"
import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"

interface GeneratedPromptBoxProps {
  promptText: string
}

export function GeneratedPromptBox({ promptText }: GeneratedPromptBoxProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(promptText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <Textarea
        value={promptText}
        readOnly
        className="font-mono text-xs resize-none bg-secondary/50
                   h-32 md:min-h-[200px] overflow-y-auto"
        aria-label="Generated extraction prompt"
      />
      <Button
        size="sm"
        variant="outline"
        onClick={handleCopy}
        className="absolute top-2 right-2"
        aria-label={copied ? "Copied to clipboard" : "Copy prompt to clipboard"}
      >
        {copied ? (
          <><Check className="w-3 h-3 mr-1" /> Copied</>
        ) : (
          <><Copy className="w-3 h-3 mr-1" /> Copy</>
        )}
      </Button>
    </div>
  )
}
