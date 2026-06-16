import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Save, Loader2, AlertTriangle } from "lucide-react";
import { useSystem } from "@/context/SystemContext";
import { cn } from "@/lib/utils";

// Convert backend ms → friendly editor units (all three editors use minutes).
const toMinutes = (ms: number) => Math.round(ms / 60_000);

export function BotTimersCard() {
  const {
    autoCancelBufferMs,
    panTimeoutMs,
    panReminderMs,
    updateTimers,
    loading,
  } = useSystem();

  // Editor state — every field is in MINUTES
  const [cancelBufferMin, setCancelBufferMin] = useState(toMinutes(autoCancelBufferMs));
  const [panTimeoutMin, setPanTimeoutMin] = useState(toMinutes(panTimeoutMs));
  const [panReminderMin, setPanReminderMin] = useState(toMinutes(panReminderMs));
  const [saving, setSaving] = useState(false);

  // Sync local editor when global state changes (e.g. after re-fetch)
  useEffect(() => { setCancelBufferMin(toMinutes(autoCancelBufferMs)); }, [autoCancelBufferMs]);
  useEffect(() => { setPanTimeoutMin(toMinutes(panTimeoutMs)); }, [panTimeoutMs]);
  useEffect(() => { setPanReminderMin(toMinutes(panReminderMs)); }, [panReminderMs]);

  const dirty =
    cancelBufferMin * 60_000 !== autoCancelBufferMs ||
    panTimeoutMin * 60_000 !== panTimeoutMs ||
    panReminderMin * 60_000 !== panReminderMs;

  const validations = [
    cancelBufferMin < 0 && "Cancel buffer must be ≥ 0",
    cancelBufferMin > 30 && "Cancel buffer cannot exceed 30 minutes",
    panTimeoutMin < 1 && "PAN timeout must be at least 1 min",
    panTimeoutMin > 24 * 60 && "PAN timeout cannot exceed 24 hours",
    panReminderMin < 0 && "PAN reminder cannot be negative",
    panReminderMin >= panTimeoutMin && "PAN reminder must be less than PAN timeout",
  ].filter(Boolean) as string[];

  const onSave = async () => {
    if (validations.length || !dirty) return;
    setSaving(true);
    try {
      await updateTimers({
        auto_cancel_buffer_ms: cancelBufferMin * 60_000,
        pan_timeout_ms:        panTimeoutMin * 60_000,
        pan_reminder_ms:       panReminderMin * 60_000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div whileHover={{ y: -2 }} className="surface-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Bot Timers</p>
            <p className="text-lg font-bold mt-0.5">Cancel & PAN deadlines</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onSave}
          disabled={!dirty || saving || validations.length > 0 || loading}
          className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition shadow-[0_4px_18px_-6px_hsl(var(--primary)/0.6)]"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? "Saving…" : "Save"}
        </motion.button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Field
          label="Auto-cancel buffer"
          unit="minutes"
          value={cancelBufferMin}
          onChange={setCancelBufferMin}
          hint="Cancel order this many minutes BEFORE Binance's deadline. 0 = MASTER OFF — disables all bot-initiated auto-cancel (deadline AND PAN timeout)."
        />
        <Field
          label="PAN timeout"
          unit="minutes"
          value={panTimeoutMin}
          onChange={setPanTimeoutMin}
          hint="Cancel the order if seller doesn't share PAN within this time."
        />
        <Field
          label="PAN reminder"
          unit="minutes"
          value={panReminderMin}
          onChange={setPanReminderMin}
          hint="Send a polite reminder this many minutes in."
        />
      </div>

      {validations.length > 0 && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <ul className="text-[11px] text-destructive space-y-0.5">
            {validations.map((v, i) => <li key={i}>{v}</li>)}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Cancellations always send a randomly-rotated <span className="font-semibold text-foreground">seller-fault</span> reason
        (codes 4 / 6) — your cancellation rate stays clean. Same reason pool is used for both deadline cancels and PAN timeouts.
      </p>
    </motion.div>
  );
}

function Field({
  label, unit, value, onChange, hint,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <div className="rounded-xl bg-surface-2 border border-border p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <div className="flex items-baseline gap-1.5 mt-1.5">
        <input
          type="number"
          min={0}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
          className={cn(
            "w-20 h-9 rounded-md border border-border px-2 text-base font-bold tabular-nums",
            "bg-background text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
          )}
        />
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{unit}</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">{hint}</p>
    </div>
  );
}
