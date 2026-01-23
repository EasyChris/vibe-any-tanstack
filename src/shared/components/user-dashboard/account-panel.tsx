import { LogOutIcon, RefreshCwIcon, SparklesIcon, UserPenIcon } from "lucide-react"
import { useState } from "react"
import { PricingDialog } from "@/shared/components/landing/pricing/pricing-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Button } from "@/shared/components/ui/button"
import { Separator } from "@/shared/components/ui/separator"
import { useGlobalContext } from "@/shared/context/global.context"
import { signOut } from "@/shared/lib/auth/auth-client"
import type { User } from "@/shared/types/user"

interface AccountPanelProps {
  user: User
  planName: string
}

export function AccountPanel({ user, planName }: AccountPanelProps) {
  const [isPricingOpen, setIsPricingOpen] = useState(false)
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
  const { config } = useGlobalContext()
  const creditEnabled = config?.public_credit_enable

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-14 md:size-16">
            <AvatarImage
              src={user.image ?? undefined}
              alt={user.name ?? "User"}
            />
            <AvatarFallback className="text-lg md:text-xl bg-amber-400 text-white">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base md:text-lg truncate">{user.name}</div>
            <div className="text-muted-foreground text-sm truncate">{user.email}</div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Edit profile"
            >
              <UserPenIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Sign out"
              className="text-destructive/60 hover:text-destructive"
              onClick={() =>
                signOut({ fetchOptions: { onSuccess: () => window.location.reload() } })
              }
            >
              <LogOutIcon className="size-4" />
            </Button>
          </div>
        </div>

        {creditEnabled && (
          <div className="rounded-lg bg-muted/50 p-4 space-y-4 border">
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize">{planName}</span>
              <Button
                size="sm"
                onClick={() => setIsPricingOpen(true)}
              >
                升级
              </Button>
            </div>

            <Separator className="border-dashed" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <SparklesIcon className="size-4" />
                  <span>积分</span>
                </div>
                <span className="font-medium">0</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground text-sm">
                <span>免费积分</span>
                <span>0</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCwIcon className="size-4" />
                  <span>每日刷新积分</span>
                </div>
                <span className="font-medium">300</span>
              </div>
              <div className="text-muted-foreground text-xs">每天 08:00 刷新为 300</div>
            </div>
          </div>
        )}

        <PricingDialog
          open={isPricingOpen}
          onOpenChange={setIsPricingOpen}
        />
      </div>
    </div>
  )
}
