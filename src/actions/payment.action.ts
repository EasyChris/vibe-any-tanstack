import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { z } from "zod"
import { PaymentService } from "@/services/payment.service"
import { auth } from "@/shared/lib/auth/auth-server"
import { logger } from "@/shared/lib/tools/logger"

const userIdSchema = z.object({
  userId: z.string().min(1, { message: "User ID must be provided" }),
})

export const checkUserLifetimePurchaseAction = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => userIdSchema.parse(data))
  .handler(async ({ data }) => {
    const { userId } = data

    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session?.user) {
      logger.error(`Unauthorized user id: ${userId}`)
      return {
        success: false,
        error: "Unauthorized",
      }
    }

    try {
      const paymentService = new PaymentService()
      const result = await paymentService.checkUserLifetimePurchase(userId)

      return {
        success: true,
        data: result,
      }
    } catch (error) {
      logger.error(`Get lifetime status failed: ${error}`)
      return {
        success: false,
        error: "Get lifetime status failed",
      }
    }
  })

export const getUserActiveSubscriptionAction = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => userIdSchema.parse(data))
  .handler(async ({ data }) => {
    const { userId } = data

    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session?.user) {
      logger.error(`Unauthorized user id: ${userId}`)
      return {
        success: false,
        error: "Unauthorized",
      }
    }

    try {
      const paymentService = new PaymentService()
      const activeSubscription = await paymentService.getUserActiveSubscription(session.user.id)

      if (!activeSubscription) {
        logger.info(`No active subscription found for userId: ${session.user.id}`)
        return { success: true, data: null }
      }

      logger.info(`Find active subscription for userId: ${session.user.id}`)
      return {
        success: true,
        data: activeSubscription,
      }
    } catch (error) {
      logger.error(`Get active subscription failed: ${error}`)
      return {
        success: false,
        message: "Get active subscription failed",
        error: error instanceof Error ? error.message : "Something went wrong",
      }
    }
  })
