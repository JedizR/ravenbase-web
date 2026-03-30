// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useKeyboardInbox } from "@/hooks/use-keyboard-inbox"

describe("useKeyboardInbox", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const setup = (enabled = true) => {
    const callbacks = {
      onAction: vi.fn(),
    }
    const { result } = renderHook(() =>
      useKeyboardInbox({ onAction: callbacks.onAction, enabled })
    )
    return { ...callbacks }
  }

  const fireKeydown = (key: string) => {
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key }))
    })
  }

  it("test_keyboard_next — J key fires onNext callback", () => {
    const { onAction } = setup()
    fireKeydown("j")
    expect(onAction).toHaveBeenCalledWith("next")
  })

  it("test_keyboard_next — J uppercase fires onNext callback", () => {
    const { onAction } = setup()
    fireKeydown("J")
    expect(onAction).toHaveBeenCalledWith("next")
  })

  it("test_keyboard_next — ArrowDown fires onNext callback", () => {
    const { onAction } = setup()
    fireKeydown("ArrowDown")
    expect(onAction).toHaveBeenCalledWith("next")
  })

  it("test_keyboard_prev — K key fires onPrev callback", () => {
    const { onAction } = setup()
    fireKeydown("k")
    expect(onAction).toHaveBeenCalledWith("prev")
  })

  it("test_keyboard_prev — K uppercase fires onPrev callback", () => {
    const { onAction } = setup()
    fireKeydown("K")
    expect(onAction).toHaveBeenCalledWith("prev")
  })

  it("test_keyboard_prev — ArrowUp fires onPrev callback", () => {
    const { onAction } = setup()
    fireKeydown("ArrowUp")
    expect(onAction).toHaveBeenCalledWith("prev")
  })

  it("test_keyboard_accept — Enter key fires onAccept", () => {
    const { onAction } = setup()
    fireKeydown("Enter")
    expect(onAction).toHaveBeenCalledWith("accept")
  })

  it("test_keyboard_reject — Backspace fires onReject", () => {
    const { onAction } = setup()
    fireKeydown("Backspace")
    expect(onAction).toHaveBeenCalledWith("reject")
  })

  it("test_keyboard_chat — C key fires onChat", () => {
    const { onAction } = setup()
    fireKeydown("c")
    expect(onAction).toHaveBeenCalledWith("chat")
  })

  it("test_keyboard_chat — C uppercase fires onChat", () => {
    const { onAction } = setup()
    fireKeydown("C")
    expect(onAction).toHaveBeenCalledWith("chat")
  })

  it("test_keyboard_help — ? key fires onHelp", () => {
    const { onAction } = setup()
    fireKeydown("?")
    expect(onAction).toHaveBeenCalledWith("help")
  })

  it("test_keyboard_escape — Escape key fires onHelp", () => {
    const { onAction } = setup()
    fireKeydown("Escape")
    expect(onAction).toHaveBeenCalledWith("help")
  })

  it("test_keyboard_ignores_input — J key does NOT fire when activeElement is textarea", () => {
    const { onAction } = setup()
    const textarea = document.createElement("textarea")
    document.body.appendChild(textarea)
    textarea.focus()
    // In a real browser, the keydown event bubbles from textarea → window with e.target=textarea
    // happy-dom doesn't set e.target automatically on window events, so we set it explicitly
    const event = new KeyboardEvent("keydown", { key: "j", bubbles: true })
    Object.defineProperty(event, "target", { value: textarea })
    act(() => {
      window.dispatchEvent(event)
    })
    expect(onAction).not.toHaveBeenCalled()
    document.body.removeChild(textarea)
  })

  it("test_keyboard_ignores_input — J key does NOT fire when activeElement is input", () => {
    const { onAction } = setup()
    const input = document.createElement("input")
    document.body.appendChild(input)
    input.focus()
    const event = new KeyboardEvent("keydown", { key: "j", bubbles: true })
    Object.defineProperty(event, "target", { value: input })
    act(() => {
      window.dispatchEvent(event)
    })
    expect(onAction).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it("test_keyboard_disabled — when disabled=true, no callbacks fire", () => {
    const { onAction } = setup(false)
    fireKeydown("j")
    fireKeydown("Enter")
    fireKeydown("Backspace")
    fireKeydown("c")
    expect(onAction).not.toHaveBeenCalled()
  })
})
