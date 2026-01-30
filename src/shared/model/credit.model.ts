import { and, asc, count, desc, eq, gt, gte, isNull, or, sql } from "drizzle-orm"
import { type DbTransaction, db } from "@/db"
import { credits } from "@/db/credit.schema"

export async function insertCredits(data: typeof credits.$inferInsert, tx?: DbTransaction) {
  const dbInstance = tx || db
  const [result] = await dbInstance.insert(credits).values(data).returning()
  return result
}

/**
 * Get valid credit records for a user (FIFO order)
 * - Only returns credit records (transactionType = "credit") with remaining credits > 0
 * - Filters out expired credits at query time (no status update needed)
 * - Orders by expiresAt ASC (null last) to prioritize expiring credits
 */
export async function getUserValidCredits(userId: string, tx?: DbTransaction) {
  const dbInstance = tx || db
  const now = new Date()

  const data = await dbInstance
    .select()
    .from(credits)
    .where(
      and(
        eq(credits.userId, userId),
        eq(credits.transactionType, "credit"),
        gt(credits.credits, 0),
        or(isNull(credits.expiresAt), gte(credits.expiresAt, now))
      )
    )
    .orderBy(
      sql`CASE WHEN ${credits.expiresAt} IS NULL THEN 1 ELSE 0 END`,
      asc(credits.expiresAt),
      asc(credits.createdAt)
    )

  return data
}

/**
 * Update the remaining credits of a credit record
 * Used for FIFO consumption - directly decrements the source credit record
 */
export async function updateCreditBalance(id: string, newCredits: number, tx?: DbTransaction) {
  const dbInstance = tx || db
  await dbInstance.update(credits).set({ credits: newCredits }).where(eq(credits.id, id))
}

export async function getCreditsByUserId(
  userId: string,
  page: number = 1,
  limit: number = 10,
  days?: number
) {
  const baseCondition = eq(credits.userId, userId)

  // If days parameter is provided, filter by date range
  if (days !== undefined && days > 0) {
    const dateAgo = new Date()
    dateAgo.setDate(dateAgo.getDate() - days)

    const condition = and(baseCondition, gte(credits.createdAt, dateAgo))

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(credits)
        .where(condition)
        .orderBy(desc(credits.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ count: count() }).from(credits).where(condition),
    ])

    return {
      data,
      total: totalResult[0].count,
      page,
      limit,
    }
  }

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(credits)
      .where(baseCondition)
      .orderBy(desc(credits.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() }).from(credits).where(baseCondition),
  ])

  return {
    data,
    total: totalResult[0].count,
    page,
    limit,
  }
}

export async function getCreditsById(id: string) {
  const [data] = await db.select().from(credits).where(eq(credits.id, id))
  return data ?? null
}

/**
 * Get user's latest daily bonus record
 */
export async function getUserLatestDailyBonus(
  userId: string,
  creditsType: string,
  tx?: DbTransaction
) {
  const dbInstance = tx || db
  const data = await dbInstance
    .select()
    .from(credits)
    .where(
      and(
        eq(credits.userId, userId),
        eq(credits.creditsType, creditsType),
        eq(credits.transactionType, "credit")
      )
    )
    .orderBy(desc(credits.createdAt))
    .limit(1)

  return data.length > 0 ? data[0] : null
}

export async function getUserCreditBalance(userId: string): Promise<number> {
  const validCredits = await getUserValidCredits(userId)
  return validCredits.reduce((sum, c) => sum + c.credits, 0)
}
