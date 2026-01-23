import { CreditCardIcon, MenuIcon, SettingsIcon, UserIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/shared/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { useGlobalContext } from "@/shared/context/global.context"
import { cn } from "@/shared/lib/utils"
import { AccountPanel } from "./account-panel"
import { BillingPanel } from "./billing-panel"
import { SettingsPanel } from "./settings-panel"

const menu = [
  { id: "account", label: "账户", icon: UserIcon },
  { id: "settings", label: "设置", icon: SettingsIcon },
  { id: "billing", label: "使用情况", icon: CreditCardIcon },
]

interface UserDashboardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const UserDashboard = ({ open, onOpenChange }: UserDashboardProps) => {
  const [currentMenuId, setCurrentMenuId] = useState("account")
  const [isOverflowing, setIsOverflowing] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)
  const { userInfo } = useGlobalContext()
  const user = userInfo?.user
  const payment = userInfo?.payment

  useEffect(() => {
    const checkOverflow = () => {
      if (tabsRef.current) {
        setIsOverflowing(tabsRef.current.scrollWidth > tabsRef.current.clientWidth)
      }
    }
    checkOverflow()
    window.addEventListener("resize", checkOverflow)
    return () => window.removeEventListener("resize", checkOverflow)
  }, [open])

  if (!user) return null

  const planName = payment?.activePlan?.id ?? "free"

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-96 sm:max-w-2xl! md:max-w-4xl!  w-full min-h-125 flex flex-col md:flex-row p-0 gap-0">
        <DialogTitle className="sr-only">User Dashboard</DialogTitle>

        {/* Mobile header + tabs */}
        <div className="md:hidden p-4 pb-0 space-y-4">
          <h2 className="text-xl font-semibold">设置</h2>
          <div className="flex items-center border-b">
            <div
              ref={tabsRef}
              className="flex items-center gap-1 overflow-x-auto flex-1"
            >
              {menu.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setCurrentMenuId(item.id)}
                  className={cn(
                    "px-3 py-2 text-sm whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent -mb-px",
                    currentMenuId === item.id && "text-foreground border-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {isOverflowing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="p-2 text-muted-foreground hover:text-foreground shrink-0"
                    aria-label="More options"
                  >
                    <MenuIcon className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {menu.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => setCurrentMenuId(item.id)}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden md:block w-56 border-r overflow-y-auto p-3 space-y-1">
          {menu.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setCurrentMenuId(item.id)}
              className={cn(
                "flex w-full items-center gap-2 text-sm text-muted-foreground hover:bg-muted/50 px-3 py-2 rounded-md transition-colors",
                currentMenuId === item.id && "text-foreground bg-muted"
              )}
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 py-6 md:py-8 px-4 md:px-5 overflow-y-auto">
          {currentMenuId === "account" && <AccountPanel user={user} planName={planName} />}
          {currentMenuId === "settings" && <SettingsPanel />}
          {currentMenuId === "billing" && <BillingPanel />}
        </main>
      </DialogContent>
    </Dialog>
  )
}
