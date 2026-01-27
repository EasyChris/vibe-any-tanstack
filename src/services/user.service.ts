import { getPlanByPriceId, getPlans } from "@/config/payment-config"
import { findSucceededOneTimePayments } from "@/shared/model/payment.model"
import { findActiveSubscriptionByUserId } from "@/shared/model/subscription.model"
import { findUserById } from "@/shared/model/user.model"
import type { PaymentProvider, PlanWithPrice, Subscription } from "@/shared/types/payment"
import type { UserInfo } from "@/shared/types/user"

export class UserService {
  async getUserInfo(userId: string): Promise<UserInfo> {
    const [userData, paymentInfo] = await Promise.all([
      findUserById(userId),
      this.getPaymentInfo(userId),
    ])

    return {
      user: userData,
      payment: paymentInfo,
    }
  }

  private async getPaymentInfo(userId: string): Promise<{
    activePlan: PlanWithPrice | null
    activeSubscription: Subscription | null
  }> {
    const plans = getPlans()
    const freePlans = plans.filter((plan) => plan.planType === "free")
    const subscriptionPlans = plans.filter((plan) => plan.planType === "subscription")
    const lifetimePlans = plans.filter((plan) => plan.planType === "lifetime")

    const defaultFreePlan = freePlans[0] ?? null

    if (lifetimePlans.length > 0) {
      const lifetimePlanIds = lifetimePlans.map((plan) => plan.id)
      const payments = await findSucceededOneTimePayments(userId)

      const lifetimePayment = payments.find((p) => {
        if (!p.priceId) return false
        const plan = getPlanByPriceId(p.priceId)
        return plan && lifetimePlanIds.includes(plan.id)
      })

      if (lifetimePayment?.priceId) {
        const lifetimePlan = lifetimePlans.find((plan) =>
          plan.prices.some((price) => price.priceId === lifetimePayment.priceId)
        )
        if (lifetimePlan) {
          return { activePlan: lifetimePlan, activeSubscription: null }
        }
      }
    }

    const activeSubscriptionData = await findActiveSubscriptionByUserId(userId)

    if (activeSubscriptionData) {
      const activeSubscription: Subscription = {
        id: activeSubscriptionData.id,
        provider: activeSubscriptionData.provider as PaymentProvider,
        userId: activeSubscriptionData.userId,
        planId: activeSubscriptionData.planId,
        priceId: activeSubscriptionData.priceId,
        status: activeSubscriptionData.status,
        interval: activeSubscriptionData.interval ?? undefined,
        currentPeriodStart: activeSubscriptionData.currentPeriodStart ?? undefined,
        currentPeriodEnd: activeSubscriptionData.currentPeriodEnd ?? undefined,
        cancelAtPeriodEnd: activeSubscriptionData.cancelAtPeriodEnd ?? undefined,
        trialStart: activeSubscriptionData.trialStart ?? undefined,
        trialEnd: activeSubscriptionData.trialEnd ?? undefined,
        createdAt: activeSubscriptionData.createdAt,
      }

      const subscriptionPlan = subscriptionPlans.find((plan) =>
        plan.prices.some((price) => price.priceId === activeSubscription.priceId)
      )

      return {
        activePlan: subscriptionPlan ?? defaultFreePlan,
        activeSubscription,
      }
    }

    return { activePlan: defaultFreePlan, activeSubscription: null }
  }
}
