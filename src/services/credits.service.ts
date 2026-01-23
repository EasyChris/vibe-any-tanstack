import type { DbTransaction } from "@/db"
import type { credits as creditsTable } from "@/db/credit.schema"
import { logger } from "@/shared/lib/tools/logger"
import { getCreditsByUserId, getUserValidCredits, insertCredits } from "@/shared/model/credit.model"
import { CreditsType } from "@/shared/types/credit"

export interface IncreaseCreditsParams {
  userId: string
  credits: number
  creditsType: CreditsType
  paymentId?: string
  expiresAt?: Date
  description?: string
  tx?: DbTransaction
}

export interface DecreaseCreditsParams {
  userId: string
  credits: number
  creditsType: CreditsType
  description?: string
  tx?: DbTransaction
}

export interface DecreaseCreditsResult {
  remainingCredits: number
  transactionId: string
}

export class InsufficientCreditsError extends Error {
  constructor(required: number, available: number) {
    super(`Insufficient credits. Required: ${required}, Available: ${available}`)
    this.name = "InsufficientCreditsError"
  }
}

export class CreditService {
  public async getUserCredits(userId: string): Promise<{ userCredits: number; dailyBonusCredits: number }> {
    const creditData = {
      userCredits: 0,
      dailyBonusCredits: 0,
    }
    try {
      const credits = await getUserValidCredits(userId)

      if (credits) {
        credits.forEach((c) => {
          if (c.creditsType !== CreditsType.ADD_DAILY_BONUS) {
            creditData.userCredits += c.credits || 0
          } else {
            creditData.dailyBonusCredits += c.credits || 0
          }
        })
      }

      return creditData
    } catch (e) {
      console.log("get user credits failed: ", e)
      return creditData
    }
  }

  public async getUserCreditsHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    days: number = 30
  ) {
    try {
      const creditsHistory = await getCreditsByUserId(userId, page, limit, days)
      return creditsHistory
    } catch (error) {
      logger.error(`Failed to get user credits history for user ${userId}: ${error}`)
      throw error
    }
  }

  public async increaseCredits(params: IncreaseCreditsParams) {
    try {
      const { userId, credits, paymentId, creditsType, expiresAt, description, tx } = params

      const data: typeof creditsTable.$inferInsert = {
        userId,
        paymentId,
        credits,
        transactionType: "credit",
        creditsType,
        expiresAt,
        description,
      }

      await insertCredits(data, tx)
    } catch (error) {
      logger.error(`Failed to increase credits: ${error}`)
    }
  }

  public async decreaseCredits(params: DecreaseCreditsParams): Promise<DecreaseCreditsResult> {
    const { userId, credits, creditsType, description, tx } = params

    // Validate input
    if (credits <= 0) {
      throw new Error("Credits must be greater than 0")
    }

    try {
      // Quick check: get total available credits first
      const { userCredits: normalCredits, dailyBonusCredits } = await this.getUserCredits(userId)
      const totalCredits = normalCredits + dailyBonusCredits
      if (totalCredits < credits) {
        throw new InsufficientCreditsError(credits, totalCredits)
      }

      // Get detailed credits for proper deduction strategy
      const allCredits = await getUserValidCredits(userId)
      if (!allCredits || allCredits.length === 0) {
        throw new InsufficientCreditsError(credits, 0)
      }

      // Strategy: Use daily bonus credits first, then other credits (expiring first, permanent last)
      const dailyBonusCreditRecords = allCredits.filter(
        (c) => c.creditsType === CreditsType.ADD_DAILY_BONUS && c.credits > 0
      )
      const otherCreditRecords = allCredits.filter(
        (c) => c.creditsType !== CreditsType.ADD_DAILY_BONUS && c.credits > 0
      )

      let remainingToDeduct = credits
      const deductionRecords: Array<{
        paymentId: string
        expiresAt: Date | null
        amount: number
        creditsType: string
      }> = []

      // First: deduct from daily bonus credits
      for (const credit of dailyBonusCreditRecords) {
        if (remainingToDeduct <= 0) break

        const deductAmount = Math.min(credit.credits, remainingToDeduct)
        deductionRecords.push({
          paymentId: credit.paymentId || "",
          expiresAt: credit.expiresAt,
          amount: deductAmount,
          creditsType: credit.creditsType,
        })

        remainingToDeduct -= deductAmount
      }

      // Second: deduct from other credits
      for (const credit of otherCreditRecords) {
        if (remainingToDeduct <= 0) break

        const deductAmount = Math.min(credit.credits, remainingToDeduct)
        deductionRecords.push({
          paymentId: credit.paymentId || "",
          expiresAt: credit.expiresAt,
          amount: deductAmount,
          creditsType: credit.creditsType,
        })

        remainingToDeduct -= deductAmount
      }

      if (remainingToDeduct > 0) {
        throw new InsufficientCreditsError(credits, credits - remainingToDeduct)
      }

      // Create deduction record
      const sourceInfo = deductionRecords
        .map(
          (record) =>
            `${record.amount} from ${record.creditsType}${record.expiresAt ? ` (expires: ${record.expiresAt.toISOString()})` : ""}`
        )
        .join("; ")

      const data: typeof creditsTable.$inferInsert = {
        userId,
        paymentId: deductionRecords[0]?.paymentId || null,
        credits: -credits,
        transactionType: "debit",
        creditsType,
        expiresAt: null,
        description: description || `Sources: ${sourceInfo}`,
      }

      const result = await insertCredits(data, tx)

      return {
        remainingCredits: totalCredits - credits,
        transactionId: result.transactionId,
      }
    } catch (error) {
      logger.error(`Failed to decrease credits for user ${userId}: ${error}`)
      throw error
    }
  }
}

