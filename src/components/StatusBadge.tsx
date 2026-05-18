import { cn } from "@/lib/utils";

const cfg: Record<string, { label: string; cls: string }> = {
  // Order states (13 total)
  NEW_ORDER:           { label: "New",              cls: "bg-info/15 text-info border-info/30" },
  WAITING_FOR_PAN:     { label: "Waiting PAN",      cls: "bg-warning/15 text-warning border-warning/30" },
  VALIDATING_PAN:      { label: "Validating PAN",   cls: "bg-warning/15 text-warning border-warning/30" },
  PAN_VERIFIED:        { label: "PAN Verified",     cls: "bg-primary/15 text-primary border-primary/30" },
  WAITING_TDS_CONSENT: { label: "Waiting TDS",      cls: "bg-warning/15 text-warning border-warning/30" },
  TDS_ACCEPTED:        { label: "TDS Accepted",     cls: "bg-primary/15 text-primary border-primary/30" },
  PROCESSING_PAYMENT:  { label: "Processing",       cls: "bg-info/15 text-info border-info/30" },
  PAYMENT_SENT:        { label: "Payment Sent",     cls: "bg-info/15 text-info border-info/30" },
  WAITING_FOR_RELEASE: { label: "Waiting Release",  cls: "bg-info/15 text-info border-info/30" },
  COMPLETED:           { label: "Completed",        cls: "bg-success/15 text-success border-success/30" },
  ESCALATED:           { label: "Escalated",        cls: "bg-destructive/15 text-destructive border-destructive/30" },
  FAILED:              { label: "Failed",           cls: "bg-destructive/15 text-destructive border-destructive/30" },
  CANCELLED:           { label: "Cancelled",        cls: "bg-muted text-muted-foreground border-border" },
  // Payment states
  PENDING:             { label: "Pending",          cls: "bg-warning/15 text-warning border-warning/30" },
  SUCCESS:             { label: "Success",          cls: "bg-success/15 text-success border-success/30" },
  // Ad states
  ACTIVE:              { label: "Active",           cls: "bg-success/15 text-success border-success/30" },
  PAUSED:              { label: "Paused",           cls: "bg-muted text-muted-foreground border-border" },
};

export function StatusBadge({ status }: { status: string }) {
  const c = cfg[status] ?? { label: status, cls: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide border whitespace-nowrap",
      c.cls
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {c.label}
    </span>
  );
}
