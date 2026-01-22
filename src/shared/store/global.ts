import { create } from "zustand"
import type { PublicConfig } from "@/config/schema"

type GlobalState = {
  config: PublicConfig | null
  fetchConfig: () => Promise<void>
  refreshConfig: () => Promise<void>
}

export const useGlobalStore = create<GlobalState>()((set, get) => ({
  config: null,
  fetchConfig: async () => {
    if (get().config) return
    if (typeof window === "undefined") return

    const res = await fetch("/api/config/")
    if (!res.ok) throw new Error("Failed to fetch config")
    const json = await res.json()
    set({ config: json.data })
  },
  refreshConfig: async () => {
    if (typeof window === "undefined") return

    const res = await fetch("/api/config/")
    if (!res.ok) throw new Error("Failed to fetch config")
    const json = await res.json()
    set({ config: json.data })
  },
}))
