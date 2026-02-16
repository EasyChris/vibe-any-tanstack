import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { MessageSquareIcon } from "lucide-react"
import { useRef, useState } from "react"
import { useIntlayer } from "react-intlayer"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/shared/components/ai-elements/conversation"
import { Message, MessageContent, MessageResponse } from "@/shared/components/ai-elements/message"
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/shared/components/ai-elements/prompt-input"
import { ModelPicker } from "@/shared/components/chat/model-picker"
import { cn } from "@/shared/lib/utils"

export type ChatPanelProps = {
  className?: string
}

const DEFAULT_MODEL = "openai/gpt-4o-mini"

function getMessageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text)
    .join("")
}

export function ChatPanel({ className }: ChatPanelProps) {
  const { chat } = useIntlayer("ai")
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)
  const modelRef = useRef(selectedModel)
  modelRef.current = selectedModel
  console.log("modelRef.current", modelRef.current)
  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/chat/",
        body: () => ({ model: modelRef.current }),
      })
  )

  const { messages, sendMessage, status, stop } = useChat({ transport })

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text?.trim())
    const hasFiles = Boolean(message.files?.length)
    if (!hasText && !hasFiles) return

    if (hasFiles && message.files!.length > 0) {
      sendMessage({
        role: "user",
        parts: [
          ...(hasText ? [{ type: "text" as const, text: message.text }] : []),
          ...message.files!.map((f) => ({
            type: "file" as const,
            url: f.url,
            mediaType: f.mediaType,
            filename: f.filename,
          })),
        ],
      })
    } else {
      sendMessage({ text: message.text })
    }
  }

  return (
    <div
      className={cn("flex flex-col size-full min-h-0 rounded-lg border bg-background", className)}
    >
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Conversation className="relative size-full">
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                description={chat.emptyDescription.value}
                icon={<MessageSquareIcon className="size-6" />}
                title={chat.emptyTitle.value}
              />
            ) : (
              messages.map((msg) => (
                <Message
                  from={msg.role}
                  key={msg.id}
                >
                  <MessageContent>
                    <MessageResponse>{getMessageText(msg.parts)}</MessageResponse>
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
              <PromptInputTextarea placeholder={chat.placeholder.value} />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <ModelPicker
                  selectedModel={selectedModel}
                  onModelSelect={setSelectedModel}
                />
              </PromptInputTools>
              <PromptInputSubmit
                status={status}
                onStop={stop}
              />
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>
      </div>
    </div>
  )
}
