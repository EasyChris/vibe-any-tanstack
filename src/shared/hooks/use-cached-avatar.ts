import { useEffect, useState } from "react"

const AVATAR_CACHE_PREFIX = "avatar_cache_"
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

type CachedData = {
  base64: string
  timestamp: number
}

function getCacheKey(url: string): string {
  const hash = url.split("").reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0
  }, 0)
  return `${AVATAR_CACHE_PREFIX}${Math.abs(hash)}`
}

function getFromCache(url: string): string | null {
  try {
    const key = getCacheKey(url)
    const cached = localStorage.getItem(key)
    if (!cached) return null

    const data: CachedData = JSON.parse(cached)
    if (Date.now() - data.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(key)
      return null
    }
    return data.base64
  } catch {
    return null
  }
}

function saveToCache(url: string, base64: string): void {
  try {
    const key = getCacheKey(url)
    const data: CachedData = {
      base64,
      timestamp: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // localStorage might be full, ignore
  }
}

async function fetchAndCacheImage(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }

  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      saveToCache(url, base64)
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function useCachedAvatar(src: string | undefined | null) {
  const [cachedSrc, setCachedSrc] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!src) {
      setIsLoading(false)
      setCachedSrc(undefined)
      return
    }

    if (src.startsWith("data:")) {
      setCachedSrc(src)
      setIsLoading(false)
      return
    }

    const cached = getFromCache(src)
    if (cached) {
      setCachedSrc(cached)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    fetchAndCacheImage(src)
      .then((base64) => {
        setCachedSrc(base64)
      })
      .catch((err) => {
        setError(err)
        setCachedSrc(src)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [src])

  return { cachedSrc, isLoading, error }
}
