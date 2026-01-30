import type { DbTransaction } from "@/db"
import type { orderTypeEnum } from "@/db/order.schema"
import { logger } from "@/shared/lib/tools/logger"
import {
  findOrderById,
  findOrdersByUserId,
  findPendingOrderByProductId,
  insertOrder,
  updateOrderStatus,
} from "@/shared/model/order.model"

export interface CreateOrderParams {
  userId: string
  orderType: (typeof orderTypeEnum.enumValues)[number]
  productId: string
  productName: string
  amount: number
  currency: string
  expireMinutes?: number
  metadata?: Record<string, string>
  tx?: DbTransaction
}

export interface OrderResult {
  id: string
  userId: string
  orderType: string
  status: string
  productId: string | null
  productName: string | null
  amount: number
  currency: string
  expireAt: Date | null
  paidAt: Date | null
  createdAt: Date
}

const DEFAULT_EXPIRE_MINUTES = 30

export class OrderService {
  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const {
      userId,
      orderType,
      productId,
      productName,
      amount,
      currency,
      expireMinutes = DEFAULT_EXPIRE_MINUTES,
      metadata,
      tx,
    } = params

    const existingOrder = await findPendingOrderByProductId(userId, productId, tx)
    if (existingOrder?.expireAt && existingOrder.expireAt > new Date()) {
      logger.info(`Reusing existing pending order: ${existingOrder.id}`)
      return existingOrder
    }

    const expireAt = new Date()
    expireAt.setMinutes(expireAt.getMinutes() + expireMinutes)

    const newOrder = await insertOrder(
      {
        userId,
        orderType,
        status: "pending",
        productId,
        productName,
        amount,
        currency,
        expireAt,
        metadata,
      },
      tx
    )

    logger.info(`Order created: ${newOrder.id} (${orderType})`)
    return newOrder
  }

  async getOrderById(id: string, tx?: DbTransaction): Promise<OrderResult | null> {
    return findOrderById(id, tx)
  }

  async getUserOrders(
    userId: string,
    status?: "pending" | "paid" | "canceled" | "expired" | "refunded"
  ) {
    return findOrdersByUserId(userId, status)
  }

  async markOrderPaid(orderId: string, tx?: DbTransaction): Promise<OrderResult | null> {
    const order = await findOrderById(orderId, tx)
    if (!order) {
      logger.warn(`Order not found: ${orderId}`)
      return null
    }

    if (order.status === "paid") {
      logger.info(`Order already paid: ${orderId}`)
      return order
    }

    if (order.status !== "pending") {
      logger.warn(`Cannot mark order as paid, current status: ${order.status}`)
      return null
    }

    const updated = await updateOrderStatus(orderId, "paid", new Date(), tx)
    logger.info(`Order marked as paid: ${orderId}`)
    return updated
  }

  async markOrderCanceled(orderId: string, tx?: DbTransaction): Promise<OrderResult | null> {
    const updated = await updateOrderStatus(orderId, "canceled", undefined, tx)
    if (updated) {
      logger.info(`Order canceled: ${orderId}`)
    }
    return updated
  }

  async markOrderRefunded(orderId: string, tx?: DbTransaction): Promise<OrderResult | null> {
    const updated = await updateOrderStatus(orderId, "refunded", undefined, tx)
    if (updated) {
      logger.info(`Order refunded: ${orderId}`)
    }
    return updated
  }

  async isOrderExpired(orderId: string, tx?: DbTransaction): Promise<boolean> {
    const order = await findOrderById(orderId, tx)
    if (!order) return true
    if (order.status !== "pending") return false
    if (!order.expireAt) return false
    return order.expireAt < new Date()
  }
}
