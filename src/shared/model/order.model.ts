import { and, count, desc, eq, gte, ilike, or, type SQL } from "drizzle-orm"
import { type DbTransaction, db } from "@/db"
import { user } from "@/db/auth.schema"
import { order, type orderStatusEnum } from "@/db/order.schema"

export async function insertOrder(data: typeof order.$inferInsert, tx?: DbTransaction) {
  const dbInstance = tx || db
  const [result] = await dbInstance.insert(order).values(data).returning()
  return result
}

export async function findOrderById(id: string, tx?: DbTransaction) {
  const dbInstance = tx || db
  const [result] = await dbInstance.select().from(order).where(eq(order.id, id)).limit(1)
  return result ?? null
}

export async function findOrdersByUserId(
  userId: string,
  status?: (typeof orderStatusEnum.enumValues)[number],
  tx?: DbTransaction
) {
  const dbInstance = tx || db
  const conditions = [eq(order.userId, userId)]

  if (status) {
    conditions.push(eq(order.status, status))
  }

  return dbInstance
    .select()
    .from(order)
    .where(and(...conditions))
    .orderBy(desc(order.createdAt))
}

export async function updateOrderById(
  id: string,
  data: Partial<typeof order.$inferInsert>,
  tx?: DbTransaction
) {
  const dbInstance = tx || db
  const [result] = await dbInstance
    .update(order)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(order.id, id))
    .returning()
  return result ?? null
}

export async function updateOrderStatus(
  id: string,
  status: (typeof orderStatusEnum.enumValues)[number],
  paidAt?: Date,
  tx?: DbTransaction
) {
  const dbInstance = tx || db
  const [result] = await dbInstance
    .update(order)
    .set({
      status,
      paidAt: paidAt ?? (status === "paid" ? new Date() : undefined),
      updatedAt: new Date(),
    })
    .where(eq(order.id, id))
    .returning()
  return result ?? null
}

export async function findPendingOrderByProductId(
  userId: string,
  productId: string,
  tx?: DbTransaction
) {
  const dbInstance = tx || db
  const [result] = await dbInstance
    .select()
    .from(order)
    .where(
      and(eq(order.userId, userId), eq(order.productId, productId), eq(order.status, "pending"))
    )
    .orderBy(desc(order.createdAt))
    .limit(1)
  return result ?? null
}

export async function expireOrder(id: string, tx?: DbTransaction) {
  return updateOrderStatus(id, "expired", undefined, tx)
}

export interface OrderQueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: (typeof orderStatusEnum.enumValues)[number]
  orderType?: "subscription" | "credit_package"
  days?: number
}

export async function findOrdersWithUser(params: OrderQueryParams = {}) {
  const { page = 1, pageSize = 10, search, status, orderType, days } = params
  const offset = (page - 1) * pageSize

  const conditions: SQL[] = []

  if (search) {
    conditions.push(or(ilike(order.id, `%${search}%`), ilike(order.productName, `%${search}%`))!)
  }

  if (status) {
    conditions.push(eq(order.status, status))
  }

  if (orderType) {
    conditions.push(eq(order.orderType, orderType))
  }

  if (days && days > 0) {
    const dateAgo = new Date()
    dateAgo.setDate(dateAgo.getDate() - days)
    conditions.push(gte(order.createdAt, dateAgo))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [[{ total }], orders] = await Promise.all([
    db.select({ total: count() }).from(order).where(whereClause),
    db
      .select({
        id: order.id,
        userId: order.userId,
        orderType: order.orderType,
        status: order.status,
        productId: order.productId,
        productName: order.productName,
        amount: order.amount,
        currency: order.currency,
        expireAt: order.expireAt,
        paidAt: order.paidAt,
        createdAt: order.createdAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(order)
      .leftJoin(user, eq(order.userId, user.id))
      .where(whereClause)
      .orderBy(desc(order.createdAt))
      .limit(pageSize)
      .offset(offset),
  ])

  return {
    items: orders,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}