// // Functional service exports expected by ai.service.ts
// export const CreditsService = {
//   async getUserBalance(userId: string): Promise<number> {
//     const credits = await getUserValidCredits(userId)
//     if (!credits || credits.length === 0) {
//       return 0
//     }
//     return credits.reduce((sum, c) => sum + (c.credits || 0), 0)
//   },

//   async getUserCredits(userId: string) {
//     // return valid (non-expired) credits list for transparency
//     const credits = await getUserValidCredits(userId)
//     return credits ?? []
//   },

//   async deductCredits(userId: string, amount: number, creditsType: string, metadata?: Record<string, unknown>) {
//     if (amount <= 0) {
//       return { success: false, error: "amount must be > 0" }
//     }

//     const balance = await this.getUserBalance(userId)
//     if (balance < amount) {
//       return {
//         success: false,
//         error: `Insufficient credits. Current balance: ${balance}, required: ${amount}`,
//         statusCode: 402,
//       }
//     }

//     // identify source payment and expiry
//     let leftCredits = 0
//     let sourcePaymentId = ""
//     let sourceExpiresAt: Date | null = null

//     const userCredits = await getUserValidCredits(userId)
//     if (userCredits) {
//       for (const credit of userCredits) {
//         leftCredits += credit.credits
//         if (leftCredits >= amount) {
//           sourcePaymentId = credit.paymentId || ""
//           sourceExpiresAt = credit.expiresAt
//           break
//         }
//       }
//     }

//     const data: typeof creditsTable.$inferInsert = {
//       userId,
//       paymentId: sourcePaymentId,
//       credits: -amount,
//       transactionType: "debit",
//       creditsType: creditsType,
//       expiresAt: sourceExpiresAt,
//       description: metadata ? JSON.stringify(metadata) : undefined,
//     }

//     const result = await insertCredits(data)

//     return {
//       success: true,
//       usage: {
//         transactionId: result.transactionId,
//         amount,
//         creditsType,
//       },
//     }
//   },
// }
