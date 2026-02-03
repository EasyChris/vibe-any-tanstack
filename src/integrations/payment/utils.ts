import type { orderTypeEnum } from "@/db/order.schema"
import { CreditsType } from "@/shared/types/credit"
import type { PlanInterval, PlanType, PlanWithPrice } from "@/shared/types/payment"

/**
 * Payment type for checkout
 */
export type CheckoutPaymentType = "subscription" | "one_time"

/**
 * Internal payment type for tracking payments
 */
export type InternalPaymentType = "subscription_create" | "subscription_renewal" | "one_time"

/**
 * Order type from database enum
 */
export type OrderType = (typeof orderTypeEnum.enumValues)[number]

/**
 * Get checkout payment type from plan type
 *
 * - subscription -> subscription
 * - lifetime/free -> one_time
 */
export function getCheckoutPaymentType(planType: PlanType): CheckoutPaymentType {
  return planType === "subscription" ? "subscription" : "one_time"
}

/**
 * Get order type from plan
 */
export function getOrderTypeFromPlan(plan: PlanWithPrice): OrderType {
  return plan.planType as OrderType
}

/**
 * Get display text for billing interval
 */
export function getIntervalDisplayText(interval?: PlanInterval): string {
  switch (interval) {
    case "month":
      return "Monthly"
    case "year":
      return "Yearly"
    default:
      return "One-time"
  }
}

/**
 * Get credits type from internal payment type
 */
export function getCreditsType(paymentType: InternalPaymentType): CreditsType {
  return paymentType === "one_time"
    ? CreditsType.ADD_ONE_TIME_PAYMENT
    : CreditsType.ADD_SUBSCRIPTION_PAYMENT
}

/**
 * Check if payment type is subscription-related
 */
export function isSubscriptionPayment(paymentType: InternalPaymentType): boolean {
  return paymentType === "subscription_create" || paymentType === "subscription_renewal"
}

/**
 * Check if payment type is one-time
 */
export function isOneTimePayment(paymentType: InternalPaymentType): boolean {
  return paymentType === "one_time"
}

/**
 * Check if plan type is subscription
 */
export function isSubscriptionPlan(planType: PlanType): boolean {
  return planType === "subscription"
}

/**
 * Check if plan type is lifetime (one-time purchase with permanent access)
 */
export function isLifetimePlan(planType: PlanType): boolean {
  return planType === "lifetime"
}

/**
 * Check if plan type is free
 */
export function isFreePlan(planType: PlanType): boolean {
  return planType === "free"
}

/**
 * Generate product name for order
 */
export function generateProductName(planName: string, interval?: PlanInterval): string {
  return `${planName} - ${getIntervalDisplayText(interval)}`
}
