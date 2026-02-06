import { createFileRoute } from "@tanstack/react-router"
import { PaymentService } from "@/services/payment.service"
import { logger } from "@/shared/lib/tools/logger"
import { Resp } from "@/shared/lib/tools/response"
import { apiAuthMiddleware } from "@/shared/middleware/auth.middleware"

export const Route = createFileRoute("/api/payment/subscription/cancel")({
  server: {
    middleware: [apiAuthMiddleware],
    handlers: {
      POST: async ({ context, request }) => {
        try {
          const { user } = context.session
          const body = await request.json()
          const { subscriptionId } = body

          if (!subscriptionId) {
            return Resp.error("Missing required parameter: subscriptionId", 400)
          }

          const paymentService = new PaymentService()
          await paymentService.cancelSubscription(user.id, subscriptionId)

          logger.info(`Subscription cancel scheduled: ${subscriptionId} by user ${user.id}`)

          return Resp.success()
        } catch (error) {
          logger.error("Error canceling subscription:", error)
          const message = error instanceof Error ? error.message : "Unknown error"
          return Resp.error(message, 400)
        }
      },
    },
  },
})
