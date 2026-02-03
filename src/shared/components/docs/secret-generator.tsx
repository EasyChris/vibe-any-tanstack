"use client"

import { CheckIcon, CopyIcon, KeyIcon } from "lucide-react"
import { useState } from "react"
import { Button } from "@/shared/components/ui/button"

interface SecretGeneratorProps {
  label?: string
}

type CharSet = "a-z" | "A-Z" | "0-9"

const charSetMap: Record<CharSet, string> = {
  "a-z": "abcdefghijklmnopqrstuvwxyz",
  "0-9": "0123456789",
  "A-Z": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
}

function generateRandomString(length: number, ...charSets: CharSet[]) {
  const chars = charSets.map((set) => charSetMap[set]).join("")
  const charsLength = chars.length
  const maxValid = Math.floor(256 / charsLength) * charsLength
  const randomBytes = new Uint8Array(length * 2)
  let result = ""
  let index = randomBytes.length

  while (result.length < length) {
    if (index >= randomBytes.length) {
      crypto.getRandomValues(randomBytes)
      index = 0
    }
    const byte = randomBytes[index++]
    if (byte < maxValid) {
      result += chars[byte % charsLength]
    }
  }

  return result
}

export function SecretGenerator({ label = "Generate" }: SecretGeneratorProps) {
  const [secret, setSecret] = useState<string>("")
  const [copied, setCopied] = useState(false)

  const generateSecret = () => {
    const newSecret = generateRandomString(32, "a-z", "0-9", "A-Z")
    setSecret(newSecret)
    setCopied(false)
  }

  const copyToClipboard = async () => {
    if (!secret) return
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="not-prose my-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!!secret}
          onClick={generateSecret}
        >
          <KeyIcon className="size-4" />
          {label}
        </Button>
      </div>
      {secret && (
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm break-all">
            {secret}
          </code>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={copyToClipboard}
            aria-label="Copy secret"
          >
            {copied ? (
              <CheckIcon className="size-4 text-green-500" />
            ) : (
              <CopyIcon className="size-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
