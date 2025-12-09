import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPlayerName(name: string): string {
  const cleanedName = name.replace(/[,.;]/g, "").trim()
  const parts = cleanedName.split(" ").filter((part) => part.length > 0)

  const specialCases: Record<string, string> = {
    "Praggnanandhaa": "Pragg",
    "Nepomniachtchi": "Nepo",
    "Goryachkina": "Gorya",
    "Gukesh": "Gukesh",
    "Carlsen": "Magnus",
    "Nakamura": "Hikaru",
  }

  for (const [key, value] of Object.entries(specialCases)) {
    if (parts.some(p => p.includes(key))) return value
  }

  let shortestName = parts[0] || ""
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].length >= 3 && parts[i].length < shortestName.length) {
      shortestName = parts[i]
    }
  }

  if (shortestName.length < 3) {
    shortestName = parts[0] || ""
  }

  return shortestName.slice(0, 10)
}

export function formatClock(seconds: number): string {
  if (seconds < 1) return "0:00:00"
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export function clockToSeconds(clock: string): number {
  const parts = clock.split(":")
  if (parts.length !== 3) return 0
  return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2])
}

export function getEvalBarWidth(evaluation: number | null, result: string | null): string {
  if (result === "1-0") return "100%"
  if (result === "0-1") return "0%"
  if (result === "1/2-1/2" || result === "Draw") return "50%"
  
  if (evaluation === null) return "50%"
  if (evaluation >= 99) return "100%"
  if (evaluation <= -99) return "0%"
  if (evaluation >= 4) return "90%"
  if (evaluation <= -4) return "10%"
  
  const segment = Math.min(Math.max(Math.round(evaluation), -5), 5)
  return `${50 + segment * 7.5}%`
}

export function formatEvaluation(evaluation: number | null): string {
  if (evaluation === null) return "..."
  if (evaluation > 100 || evaluation < -100) return "M"
  return evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1)
}
