import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Banknote, Save, Loader2, AlertTriangle, Activity } from "lucide-react";
import { useSystem } from "@/context/SystemContext";
import { PaymentLimitsSnapshot } from "@/services/payments.service";
import { cn } from "@/lib/utils";

// Friendly formatter for INR amounts (handles ₹0 and big numbers like ₹5,00,000)
const fmtINR = (n: number) =>
  `₹${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

interface Props {
  // Live snapshot from /api/payments — used for "IMPS used today" display.
  // If undefined, only the editable thresholds are shown.
  usage?: PaymentLimitsSnapshot;
  onChanged?: () => void;
}

export function PaymentLimitsCard({ usage, onChanged }: Props) {
  const {
    impsMaxAmount, neftMaxAmount, impsDailyCap,
    updatePaymentLimits, loading,
  } = useSystem();

  const [impsMax, setImpsMax]   = useState(impsMaxAmount);
  const [neftMax, setNeftMax]   = useState(neftMaxAmount);
  const [dailyCap, setDailyCap] = useState(impsDailyCap);
  const [saving, setSaving]     = useState(false);

  // Re-sync local editor when global state changes (e.g. after fetchConfig)
  useEffect(() => { setImpsMax(impsMaxAmount); }, [impsMaxAmount]);
  useEffect(() => { setNeftMax(neftMaxAmount); }, [neftMaxAmount]);
  useEffect(() => { setDailyCap(impsDailyCap); }, [impsDailyCap]);

  const dirty =
    impsMax  !== impsMaxAmount ||
    neftMax  !== neftMaxAmount ||
    dailyCap !== impsDailyCap;

  const validations = [
    impsMax  < 0 && "IMPS max cannot be negative",
    neftMax  < 0 && "NEFT max cannot be negative",
    dailyCap < 0 && "IMPS daily cap cannot be negative",
    neftMax  < impsMax && "NEFT max must be ≥ IMPS max",
    dailyCap < impsMax && "Daily IMPS cap should be ≥ IMPS max (single transfer)",
  ].filter(Boolean) as string[];

  const onSave = async () => {
    if (validations.length || !dirty) return;
    setSaving(true);
    try {
      const ok = await updatePaymentLimits({
        imps_max_amount: impsMax,
        neft_max_amount: neftMax,
        imps_daily_cap:  dailyCap,
      });
      if (ok) onChanged?.();
    } finally {
      setSaving(false);
    }
  };

  // Daily IMPS usage gauge (only when usage prop is available)
  const used      = usage?.imps_used_24h ?? 0;
  const cap       = usage?.imps_daily_cap ?? impsDailyCap;
  const pct       = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;
  const remaining = Math.max(0, (usage?.imps_remaining_24h ?? cap - used));

  let pctTone = "bg-success";
  if (pct >= 90) pctTone = "bg-destructive";
  else if (pct >= 70) pctTone = "bg-warning";

  return (
    <motion.div whileHover={{ y: -2 }} className="surface-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Payment Method Limits</p>
            <p className="text-lg font-bold mt-0.5">IMPS / NEFT / RTGS routing</p>
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
          label="IMPS max (single)"
          unit="₹"
          value={impsMax}
          onChange={setImpsMax}
          hint="Single transfer below this → IMPS"
        />
        <Field
          label="NEFT max (single)"
          unit="₹"
          value={neftMax}
          onChange={setNeftMax}
          hint="Between IMPS max and this → NEFT. Above → RTGS."
        />
        <Field
          label="IMPS daily cap"
          unit="₹"
          value={dailyCap}
          onChange={setDailyCap}
          hint="Total IMPS in rolling 24h. Exceeded → fall back to NEFT."
        />
      </div>

      {/* Daily IMPS usage gauge */}
      {usage && (
        <div className="rounded-xl bg-surface-2 border border-border p-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                IMPS used (rolling 24h)
              </span>
            </div>
            <p className="text-xs font-bold tabular-nums">
              {fmtINR(used)} <span className="text-muted-foreground font-normal">/</span> {fmtINR(cap)}
              <span className="text-muted-foreground font-normal"> ({pct}%)</span>
            </p>
          </div>
          <div className="h-2 rounded-full bg-surface-1 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", pctTone)}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 tabular-nums">
            Remaining today: {fmtINR(remaining)} — orders above this trigger automatic NEFT fallback.
          </p>
        </div>
      )}

      {validations.length > 0 && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <ul className="text-[11px] text-destructive space-y-0.5">
            {validations.map((v, i) => <li key={i}>{v}</li>)}
          </ul>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Routing rule: <span className="font-mono">amount &lt; IMPS max → IMPS · IMPS max ≤ amount &lt; NEFT max → NEFT · ≥ NEFT max → RTGS</span>.
        Daily IMPS overflow falls back to NEFT.
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
        <span className="text-[11px] text-muted-foreground">{unit}</span>
        <input
          type="number"
          min={0}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
          className={cn(
            "w-28 h-9 rounded-md border border-border px-2 text-base font-bold tabular-nums",
            "bg-background text-foreground",
            "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
          )}
        />
        <span className="text-[10px] text-muted-foreground tabular-nums">
          ({fmtINR(value).replace("₹", "")})
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">{hint}</p>
    </div>
  );
}
