import { useIntlayer } from "react-intlayer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { PricingCards } from "./pricing-cards"

interface PricingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PricingDialog({ open, onOpenChange }: PricingDialogProps) {
  const content = useIntlayer("pricing")

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-4xl! max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{content.title.value}</DialogTitle>
          <DialogDescription>{content.subtitle.value}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-100px)]">
          <div className="p-6 pt-4">
            <PricingCards
              variant="compact"
              onSuccess={() => onOpenChange(false)}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
