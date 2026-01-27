import { createFileRoute } from "@tanstack/react-router"
import { CreditService } from "@/services/credits.service"
import { Resp } from "@/shared/lib/tools/response"
import { strictAuthMiddleware } from "@/shared/middleware/auth.middleware"

export const Route = createFileRoute("/api/credit/history")({
  server: {
    middleware: [strictAuthMiddleware],
    handlers: {
      GET: async ({ context, request }) => {
        try {
          const userId = context.session?.user.id

          if (!userId) {
            return Resp.error("Unauthorized", 401)
          }

          const url = new URL(request.url)
          const page = Number(url.searchParams.get("page")) || 1
          const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 100)
          const days = Number(url.searchParams.get("days")) || undefined

          const creditService = new CreditService()
          const history = await creditService.getUserCreditsHistory(userId, page, limit, days)

          return Resp.success(history)
        } catch (error) {
          console.error("Failed to fetch credit history:", error)
          return Resp.error("Failed to fetch credit history")
        }
      },
    },
  },
})
