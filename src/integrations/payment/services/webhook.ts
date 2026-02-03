import { eq } from "drizzle-orm"
import { db } from "@/db"
import { type ProviderCustomers, user } from "@/db/auth.schema"
import { isOneTimePayment } from "@/integrations/payment/utils"
import { OrderService } from "@/services/order.service"
import { logger } from "@/shared/lib/tools/logger"
import { findOrderById } from "@/shared/model/order.model"
import { findPaymentByProviderId, insertPayment, updatePayment } from "@/shared/model/payment.model"
import {
  findSubscriptionByProviderId,
  insertSubscription,
  updateSubscription,
  updateSubscriptionById,
} from "@/shared/model/subscription.model"
import type { PaymentProvider } from "@/shared/types/payment"
import type { WebhookEvent } from "../types"

async function updateUserProviderCustomer(
  userId: string,
  provider: PaymentProvider,
  providerCustomerId: string
) {
  const [existingUser] = await db.select().from(user).where(eq(user.id, userId)).limit(1)

  if (!existingUser) {
    logger.warn(`User not found for provider customer update: ${userId}`)
    return
  }

  const currentCustomers = (existingUser.providerCustomers as ProviderCustomers) || {}

  if (currentCustomers[provider] === providerCustomerId) {
    return
  }

  await db
    .update(user)
    .set({
      providerCustomers: {
        ...currentCustomers,
        [provider]: providerCustomerId,
      },
    })
    .where(eq(user.id, userId))

  logger.info(`Updated provider customer for user ${userId}: ${provider} -> ${providerCustomerId}`)
}

/**
 * Process webhook event from payment provider
 */
export async function processWebhookEvent(event: WebhookEvent): Promise<void> {
  if (event.type === "ignored") {
    return
  }

  logger.info(`Processing webhook event: ${event.provider} - ${event.type}`)

  switch (event.type) {
    case "checkout.completed":
      await handleCheckoutCompleted(event)
      break

    case "payment.succeeded":
      await handlePaymentSucceeded(event)
      break

    case "payment.failed":
      await handlePaymentFailed(event)
      break

    case "subscription.created":
      await handleSubscriptionCreated(event)
      break

    case "subscription.updated":
      await handleSubscriptionUpdated(event)
      break

    case "subscription.canceled":
      await handleSubscriptionCanceled(event)
      break

    case "refund.created":
      await handleRefundCreated(event)
      break
  }
}

async function handleCheckoutCompleted(event: WebhookEvent): Promise<void> {
  const { payment: paymentInfo } = event
  if (!paymentInfo) {
    logger.warn("checkout.completed event missing payment info")
    return
  }

  logger.info(`Checkout completed: ${paymentInfo.providerPaymentId}`)

  // For subscriptions (cycleType === "create"), payment will be handled by payment.succeeded
  if (paymentInfo.cycleType === "create") {
    logger.info("Subscription checkout, waiting for payment.succeeded event")
    return
  }

  // One-time payment - process here since checkout completion means payment success
  const userId = paymentInfo.userId
  const orderId = paymentInfo.orderId

  if (!userId) {
    logger.error("checkout.completed: userId is missing for one-time payment")
    return
  }

  await db.transaction(async (tx) => {
    // Check idempotency
    const existing = await findPaymentByProviderId(paymentInfo.providerPaymentId, tx)
    if (existing) {
      logger.info(`Payment already exists: ${paymentInfo.providerPaymentId}, skipping`)
      return
    }

    // Update order status
    if (orderId) {
      const order = await findOrderById(orderId, tx)
      if (order && order.status === "pending") {
        const orderService = new OrderService()
        await orderService.markOrderPaid(orderId, tx)
        logger.info(`Order marked as paid: ${orderId}`)
      }
    }

    // Save provider customer ID to user
    if (paymentInfo.providerCustomerId) {
      await updateUserProviderCustomer(userId, event.provider, paymentInfo.providerCustomerId)
    }

    // Create payment record
    const newPayment = await insertPayment(
      {
        provider: event.provider,
        providerPaymentId: paymentInfo.providerPaymentId,
        providerInvoiceId: paymentInfo.providerInvoiceId,
        userId,
        orderId,
        paymentType: "one_time",
        amount: paymentInfo.amount,
        currency: paymentInfo.currency,
        status: "succeeded",
        planId: paymentInfo.planId,
        priceId: paymentInfo.priceId,
        metadata: paymentInfo.metadata,
      },
      tx
    )

    logger.info(
      `Payment created from checkout: ${newPayment.id} (one_time) for order ${orderId || "N/A"}`
    )

    // Process credits for credit package purchase
    const creditAmount = paymentInfo.metadata?.creditAmount
    if (creditAmount) {
      const { CreditService } = await import("@/services/credits.service")
      const { CreditsType } = await import("@/shared/types/credit")

      const creditService = new CreditService()
      const expireDaysStr = paymentInfo.metadata?.expireDays
      const expireDays =
        expireDaysStr && expireDaysStr !== "null" ? parseInt(expireDaysStr, 10) : undefined

      let expiresAt: Date | undefined
      if (expireDays) {
        expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + expireDays)
      }

      await creditService.increaseCredits({
        userId,
        credits: parseInt(creditAmount, 10),
        creditsType: CreditsType.ADD_ONE_TIME_PAYMENT,
        paymentId: newPayment.id,
        expiresAt,
        description: `Credit package purchase`,
        tx,
      })

      logger.info(`Added ${creditAmount} credits for user ${userId} from credit package purchase`)
    } else if (paymentInfo.planId) {
      // For subscription plans with credit configuration
      const { processCredits } = await import("@/integrations/payment/services/credits")
      await processCredits({
        userId,
        planId: paymentInfo.planId,
        paymentId: newPayment.id,
        paymentType: "one_time",
        tx,
      })
    }
  })
}

