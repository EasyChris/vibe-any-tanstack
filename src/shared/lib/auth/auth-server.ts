import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { captcha } from "better-auth/plugins"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { getTranslationContent, type Locale } from "intlayer"

import { verificationEmailTranslations } from "@/config/locale/auth.content"
import { db } from "@/db"
import { sendEmail } from "@/shared/lib/email/send-email"

const isCaptchaEnabled = process.env.TURNSTILE_CAPTCHA_ENABLED === "true"

function getLocaleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split("/").filter(Boolean)
    const locale = pathParts[0]
    if (locale === "zh" || locale === "en") {
      return locale
    }
  } catch {
    // ignore
  }
  return "en"
}

export const auth = betterAuth({
  baseURL: import.meta.env.VITE_APP_URL,
  database: drizzleAdapter(db, { provider: "pg" }),
  plugins: [
    ...(isCaptchaEnabled
      ? [
          captcha({
            provider: "cloudflare-turnstile",
            secretKey: process.env.TURNSTILE_SECRET_KEY!,
          }),
        ]
      : []),
    tanstackStartCookies(),
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const locale = getLocaleFromUrl(url)
      const subject = getTranslationContent(verificationEmailTranslations.subject, locale as Locale)

      await sendEmail({
        to: user.email,
        url,
        locale,
        subject,
        type: "verification",
      })
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
})
