import { relations } from "drizzle-orm"
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { getSnowId } from "@/shared/lib/tools/hash"
import { user } from "./auth.schema"

export const orderTypeEnum = pgEnum("order_type", ["subscription", "credit_package"])

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "canceled",
  "expired",
  "refunded",
])

export const order = pgTable(
  "order",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => getSnowId()),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    orderType: orderTypeEnum("order_type").notNull(),
    status: orderStatusEnum("status").notNull().default("pending"),

    productId: text("product_id"),
    productName: text("product_name"),

    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("USD"),

    expireAt: timestamp("expire_at"),
    paidAt: timestamp("paid_at"),

    metadata: jsonb("metadata").$type<Record<string, string>>(),

    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("order_user_id_idx").on(table.userId),
    index("order_status_idx").on(table.status),
  ]
)

export const orderRelations = relations(order, ({ one }) => ({
  user: one(user, {
    fields: [order.userId],
    references: [user.id],
  }),
}))