async function handlePaymentSucceeded(event: WebhookEvent): Promise<void> {
  const { payment: paymentInfo, subscription: subscriptionInfo } = event
  if (!paymentInfo) {
    logger.warn("payment.succeeded event missing payment info")
    return
  }

  await db.transaction(async (tx) => {
    // Check idempotency
    const existing = await findPaymentByProviderId(paymentInfo.providerPaymentId, tx)
    if (existing) {
      logger.info(`Payment already exists: ${paymentInfo.providerPaymentId}, skipping`)
      return
    }

    // Determine payment type
    let paymentType: "subscription_create" | "subscription_renewal" | "one_time" = "one_time"
    let subscriptionId: string | undefined
    let orderId: string | undefined = paymentInfo.orderId

    if (paymentInfo.cycleType === "create") {
      paymentType = "subscription_create"
    } else if (paymentInfo.cycleType === "renewal") {
      paymentType = "subscription_renewal"
    }

    // Validate and update order status, get userId from order if missing
    let userId = paymentInfo.userId
    if (orderId) {
      const order = await findOrderById(orderId, tx)
      if (order) {
        if (!userId) {
          userId = order.userId
          logger.info(`Using userId from order: ${userId}`)
        }
        if (order.status === "pending") {
          const orderService = new OrderService()
          await orderService.markOrderPaid(orderId, tx)
          logger.info(`Order marked as paid: ${orderId}`)
        } else if (order.status === "paid") {
          logger.info(`Order already paid: ${orderId}`)
        } else {
          logger.warn(`Order ${orderId} has unexpected status: ${order.status}`)
        }
      } else {
        logger.warn(`Order not found: ${orderId}`)
        orderId = undefined
      }
    }

    // For one-time payments without userId (already handled by checkout.completed), skip
    if (!userId && isOneTimePayment(paymentType)) {
      logger.info(`Skipping one-time payment without userId (likely handled by checkout.completed)`)
      return
    }

    if (!userId) {
      logger.error(`Cannot create payment record: userId is missing`)
      return
    }

    // Save provider customer ID to user
    if (paymentInfo.providerCustomerId) {
      await updateUserProviderCustomer(userId, event.provider, paymentInfo.providerCustomerId)
    }

    // Handle subscription if present
    if (subscriptionInfo) {
      const existingSub = await findSubscriptionByProviderId(
        subscriptionInfo.providerSubscriptionId,
        tx
      )

      if (existingSub) {
        subscriptionId = existingSub.id

        // Update subscription period for renewals
        if (paymentType === "subscription_renewal") {
          await updateSubscriptionById(
            subscriptionId,
            {
              currentPeriodStart: subscriptionInfo.currentPeriodStart,
              currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
              status: subscriptionInfo.status,
            },
            tx
          )
        }
      }
    }

    // Create payment record with orderId
    const newPayment = await insertPayment(
      {
        provider: event.provider,
        providerPaymentId: paymentInfo.providerPaymentId,
        providerInvoiceId: paymentInfo.providerInvoiceId,
        userId,
        orderId,
        subscriptionId,
        paymentType,
        amount: paymentInfo.amount,
        currency: paymentInfo.currency,
        status: "succeeded",
        planId: paymentInfo.planId,
        priceId: paymentInfo.priceId,
        metadata: paymentInfo.metadata,
      },
      tx
    )

    logger.info(`Payment created: ${newPayment.id} (${paymentType}) for order ${orderId || "N/A"}`)

    // Process credits
    if (paymentInfo.planId && userId) {
      const { processCredits } = await import("@/integrations/payment/services/credits")
      await processCredits({
        userId,
        planId: paymentInfo.planId,
        paymentId: newPayment.id,
        paymentType,
        periodEnd: subscriptionInfo?.currentPeriodEnd,
        tx,
      })
    }
  })
}

