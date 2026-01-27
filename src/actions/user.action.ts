import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { UserService } from "@/services/user.service"
import { auth } from "@/shared/lib/auth/auth-server"
import type { UserInfo } from "@/shared/types/user"

export const getUserInfoFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<UserInfo> => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    const userId = session?.user?.id

    if (!userId) {
      return {
        user: null,
        payment: { activePlan: null, activeSubscription: null },
      }
    }

    const userService = new UserService()
    return userService.getUserInfo(userId)
  }
)
