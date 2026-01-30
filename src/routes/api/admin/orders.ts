import { createFileRoute } from "@tanstack/react-router"
import { Resp } from "@/shared/lib/tools/response"
import { findOrdersWithUser, type OrderQueryParams } from "@/shared/model/order.model"

export const Route = createFileRoute("/api/admin/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const page = Math.max(1, Number(url.searchParams.get("page")) || 1)
          const pageSize = Math.min(
            100,
            Math.max(1, Number(url.searchParams.get("pageSize")) || 10)
          )

          const params: OrderQueryParams = {
            page,
            pageSize,
            search: url.searchParams.get("search")?.trim() || undefined,
            status: (url.searchParams.get("status") as OrderQueryParams["status"]) || undefined,
            orderType:
              (url.searchParams.get("orderType") as OrderQueryParams["orderType"]) || undefined,
            days: url.searchParams.get("days") ? Number(url.searchParams.get("days")) : undefined,
          }

          const result = await findOrdersWithUser(params)
          return Resp.success(result)
        } catch (error) {
          console.error("Failed to fetch orders:", error)
          return Resp.error("Failed to fetch orders")
        }
      },
    },
  },
})