async function handlePaymentFailed(event: WebhookEvent): Promise<void> {
  const { payment: paymentInfo } = event
  if (!paymentInfo) {
    logger.warn("payment.failed event missing payment info")
    return
  }

  logger.warn(`Payment failed: ${paymentInfo.providerPaymentId}`)
  // TODO: Send notification to user
}

async function handleSubscriptionCreated(event: WebhookEvent): Promise<void> {
  const { subscription: subscriptionInfo } = event
  if (!subscriptionInfo) {
    logger.warn("subscription.created event missing subscription info")
    return
  }

  // Check idempotency
  const existing = await findSubscriptionByProviderId(subscriptionInfo.providerSubscriptionId)
  if (existing) {
    logger.info(`Subscription already exists: ${subscriptionInfo.providerSubscriptionId}, skipping`)
    return
  }

  // Save provider customer ID to user
  if (subscriptionInfo.userId && subscriptionInfo.providerCustomerId) {
    await updateUserProviderCustomer(
      subscriptionInfo.userId,
      event.provider,
      subscriptionInfo.providerCustomerId
    )
  }

  const newSubscription = await insertSubscription({
    provider: event.provider,
    providerSubscriptionId: subscriptionInfo.providerSubscriptionId,
    providerCustomerId: subscriptionInfo.providerCustomerId,
    userId: subscriptionInfo.userId || "",
    planId: subscriptionInfo.planId || "",
    priceId: subscriptionInfo.priceId || "",
    status: subscriptionInfo.status,
    interval: subscriptionInfo.interval,
    amount: subscriptionInfo.amount?.toString(),
    currency: subscriptionInfo.currency,
    currentPeriodStart: subscriptionInfo.currentPeriodStart,
    currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
    cancelAtPeriodEnd: subscriptionInfo.cancelAtPeriodEnd,
    trialStart: subscriptionInfo.trialStart,
    trialEnd: subscriptionInfo.trialEnd,
  })

  logger.info(`Subscription created: ${newSubscription.id}`)
}

async function handleSubscriptionUpdated(event: WebhookEvent): Promise<void> {
  const { subscription: subscriptionInfo } = event
  if (!subscriptionInfo) {
    logger.warn("subscription.updated event missing subscription info")
    return
  }

  const result = await updateSubscription(subscriptionInfo.providerSubscriptionId, {
    status: subscriptionInfo.status,
    planId: subscriptionInfo.planId,
    priceId: subscriptionInfo.priceId,
    interval: subscriptionInfo.interval,
    amount: subscriptionInfo.amount?.toString(),
    currency: subscriptionInfo.currency,
    currentPeriodStart: subscriptionInfo.currentPeriodStart,
    currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
    cancelAtPeriodEnd: subscriptionInfo.cancelAtPeriodEnd,
    canceledAt: subscriptionInfo.canceledAt,
    cancelReason: subscriptionInfo.cancelReason,
    trialStart: subscriptionInfo.trialStart,
    trialEnd: subscriptionInfo.trialEnd,
  })

  if (result) {
    logger.info(`Subscription updated: ${result.id}`)
  } else {
    logger.warn(`Subscription not found: ${subscriptionInfo.providerSubscriptionId}`)
  }
}

async function handleSubscriptionCanceled(event: WebhookEvent): Promise<void> {
  const { subscription: subscriptionInfo } = event
  if (!subscriptionInfo) {
    logger.warn("subscription.canceled event missing subscription info")
    return
  }

  const result = await updateSubscription(subscriptionInfo.providerSubscriptionId, {
    status: "canceled",
    cancelAtPeriodEnd: true,
    canceledAt: subscriptionInfo.canceledAt || new Date(),
    cancelReason: subscriptionInfo.cancelReason,
  })

  if (result) {
    logger.info(`Subscription canceled: ${result.id}`)
  } else {
    logger.warn(`Subscription not found: ${subscriptionInfo.providerSubscriptionId}`)
  }
}

async function handleRefundCreated(event: WebhookEvent): Promise<void> {
  const { payment: paymentInfo } = event
  if (!paymentInfo) {
    logger.warn("refund.created event missing payment info")
    return
  }

  const result = await updatePayment(paymentInfo.providerPaymentId, {
    status: paymentInfo.status,
    refundedAt: new Date(),
    refundAmount: paymentInfo.amount,
  })

  if (result) {
    logger.info(`Payment refunded: ${result.id}`)

    // Update order status to refunded if orderId exists
    if (result.orderId) {
      const orderService = new OrderService()
      await orderService.markOrderRefunded(result.orderId)
    }

    // TODO: Handle credit deduction for refunds
  } else {
    logger.warn(`Payment not found for refund: ${paymentInfo.providerPaymentId}`)
  }
}
