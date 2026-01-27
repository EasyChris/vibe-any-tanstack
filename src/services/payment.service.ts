import { getPlanByPriceId, getPlans } from "@/config/payment-config"
import { findSucceededOneTimePayments } from "@/shared/model/payment.model"
import { findActiveSubscriptionByUserId } from "@/shared/model/subscription.model"
import type { PlanType } from "@/shared/types/payment"

export class PaymentService {
  async checkUserLifetimePurchase(userId: string) {
    const plans = getPlans()
    const lifetimePlanIds = plans
      .filter((plan) => plan.planType === ("lifetime" satisfies PlanType))
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
}
