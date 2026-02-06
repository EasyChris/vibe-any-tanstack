import { getPlanByPriceId, getPlans } from "@/config/payment-config"
import { getPaymentAdapter } from "@/integrations/payment"
import { isLifetimePlan } from "@/integrations/payment/utils"
import { findSucceededOneTimePayments } from "@/shared/model/payment.model"
import {
  findActiveSubscriptionByUserId,
  findSubscriptionById,
  updateSubscriptionById,
} from "@/shared/model/subscription.model"

export class PaymentService {
  async checkUserLifetimePurchase(userId: string) {
    const plans = getPlans()
    const lifetimePlanIds = plans
      .filter((plan) => isLifetimePlan(plan.planType))
      .map((plan) => plan.id)

    if (lifetimePlanIds.length === 0) {
      return {
        existsLifetimePayment: false,
        lifetimePriceId: undefined,
      }
    }

    const payments = await findSucceededOneTimePayments(userId)

    const lifetimePayment = payments.find((paymentRecord) => {
      if (!paymentRecord.priceId) return false
      const plan = getPlanByPriceId(paymentRecord.priceId)
      return plan && lifetimePlanIds.includes(plan.id)
    })

    return {
      existsLifetimePayment: !!lifetimePayment,
      lifetimePriceId: lifetimePayment?.priceId,
    }
  }

  async getUserActiveSubscription(userId: string) {
    const activeSubscription = await findActiveSubscriptionByUserId(userId)

    if (!activeSubscription) {
      return null
    }

    return {
      id: activeSubscription.id,
      provider: activeSubscription.provider,
      userId: activeSubscription.userId,
      planId: activeSubscription.planId,
      priceId: activeSubscription.priceId,
      status: activeSubscription.status,
      interval: activeSubscription.interval,
      currentPeriodStart: activeSubscription.currentPeriodStart,
      currentPeriodEnd: activeSubscription.currentPeriodEnd,
      cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
      trialStart: activeSubscription.trialStart,
      trialEnd: activeSubscription.trialEnd,
      createdAt: activeSubscription.createdAt,
    }
  }

  async cancelSubscription(userId: string, subscriptionId: string) {
    const sub = await findSubscriptionById(subscriptionId)

    if (!sub) {
      throw new Error("Subscription not found")
    }

    if (sub.userId !== userId) {
      throw new Error("Subscription does not belong to this user")
    }

    if (sub.status !== "active" && sub.status !== "trialing") {
      throw new Error("Only active or trialing subscriptions can be canceled")
    }

    if (sub.cancelAtPeriodEnd) {
      throw new Error("Subscription is already scheduled for cancellation")
    }

    if (!sub.providerSubscriptionId) {
      throw new Error("Subscription has no provider subscription ID")
    }

    const adapter = await getPaymentAdapter(sub.provider)

    if (!adapter.cancelSubscription) {
      throw new Error(`Provider ${sub.provider} does not support subscription cancellation`)
    }

    await adapter.cancelSubscription(sub.providerSubscriptionId)

    await updateSubscriptionById(sub.id, {
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
    })
  }
}
