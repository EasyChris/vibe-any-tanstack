export type AdminUserRole = {
  id: string
  roleId: string
  name: string
  title: string
  expiresAt: Date | null
}

export type AdminUserListItem = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  roles: AdminUserRole[]
  subscription: { planId: string; planName: string; status: string } | null
  creditBalance: number
  banned: boolean
  bannedAt: Date | null
}

export type AdminUserDetail = AdminUserListItem & {
  updatedAt: Date
  providerCustomers: Record<string, string> | null
}

export type AdminRole = {
  id: string
  name: string
  title: string
  description: string | null
  isSystem: boolean
}

export type PaginatedResponse<T> = {
  items: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type AdminOrderListItem = {
  id: string
  userId: string
  orderType: "subscription" | "credit_package"
  status: "pending" | "paid" | "canceled" | "expired" | "refunded"
  productId: string | null
  productName: string | null
  amount: number
  currency: string
  expireAt: Date | null
  paidAt: Date | null
  createdAt: Date
  userName: string | null
  userEmail: string | null
}
