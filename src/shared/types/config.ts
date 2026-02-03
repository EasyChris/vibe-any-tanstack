import type { PaymentProvider, PlanWithPrice } from "@/shared/types/payment"

export type MailConfig = {
  provider: "resend" | "custom"
  contact: string
}

export type StorageConfig = {
  provider: "cloudflare" | string
}

export type PaymentConfig = {
  enabled: boolean
  provider: PaymentProvider
  plans: PlanWithPrice[]
}

export type WebsiteConfig = {
  plans?: PlanWithPrice[]
}
