import { eq } from "drizzle-orm"
import { type DbTransaction, db, user } from "@/db"

export type UserSelect = typeof user.$inferSelect

export async function findUserById(userId: string, tx?: DbTransaction) {
  const dbInstance = tx || db
  const [result] = await dbInstance.select().from(user).where(eq(user.id, userId)).limit(1)
  return result ?? null
}
