import {
  BrainIcon,
  CheckIcon,
  EyeIcon,
  FileTextIcon,
  MessageSquareIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react"
import { nanoid } from "nanoid"
import { memo, useCallback, useMemo, useState } from "react"
import { models } from "@/integrations/ai/models"
import type { AIModelMeta } from "@/integrations/ai/types"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/shared/components/ai-elements/conversation"
import { Message, MessageContent, MessageResponse } from "@/shared/components/ai-elements/message"
import { ModelSelectorLogo } from "@/shared/components/ai-elements/model-selector"
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/shared/components/ai-elements/prompt-input"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog"
import { Input } from "@/shared/components/ui/input"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import { cn } from "@/shared/lib/utils"

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

export type ChatDialogProps = {
  className?: string
}

const BRAND_LOGO_OVERRIDES: Record<string, string> = {
  qwen: "alibaba",
  glm: "zhipuai",
  kimi: "moonshotai",
}

function getBrand(modelId: string): string {
  return modelId.split("/")[0] || "other"
}

function getBrandLogo(brand: string): string {
  return BRAND_LOGO_OVERRIDES[brand] || brand
}

type BrandGroup = { brand: string; logo: string; models: AIModelMeta[] }

function buildBrandGroups(allModels: AIModelMeta[]): BrandGroup[] {
  const map: Record<string, AIModelMeta[]> = {}
  const order: string[] = []
  for (const m of allModels) {
    const brand = getBrand(m.id)
    if (!map[brand]) {
      map[brand] = []
      order.push(brand)
    }
    map[brand].push(m)
  }
  return order.map((brand) => ({
    brand,
    logo: getBrandLogo(brand),
    models: map[brand],
  }))
}

interface ModelItemProps {
  model: AIModelMeta
  isSelected: boolean
  onSelect: (id: string) => void
}

const ModelItem = memo(({ model, isSelected, onSelect }: ModelItemProps) => {
  const handleSelect = useCallback(() => onSelect(model.id), [onSelect, model.id])

  return (
    <button
      type="button"
      onClick={handleSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        "hover:bg-accent",
        isSelected && "bg-accent"
      )}
    >
      <ModelSelectorLogo
        provider={getBrandLogo(getBrand(model.id))}
        className="size-5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{model.label}</span>
          {model.tier === "pro" && (
            <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              PRO
            </span>
          )}
          {model.isNew && (
            <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              NEW
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{model.description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {model.capabilities.vision && (
          <div className="inline-flex items-center justify-center rounded bg-secondary/50 p-1">
            <EyeIcon className="size-3 text-muted-foreground" />
          </div>
        )}
        {model.capabilities.reasoning && (
          <div className="inline-flex items-center justify-center rounded bg-secondary/50 p-1">
            <BrainIcon className="size-3 text-muted-foreground" />
          </div>
        )}
        {model.capabilities.pdf && (
          <div className="inline-flex items-center justify-center rounded bg-secondary/50 p-1">
            <FileTextIcon className="size-3 text-muted-foreground" />
          </div>
        )}
        {isSelected && <CheckIcon className="ml-1 size-4 text-primary" />}
      </div>
    </button>
  )
})

ModelItem.displayName = "ModelItem"

const DEFAULT_MODEL = "openai/gpt-4o-mini"

export function ChatDialog({ className }: ChatDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming">("ready")
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)
  const [activeBrand, setActiveBrand] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const brandGroups = useMemo(() => buildBrandGroups(models), [])
  console.log(brandGroups, "brandGroups")

  const currentBrand = activeBrand ?? brandGroups[0]?.brand ?? "openai"

  const filteredModels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      return brandGroups.find((g) => g.brand === currentBrand)?.models ?? []
    }
    return models.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
    )
  }, [searchQuery, currentBrand, brandGroups])

  const currentBrandGroup = brandGroups.find((g) => g.brand === currentBrand)

  const selectedModelData = useMemo(
    () => models.find((m) => m.id === selectedModel),
    [selectedModel]
  )

  const handleModelSelect = useCallback((id: string) => {
    setSelectedModel(id)
    setModelSelectorOpen(false)
  }, [])

  const handleSubmit = useCallback(
    async (message: PromptInputMessage, _event: React.FormEvent<HTMLFormElement>) => {
      const hasText = Boolean(message.text?.trim())
      const hasFiles = Boolean(message.files?.length)
      if (!hasText && !hasFiles) return

      const userMessage: ChatMessage = {
        id: nanoid(),
        role: "user",
        content: message.text || (hasFiles ? `[${message.files!.length} file(s) attached]` : ""),
      }
      setMessages((prev) => [...prev, userMessage])
      setStatus("submitted")

      await new Promise((r) => setTimeout(r, 300))
      setStatus("streaming")

      const assistantMessage: ChatMessage = {
        id: nanoid(),
        role: "assistant",
        content: `You said: "${userMessage.content}"`,
      }
      setMessages((prev) => [...prev, assistantMessage])
      setStatus("ready")
    },
    []
  )

  const selectedBrand = selectedModelData ? getBrand(selectedModelData.id) : "openai"

  return (
    <div
      className={cn("flex flex-col size-full min-h-0 rounded-lg border bg-background", className)}
    >
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Conversation className="relative size-full">
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                description="Type a message below to start the conversation."
                icon={<MessageSquareIcon className="size-6" />}
                title="Start a conversation"
              />
            ) : (
              messages.map((msg) => (
                <Message
                  from={msg.role}
                  key={msg.id}
                >
                  <MessageContent>
                    <MessageResponse>{msg.content}</MessageResponse>
                  </MessageContent>
                </Message>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      <div className="shrink-0 border-t p-4">
        <PromptInputProvider>
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea placeholder="What would you like to know?" />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <Dialog
                  open={modelSelectorOpen}
                  onOpenChange={(open) => {
                    setModelSelectorOpen(open)
                    if (!open) setSearchQuery("")
                  }}
                >
                  <DialogTrigger asChild>
                    <PromptInputButton>
                      <ModelSelectorLogo provider={getBrandLogo(selectedBrand)} />
                      <span className="truncate text-left">
                        {selectedModelData?.label || "Select Model"}
                      </span>
                    </PromptInputButton>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl gap-0 overflow-hidden border p-0">
                    <DialogTitle className="sr-only">Select Model</DialogTitle>
                    <div className="flex h-112">
                      {/* Left sidebar */}
                      <div className="flex w-14 shrink-0 flex-col items-center gap-1 overflow-hidden border-r bg-muted/30 py-3">
                        <TooltipProvider delayDuration={0}>
                          <ScrollArea className="flex-1 overflow-hidden no-scrollbar">
                            <div className="flex flex-col items-center gap-1 px-1.5 pb-2">
                              {brandGroups.map((group) => (
                                <Tooltip key={group.brand}>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveBrand(group.brand)
                                        setSearchQuery("")
                                      }}
                                      className={cn(
                                        "flex size-9 items-center justify-center rounded-lg transition-colors",
                                        "hover:bg-accent",
                                        currentBrand === group.brand &&
                                          !searchQuery &&
                                          "bg-accent ring-1 ring-border"
                                      )}
                                    >
                                      <ModelSelectorLogo
                                        provider={group.logo}
                                        className="size-4"
                                      />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="right"
                                    className="text-xs"
                                  >
                                    {group.brand.charAt(0).toUpperCase() + group.brand.slice(1)}
                                    <span className="ml-1 text-muted-foreground">
                                      ({group.models.length})
                                    </span>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </div>
                          </ScrollArea>
                        </TooltipProvider>
                      </div>

                      {/* Right content */}
                      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                        {/* Search */}
                        <div className="border-b px-4 py-3">
                          <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Search models..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-9 h-9"
                            />
                          </div>
                        </div>

                        {/* Header */}
                        {!searchQuery && currentBrandGroup && (
                          <div className="flex items-center gap-2 border-b px-4 py-2.5">
                            <ModelSelectorLogo
                              provider={currentBrandGroup.logo}
                              className="size-4"
                            />
                            <span className="text-sm font-medium">
                              {currentBrandGroup.brand.charAt(0).toUpperCase() +
                                currentBrandGroup.brand.slice(1)}
                            </span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {currentBrandGroup.models.length} models
                            </span>
                          </div>
                        )}

                        {searchQuery && (
                          <div className="flex items-center gap-2 border-b px-4 py-2.5">
                            <SparklesIcon className="size-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Search Results</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {filteredModels.length} models
                            </span>
                          </div>
                        )}

                        {/* Model list */}
                        <ScrollArea className="flex-1 overflow-hidden no-scrollbar">
                          <div className="flex flex-col gap-0.5 p-2">
                            {filteredModels.length > 0 ? (
                              filteredModels.map((m) => (
                                <ModelItem
                                  key={m.id}
                                  model={m}
                                  isSelected={selectedModel === m.id}
                                  onSelect={handleModelSelect}
                                />
                              ))
                            ) : (
                              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                                No models found.
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </PromptInputTools>
              <PromptInputSubmit status={status} />
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>
      </div>
    </div>
  )
}
