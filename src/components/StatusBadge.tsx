import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/data/mock";

const cfg: Record<string, { label: string; cls: string }> = {
  NEW_ORDER:        { label: "New",           cls: "bg-info/15 text-info border-info/30" },
  WAITING_FOR_PAN:  { label: "Waiting PAN",   cls: "bg-warning/15 text-warning border-warning/30" },
  PAN_VERIFIED:     { label: "PAN Verified",  cls: "bg-primary/15 text-primary border-primary/30" },
  PAYMENT_SENT:     { label: "Payment Sent",  cls: "bg-info/15 text-info border-info/30" },
  COMPLETED:        { label: "Completed",     cls: "bg-success/15 text-success border-success/30" },
  FAILED:           { label: "Failed",        cls: "bg-destructive/15 text-destructive border-destructive/30" },
  PENDING:          { label: "Pending",       cls: "bg-warning/15 text-warning border-warning/30" },
  SUCCESS:          { label: "Success",       cls: "bg-success/15 text-success border-success/30" },
  ACTIVE:           { label: "Active",        cls: "bg-success/15 text-success border-success/30" },
  PAUSED:           { label: "Paused",        cls: "bg-muted text-muted-foreground border-border" },
};

export function StatusBadge({ status }: { status: OrderStatus | string }) {
  const c = cfg[status] ?? { label: status, cls: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide border",
      c.cls
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {c.label}
    </span>
  );
}
