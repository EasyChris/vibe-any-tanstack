import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type PaginationState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  CheckCircle2Icon,
  ClockIcon,
  PackageIcon,
  ReceiptIcon,
  RefreshCwIcon,
  SearchIcon,
  XCircleIcon,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useIntlayer } from "react-intlayer"
import {
  DataTableViewOptions,
  PageHeader,
  TableContainer,
  TablePagination,
  TableScrollArea,
} from "@/shared/components/admin"
import { Badge } from "@/shared/components/ui/badge"
import { Input } from "@/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { http } from "@/shared/lib/tools/http-client"
import { cn } from "@/shared/lib/utils"
import type { AdminOrderListItem, PaginatedResponse } from "@/shared/types/admin"

export const Route = createFileRoute("/{-$locale}/_main/admin/orders")({
  component: OrdersPage,
})

type OrderStatus = "all" | "pending" | "paid" | "canceled" | "expired" | "refunded"
type OrderType = "all" | "subscription" | "credit_package"

interface OrderFilters {
  search: string
  status: OrderStatus
  orderType: OrderType
}

const DEFAULT_FILTERS: OrderFilters = {
  search: "",
  status: "all",
  orderType: "all",
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconClassName,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  iconClassName?: string
}) {
  return (
    <div className="rounded-xl bg-card border p-3 sm:p-4 w-28 shrink-0 sm:w-auto sm:shrink">
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
          <p className="text-lg sm:text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <div className={cn("shrink-0", iconClassName)}>
          <Icon className="size-4 sm:size-5" />
        </div>
      </div>
    </div>
  )
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

function formatDate(date: Date | string | null, locale: string) {
  if (!date) return "-"
  const d = new Date(date)
  return d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getStatusBadge(status: AdminOrderListItem["status"]) {
  const config: Record<
    AdminOrderListItem["status"],
    { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }
  > = {
    pending: { variant: "secondary", icon: ClockIcon },
    paid: { variant: "default", icon: CheckCircle2Icon },
    canceled: { variant: "outline", icon: XCircleIcon },
    expired: { variant: "outline", icon: ClockIcon },
    refunded: { variant: "destructive", icon: RefreshCwIcon },
  }

  const { variant, icon: Icon } = config[status]
  return (
    <Badge
      variant={variant}
      className="gap-1"
    >
      <Icon className="size-3" />
      {status}
    </Badge>
  )
}

function OrdersPage() {
  const content = useIntlayer("admin")
  const locale = typeof window !== "undefined" ? document.documentElement.lang : "en"

  const [filters, setFilters] = useState<OrderFilters>(DEFAULT_FILTERS)
  const [searchInput, setSearchInput] = useState("")
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", pagination.pageIndex, pagination.pageSize, filters],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        pageSize: String(pagination.pageSize),
      })
      if (filters.search) params.set("search", filters.search)
      if (filters.status !== "all") params.set("status", filters.status)
      if (filters.orderType !== "all") params.set("orderType", filters.orderType)
      return http<PaginatedResponse<AdminOrderListItem>>(`/api/admin/orders?${params}`)
    },
  })

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput }))
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const orders = data?.items ?? []
  const totalRows = data?.pagination.total ?? 0

  const stats = useMemo(() => {
    return {
      total: totalRows,
      paid: orders.filter((o) => o.status === "paid").length,
      pending: orders.filter((o) => o.status === "pending").length,
      refunded: orders.filter((o) => o.status === "refunded").length,
    }
  }, [orders, totalRows])

  const columns: ColumnDef<AdminOrderListItem>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: () => content.orders.table.orderId,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.id}</span>
        ),
        enableHiding: true,
      },
      {
        id: "user",
        header: () => content.orders.table.user,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium truncate">{row.original.userName || "-"}</p>
            <p className="text-xs text-muted-foreground truncate">{row.original.userEmail}</p>
          </div>
        ),
        enableHiding: true,
      },
      {
        accessorKey: "productName",
        header: () => content.orders.table.product,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="shrink-0"
            >
              {row.original.orderType === "subscription" ? "Subscription" : "Credit"}
            </Badge>
            <span className="truncate">{row.original.productName || "-"}</span>
          </div>
        ),
        enableHiding: true,
      },
      {
        accessorKey: "amount",
        header: () => content.orders.table.amount,
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {formatCurrency(row.original.amount, row.original.currency)}
          </span>
        ),
        enableHiding: true,
      },
      {
        accessorKey: "status",
        header: () => content.orders.table.status,
        cell: ({ row }) => getStatusBadge(row.original.status),
        enableHiding: true,
      },
      {
        accessorKey: "createdAt",
        header: () => content.orders.table.createdAt,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground text-sm">
            {formatDate(row.original.createdAt, locale)}
          </span>
        ),
        enableHiding: true,
      },
      {
        accessorKey: "paidAt",
        header: () => content.orders.table.paidAt,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground text-sm">
            {formatDate(row.original.paidAt, locale)}
          </span>
        ),
        enableHiding: true,
      },
    ],
    [content, locale]
  )

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.pagination.totalPages ?? -1,
    state: {
      pagination,
      columnVisibility,
    },
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
  })

  const columnLabels = useMemo(
    () => ({
      id: content.orders.table.orderId.value,
      user: content.orders.table.user.value,
      productName: content.orders.table.product.value,
      amount: content.orders.table.amount.value,
      status: content.orders.table.status.value,
      createdAt: content.orders.table.createdAt.value,
      paidAt: content.orders.table.paidAt.value,
    }),
    [content]
  )

  return (
    <div className="flex flex-col h-full min-h-0">
      <PageHeader
        title={content.orders.title.value}
        description={content.orders.description.value}
      />

      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 sm:mb-6 lg:grid-cols-4 shrink-0">
        <StatCard
          icon={ReceiptIcon}
          label={content.orders.stats.total.value}
          value={stats.total}
          iconClassName="rounded-xl bg-primary/10 p-2.5 text-primary"
        />
        <StatCard
          icon={CheckCircle2Icon}
          label={content.orders.stats.paid.value}
          value={stats.paid}
          iconClassName="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500"
        />
        <StatCard
          icon={ClockIcon}
          label={content.orders.stats.pending.value}
          value={stats.pending}
          iconClassName="rounded-xl bg-amber-500/10 p-2.5 text-amber-500"
        />
        <StatCard
          icon={RefreshCwIcon}
          label={content.orders.stats.refunded.value}
          value={stats.refunded}
          iconClassName="rounded-xl bg-destructive/10 p-2.5 text-destructive"
        />
      </div>

      <div className="mb-4 shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={content.orders.searchPlaceholder.value}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 w-48"
            />
          </div>
          <Select
            value={filters.status}
            onValueChange={(value: OrderStatus) => {
              setFilters((prev) => ({ ...prev, status: value }))
              setPagination((prev) => ({ ...prev, pageIndex: 0 }))
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{content.orders.filters.allStatus}</SelectItem>
              <SelectItem value="pending">{content.orders.filters.pending}</SelectItem>
              <SelectItem value="paid">{content.orders.filters.paid}</SelectItem>
              <SelectItem value="canceled">{content.orders.filters.canceled}</SelectItem>
              <SelectItem value="expired">{content.orders.filters.expired}</SelectItem>
              <SelectItem value="refunded">{content.orders.filters.refunded}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.orderType}
            onValueChange={(value: OrderType) => {
              setFilters((prev) => ({ ...prev, orderType: value }))
              setPagination((prev) => ({ ...prev, pageIndex: 0 }))
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{content.orders.filters.allTypes}</SelectItem>
              <SelectItem value="subscription">{content.orders.filters.subscription}</SelectItem>
              <SelectItem value="credit_package">{content.orders.filters.creditPackage}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DataTableViewOptions
          table={table}
          columnLabels={columnLabels}
        />
      </div>

      <TableContainer>
        {isLoading ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{content.orders.table.orderId}</TableHead>
                  <TableHead>{content.orders.table.user}</TableHead>
                  <TableHead>{content.orders.table.product}</TableHead>
                  <TableHead>{content.orders.table.amount}</TableHead>
                  <TableHead>{content.orders.table.status}</TableHead>
                  <TableHead>{content.orders.table.createdAt}</TableHead>
                  <TableHead>{content.orders.table.paidAt}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: pagination.pageSize }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <PackageIcon className="size-7 text-muted-foreground" />
            </div>
            <h3 className="mt-5 text-base font-medium">{content.orders.empty}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{content.orders.emptyDesc}</p>
          </div>
        ) : (
          <>
            <TableScrollArea>
              <Table className="min-w-200">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="hover:bg-transparent"
                    >
                      {headerGroup.headers.map((header, index) => (
                        <TableHead
                          key={header.id}
                          className={
                            index === 0
                              ? "pl-4"
                              : index === headerGroup.headers.length - 1
                                ? "pr-4"
                                : ""
                          }
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell, index) => (
                        <TableCell
                          key={cell.id}
                          className={
                            index === 0
                              ? "pl-4"
                              : index === row.getVisibleCells().length - 1
                                ? "pr-4"
                                : ""
                          }
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScrollArea>

            <TablePagination
              table={table}
              totalRows={totalRows}
              rowsPerPageLabel={content.orders.pagination?.rowsPerPage?.value ?? "Rows per page"}
            />
          </>
        )}
      </TableContainer>
    </div>
  )
}
