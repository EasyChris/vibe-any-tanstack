import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { CreditService } from "@/services/credits.service"
import { auth } from "@/shared/lib/auth/auth-server"
import type { UserCredits } from "@/shared/types/user"

export const getUserCreditsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<UserCredits> => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    const userId = session?.user?.id

    if (!userId) {
      return { userCredits: 0, dailyBonusCredits: 0, nextRefreshTime: null }
    }

    const creditService = new CreditService()
    return creditService.getUserCredits(userId)
  }
)
