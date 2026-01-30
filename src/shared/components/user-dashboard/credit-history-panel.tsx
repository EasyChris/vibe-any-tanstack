import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HistoryIcon,
  Loader2Icon,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useIntlayer } from "react-intlayer"
import { PricingDialog } from "@/shared/components/landing/pricing/pricing-dialog"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { useGlobalContext } from "@/shared/context/global.context"
import { http } from "@/shared/lib/tools/http-client"
import { cn } from "@/shared/lib/utils"
import { CreditsType } from "@/shared/types/credit"
import { CreditDetail } from "./account-panel"

interface CreditRecord {
  id: string
  credits: number
  creditsType: string
  transactionType: string
  description: string | null
  expiresAt: string | null
  createdAt: string
}

interface CreditHistoryResponse {
  data: CreditRecord[]
  total: number
  page: number
  limit: number
}

function formatDate(dateString: string, locale: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function CreditHistoryPanel() {
  const [data, setData] = useState<CreditHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [isPricingOpen, setIsPricingOpen] = useState(false)
  const { userInfo } = useGlobalContext()
  const { history: t, creditTypes } = useIntlayer("user-dashboard")
  const locale = typeof window !== "undefined" ? document.documentElement.lang : "en"
  const planName = userInfo?.payment?.activePlan?.id ?? "free"
  const limit = 10

  const creditTypeLabels: Record<string, string> = {
    [CreditsType.ADD_FIRST_REGISTRATION]: creditTypes.add_first_registration.value,
    [CreditsType.ADD_SUBSCRIPTION_PAYMENT]: creditTypes.add_subscription_payment.value,
    [CreditsType.ADD_ONE_TIME_PAYMENT]: creditTypes.add_one_time_payment.value,
    [CreditsType.ADD_DAILY_BONUS]: creditTypes.add_daily_bonus.value,
    [CreditsType.ADD_ADMIN]: creditTypes.add_admin.value,
    [CreditsType.ADD_REFUND]: creditTypes.add_refund.value,
    [CreditsType.DEDUCT_AI_USE]: creditTypes.deduct_ai_use.value,
    [CreditsType.DEDUCT_AI_TEXT]: creditTypes.ai_text.value,
    [CreditsType.DEDUCT_AI_IMAGE]: creditTypes.ai_image.value,
    [CreditsType.DEDUCT_AI_SPEECH]: creditTypes.ai_speech.value,
    [CreditsType.DEDUCT_AI_VIDEO]: creditTypes.ai_video.value,
    [CreditsType.DEDUCT_EXPIRED]: creditTypes.deduct_expired.value,
  }

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const result = await http<CreditHistoryResponse>(
        `/api/credit/history?page=${page}&limit=${limit}`,
        { silent: true }
      )
      if (result) {
        setData(result)
      }
    } catch {
      // error handled by http client
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t.title.value}</h2>
        <p className="text-muted-foreground text-sm">{t.description.value}</p>
      </div>
      <CreditDetail
        planName={planName}
        onUpgradeClick={() => setIsPricingOpen(true)}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data?.data.length ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <HistoryIcon className="size-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{t.empty.value}</p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.time.value}</TableHead>
                <TableHead>{t.type.value}</TableHead>
                <TableHead className="text-right">{t.change.value}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(record.createdAt, locale)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={record.credits > 0 ? "secondary" : "outline"}
                      className="font-normal"
                    >
                      {creditTypeLabels[record.creditsType] || record.creditsType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 font-medium tabular-nums",
                        record.credits > 0 ? "text-emerald-600" : "text-muted-foreground"
                      )}
                    >
                      {record.credits > 0 ? (
                        <ArrowUpIcon className="size-3" />
                      ) : (
                        <ArrowDownIcon className="size-3" />
                      )}
                      {record.credits > 0 ? `+${record.credits}` : record.credits}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t.totalRecords.value.replace("{count}", String(data.total))}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <span className="text-sm tabular-nums">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <PricingDialog
        open={isPricingOpen}
        onOpenChange={setIsPricingOpen}
      />
    </div>
  )
}
