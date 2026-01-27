import { redirect } from "@tanstack/react-router"
import { createMiddleware } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { auth } from "@/shared/lib/auth/auth-server"
import { Resp } from "@/shared/lib/tools/response"
import { isUserAdmin } from "@/shared/model/rabc.model"

type Session = Awaited<ReturnType<typeof auth.api.getSession>>

/**
 * session middleware, pass session to handler context (can be null)
 */
export const sessionMiddleware = createMiddleware().server(async ({ next }) => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  return await next({ context: { session } })
})

/**
 * auth middleware, require user to be logged in, pass session to handler context
 */
export const authMiddleware = createMiddleware()
  .middleware([sessionMiddleware])
  .server(async ({ next, context }) => {
    if (!context.session) {
      return Resp.error("Unauthorized", 401)
    }
    return await next({ context: { session: context.session as NonNullable<Session> } })
  })

/**
 * strict auth middleware, will throw redirect to login page if user is not logged in
 */
export const strictAuthMiddleware = createMiddleware()
  .middleware([sessionMiddleware])
  .server(async ({ next, context }) => {
    if (!context.session) {
      throw redirect({ to: "/{-$locale}/login" })
    }
    return await next({ context: { session: context.session as NonNullable<Session> } })
  })

export const adminMiddleware = createMiddleware()
  .middleware([sessionMiddleware])
  .server(async ({ next, context }) => {
    if (!context.session) {
      throw redirect({ to: "/{-$locale}/login" })
    }

    const isAdmin = await isUserAdmin(context.session.user.id)
    if (!isAdmin) {
      throw redirect({ to: "/{-$locale}/404" })
    }

    return await next()
  })
