"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "ravenbase-theme"

export function useTheme() {
  // AC-7: Default to light mode (false = not dark)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Read stored preference from localStorage
    const stored = localStorage.getItem(STORAGE_KEY)

    // Determine effective dark state:
    // 1. If 'dark' stored explicitly → dark
    // 2. If 'light' stored explicitly → light
    // 3. If nothing stored → respect system preference
    // 4. If system prefers dark → dark
    // 5. Otherwise → light (default)
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const dark = stored === "dark" || (!stored && prefersDark)

    // Initialize state
    setIsDark(dark)

    // AC-2: Apply .dark class to documentElement
    document.documentElement.classList.toggle("dark", dark)
  }, []) // Empty deps = run once on mount

  const toggle = () => {
    // Add transitioning class for smooth animation (250ms)
    document.documentElement.classList.add("transitioning")

    const next = !isDark
    setIsDark(next)

    // AC-2: Add or remove .dark class
    document.documentElement.classList.toggle("dark", next)

    // AC-3: Persist to localStorage
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light")

    // Remove transitioning class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove("transitioning")
    }, 250)
  }

  return { isDark, toggle }
}
