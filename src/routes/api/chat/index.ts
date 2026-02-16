import { createFileRoute } from "@tanstack/react-router"
import { convertToModelMessages, NoSuchModelError, streamText, type UIMessage } from "ai"
import { getAIProvider, getMaxOutputTokens, getModelParameters } from "@/integrations/ai"
import { Resp } from "@/shared/lib/tools/response"
import { apiAuthMiddleware } from "@/shared/middleware/auth.middleware"

export const Route = createFileRoute("/api/chat/")({
  server: {
    middleware: [apiAuthMiddleware],
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages, model: modelId } = (await request.json()) as {
            messages: UIMessage[]
            model?: string
          }

          const resolvedModelId = modelId || "openai/gpt-4o-mini"
          const provider = await getAIProvider()
          const model = provider.languageModel(resolvedModelId)
          const { minP: _, ...parameters } = getModelParameters(resolvedModelId)
          const maxOutputTokens = getMaxOutputTokens(resolvedModelId)

          const result = streamText({
            model,
            messages: await convertToModelMessages(messages),
            maxOutputTokens,
            ...parameters,
          })

          return result.toUIMessageStreamResponse()
        } catch (error) {
          console.error("[chat] Stream error:", error)
          if (NoSuchModelError.isInstance(error)) {
            return Resp.error(
              `Model "${error.modelId}" is not available. Please check if the provider API key is configured.`,
              400
            )
          }
          return Resp.error(error instanceof Error ? error.message : "Failed to generate response")
        }
      },
    },
  },
})
