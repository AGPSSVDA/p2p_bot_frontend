import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { SellerAd } from '@/services/seller.service';
import { sellerService } from '@/services/seller.service';

interface AdDetailsModalProps {
  ad: SellerAd;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

// Validation rules per field. Module-level (pure data) so the field component
// below can be a stable reference and inputs don't lose focus on re-render.
// Validation rules per field. Ranges + step mirror what Binance /ads/update
// actually accepts (see the Eligibility Criteria Reference):
//   - min30dayTrades       -> userTradeCompleteCountMin (integer, last 30D)
//   - min30dayCompletionRate -> userTradeCompleteRateMin (0-100% here; backend
//                               converts to the 0-1 decimal Binance wants). Allows
//                               a fractional percent, so it's a FLOAT field.
//   - minRegisteredDays    -> buyerRegDaysLimit(=1) + buyerRegisterLimit (max 180)
//   - minBtcHolding        -> buyerBtcPositionLimit (BTC amount, FLOAT e.g. 0.01)
// `float` marks fields that must NOT be rounded to a whole number.
const fieldValidations: Record<string, { min?: number; max?: number; step?: number; float?: boolean; description: string }> = {
  min30dayTrades: { min: 0, max: 9999, step: 1, description: 'Min total completed trades the buyer must have. This actually blocks under-qualified buyers (unlike the old 30-day-only rule, which Binance did not enforce).' },
  min30dayCompletionRate: { min: 0, max: 100, step: 0.1, float: true, description: 'Percentage 0-100 (decimals allowed, e.g. 95.5)' },
  minRegisteredDays: { min: 0, max: 90, step: 1, description: 'Min account age in days (e.g. 30). Binance max is 90 — higher values are rejected.' },
  minAllTradesCount: { min: 0, max: 9999, step: 1, description: 'Total trades, all-time (whole number)' },
  minBuyOrdersCount: { min: 0, max: 9999, step: 1, description: 'Buy orders, all-time (whole number)' },
  minSellOrdersCount: { min: 0, max: 9999, step: 1, description: 'Sell orders, all-time (whole number)' },
  minTradeVolume: { min: 0, max: 999999999, step: 1, description: 'Minimum USDT volume, all-time (advanced)' },
  maxTradeVolume: { min: 0, max: 999999999, step: 1, description: 'Maximum USDT volume, all-time (advanced)' },
  minBtcHolding: { min: 0, max: 1000, step: 0.0001, float: true, description: 'Minimum BTC amount, e.g. 0.01 (decimals allowed)' },
};

// Parse a field's value with the right numeric type: float-marked fields keep
// their decimals (completion rate, BTC holding); everything else is a count.
function parseFieldValue(fieldName: string, raw: any): number {
  const isFloat = fieldValidations[fieldName]?.float;
  const n = isFloat ? parseFloat(raw) : parseInt(raw, 10);
  return isNaN(n) ? 0 : n;
}

function getFieldWarning(fieldName: string, value: any): string | null {
  const validation = fieldValidations[fieldName];
  if (!validation) return null;
  const val = parseFieldValue(fieldName, value);
  if (validation.min !== undefined && val < validation.min) return `Minimum value: ${validation.min}`;
  if (validation.max !== undefined && val > validation.max) return `Maximum value: ${validation.max}`;
  return null;
}

// Reusable eligibility field. Defined at MODULE scope (not inside the component)
// so React keeps the same component type across renders — otherwise the <Input>
// remounts on every keystroke and loses cursor focus.
function EligibilityField({
  fieldName,
  label,
  value,
  enabled,
  onChange,
  onToggle,
}: any) {
  const validation = fieldValidations[fieldName];
  const warning = enabled ? getFieldWarning(fieldName, value) : null;

  return (
    <div className="pb-3 border-b border-border last:border-b-0">
      {/* 1) Checkbox + label first — toggle the criterion */}
      <div className="flex items-start gap-2 mb-2">
        <Checkbox
          id={`${fieldName}_enabled`}
          checked={enabled}
          onCheckedChange={onToggle}
          className="h-5 w-5 shrink-0 mt-0.5"
        />
        <div className="flex flex-col gap-0.5 min-w-0">
          <Label htmlFor={`${fieldName}_enabled`} className="text-sm text-foreground font-medium cursor-pointer">{label}</Label>
          {validation && <span className="text-[11px] text-muted-foreground/70">{validation.description}</span>}
        </div>
      </div>

      {/* 2) Then the input for the value */}
      <Input
        id={fieldName}
        type="number"
        min={validation?.min}
        max={validation?.max}
        step={validation?.step ?? 1}
        disabled={!enabled}
        value={value}
        onChange={onChange}
        placeholder="0"
        className={`w-full bg-background border border-input text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-40 disabled:cursor-not-allowed ${
          warning ? 'border-amber-500' : ''
        }`}
      />
      {warning && (
        <div className="flex items-center gap-1 mt-1 text-amber-400 text-xs">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
}

// Small 30-Day / All-time selector for a group of criteria. Binance scopes the
// requirement to Last 30 Days (1) or All-time (2); the admin picks here.
// `controls` spells out exactly which eligibility fields this window applies to,
// so it's obvious what each dropdown affects.
function FilterTimeSelect({
  title,
  controls,
  value,
  onChange,
}: {
  title: string;
  controls: string[];
  value: 1 | 2;
  onChange: (v: 1 | 2) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 md:col-span-2 mt-1 mb-1 px-3 py-2 rounded-lg bg-background/60 border border-dashed border-border">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs font-medium text-foreground">{title} — time window</span>
        <span className="text-[11px] text-muted-foreground/80">
          Controls: {controls.join(', ')}
        </span>
      </div>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v) as 1 | 2)}>
        <SelectTrigger className="h-8 w-[150px] shrink-0 text-xs bg-background border-input">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Last 30 Days</SelectItem>
          <SelectItem value="2">All-time</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default function AdDetailsModal({
  ad,
  isOpen,
  onClose,
  onUpdated,
}: AdDetailsModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rules, setRules] = useState(ad.rules);
  const [validationError, setValidationError] = useState<string | null>(null);
  // Sync rules when ad prop changes
  useEffect(() => {
    setRules(ad.rules);
  }, [ad, isOpen]);

  const handleSave = async () => {
    try {
      setValidationError(null);
      setSaving(true);

      console.log('\n🔄 [FRONTEND] Starting save...');
      console.log('📋 Rules to save:');
      console.log(JSON.stringify(rules, null, 2));

      // Verification methods are optional — admin may enable any, all, or none.

      // Methods and eligibility are saved via SEPARATE endpoints because they are
      // different things:
      //   - Methods     -> bot behaviour after an order arrives. DB only, no Binance.
      //   - Eligibility -> criteria on the Binance ad itself. Must reach Binance.
      // Methods are saved FIRST and independently, so a Binance rejection
      // (e.g. error 187022 on a non-editable ad) never discards them.

      // Step 1: Save verification methods (DB only — always safe)
      try {
        console.log('\n⚙️ [FRONTEND] Step 1: Saving verification methods (DB only)...');
        console.log('📤 Methods:', JSON.stringify(rules.methods, null, 2));
        await sellerService.updateAdMethods(ad.adNo, rules);
        console.log('✅ [FRONTEND] Methods saved');
      } catch (methodsErr: any) {
        console.log(`❌ [FRONTEND] Methods save failed: ${methodsErr.message}`);
        setError(`Failed to save verification methods: ${methodsErr?.response?.data?.error || methodsErr.message || 'Unknown error'}`);
        setSaving(false);
        return;
      }

      // Step 1b: Save re-order cooldown (DB only — a bot feature, NOT a Binance
      // criterion). Done separately so it saves even if the Binance sync below
      // fails (e.g. Binance rejects the ad update with 187040).
      try {
        console.log('\n⏲️ [FRONTEND] Step 1b: Saving re-order cooldown (DB only)...');
        await sellerService.updateAdCooldown(ad.adNo, {
          enabled: !!rules.cooldown?.enabled,
          hours: rules.cooldown?.hours ?? 24,
        });
        console.log('✅ [FRONTEND] Cooldown saved');
      } catch (cdErr: any) {
        console.log(`❌ [FRONTEND] Cooldown save failed: ${cdErr.message}`);
        setError(`Failed to save re-order cooldown: ${cdErr?.response?.data?.error || cdErr.message || 'Unknown error'}`);
        setSaving(false);
        return;
      }

      // Step 2: Sync eligibility criteria to Binance (then backend saves them to DB)
      try {
        console.log('\n🔄 [FRONTEND] Step 2: Syncing eligibility to Binance...');
        console.log('📤 Eligibility:', JSON.stringify(rules.eligibility, null, 2));
        await sellerService.syncEligibilityToBinance(ad.adNo, rules);
        console.log('✅ [FRONTEND] Binance sync successful');
      } catch (syncErr: any) {
        // Methods are already saved; only the Binance eligibility sync failed.
        console.log(`❌ [FRONTEND] Binance sync failed: ${syncErr.message}`);
        const reason = syncErr?.response?.data?.error || syncErr.message || 'Unknown error';
        setError(`Verification methods were saved, but eligibility could not be updated on Binance: ${reason}`);
        setSaving(false);
        await onUpdated(); // still refresh so the saved methods show
        return;
      }

      // Wait a brief moment for backend to process
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Fetch fresh data from the ads API
      await onUpdated();

      // Step 4: Close modal after all updates complete
      onClose();
    } catch (err) {
      setError('Failed to update rules');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const updateEligibility = (field: string, value: any) => {
    setRules({
      ...rules,
      eligibility: {
        ...rules.eligibility,
        [field]: value,
      },
    });
  };

  const getCriterionValue = (criterion: any) => {
    if (!criterion) return '';
    if (typeof criterion === 'object' && 'value' in criterion) {
      return criterion.value || '';
    }
    return criterion;
  };

  const getCriterionEnabled = (criterion: any) => {
    if (!criterion) return false; // DEFAULT OFF
    if (typeof criterion === 'object' && 'enabled' in criterion) {
      return criterion.enabled === true;
    }
    return false; // DEFAULT OFF
  };

  const getMethodEnabled = (value: any) => {
    // Handle both boolean (true/false) and number (1/0) from database
    if (value === undefined || value === null) return false;
    return value === true || value === 1;
  };

  const updateMethod = (method: 'method1' | 'method2' | 'method3', field: string, value: any) => {
    setRules({
      ...rules,
      methods: {
        ...rules.methods,
        [method]: {
          ...rules.methods[method],
          [field]: value,
        },
      },
    });
  };

  const updateCooldown = (field: 'enabled' | 'hours', value: any) => {
    setRules({
      ...rules,
      cooldown: {
        enabled: rules.cooldown?.enabled ?? false,
        hours: rules.cooldown?.hours ?? 24,
        [field]: value,
      },
    });
  };

  // Filter-time (30D vs All-time) per criterion group. Defaults match Binance:
  // trade-count & completion-rate = Last 30D (1), volume = All-time (2).
  const ft = {
    tradeCount: (rules.filterTime?.tradeCount ?? 1) as 1 | 2,
    completionRate: (rules.filterTime?.completionRate ?? 1) as 1 | 2,
    tradeVolume: (rules.filterTime?.tradeVolume ?? 2) as 1 | 2,
  };
  const updateFilterTime = (field: 'tradeCount' | 'completionRate' | 'tradeVolume', value: 1 | 2) => {
    setRules({
      ...rules,
      filterTime: { ...ft, [field]: value },
    });
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-full max-w-4xl max-h-[95vh] overflow-y-auto p-0 bg-background border-border">
        {/* Header */}
        <DialogHeader className="bg-surface-2 px-4 sm:px-6 py-4 border-b border-border sticky top-0 z-10">
          <div>
            <DialogTitle className="text-lg sm:text-xl font-bold">Edit Ad Configuration</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1 break-all">
              {ad.asset}/{ad.fiatUnit} • Ad #{ad.adNo}
            </p>
          </div>
        </DialogHeader>

        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-destructive/15 border border-destructive/30 rounded-lg flex gap-2">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <span className="text-destructive text-sm">{error}</span>
          </div>
        )}

        {validationError && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-destructive/15 border border-destructive/30 rounded-lg flex gap-2">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <span className="text-destructive text-sm">{validationError}</span>
          </div>
        )}

        <div className="space-y-6 px-4 sm:px-6 py-4">
          {/* Eligibility Criteria */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full shrink-0"></div>
              <h3 className="font-semibold text-lg">Eligibility Criteria</h3>
            </div>
            <p className="text-xs text-muted-foreground ml-3">
              Set minimum requirements for buyers to qualify for this ad
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 bg-surface-2 p-3 sm:p-4 rounded-xl border border-border">
              <EligibilityField
                fieldName="min30dayTrades"
                label="Min Trades (completed)"
                value={getCriterionValue(rules.eligibility.min30dayTrades)}
                enabled={getCriterionEnabled(rules.eligibility.min30dayTrades)}
                onChange={(e: any) =>
                  updateEligibility('min30dayTrades', {
                    enabled: getCriterionEnabled(rules.eligibility.min30dayTrades),
                    value: parseFieldValue('min30dayTrades', e.target.value)
                  })
                }
                onToggle={(checked: boolean) => {
                  const currentValue = getCriterionValue(rules.eligibility.min30dayTrades);
                  updateEligibility('min30dayTrades', {
                    enabled: checked,
                    value: checked ? currentValue : 0
                  });
                }}
              />

              {/* Trade-count window: scopes Min 30-Day Trades AND Min All Trades Count.
                  Placed right under Min 30-Day Trades so the choice is obvious. Pick
                  All-time for reliable blocking (30-Day lets new 0-trade accounts in). */}
              <FilterTimeSelect
                title="Trade Count"
                controls={['Min Trades (completed)', 'Min All Trades Count']}
                value={ft.tradeCount}
                onChange={(v) => updateFilterTime('tradeCount', v)}
              />

              <EligibilityField
                fieldName="min30dayCompletionRate"
                label="Min Completion Rate (%)"
                value={getCriterionValue(rules.eligibility.min30dayCompletionRate)}
                enabled={getCriterionEnabled(rules.eligibility.min30dayCompletionRate)}
                onChange={(e: any) =>
                  updateEligibility('min30dayCompletionRate', {
                    enabled: getCriterionEnabled(rules.eligibility.min30dayCompletionRate),
                    value: parseFieldValue('min30dayCompletionRate', e.target.value)
                  })
                }
                onToggle={(checked: boolean) => {
                  const currentValue = getCriterionValue(rules.eligibility.min30dayCompletionRate);
                  updateEligibility('min30dayCompletionRate', {
                    enabled: checked,
                    value: checked ? currentValue : 0
                  });
                }}
              />

              {/* Completion Rate is scoped by its own filter window */}
              <FilterTimeSelect
                title="Completion Rate"
                controls={['Min Completion Rate (%)']}
                value={ft.completionRate}
                onChange={(v) => updateFilterTime('completionRate', v)}
              />

              <EligibilityField
                fieldName="minRegisteredDays"
                label="Min Registered Days"
                value={getCriterionValue(rules.eligibility.minRegisteredDays)}
                enabled={getCriterionEnabled(rules.eligibility.minRegisteredDays)}
                onChange={(e: any) =>
                  updateEligibility('minRegisteredDays', {
                    enabled: getCriterionEnabled(rules.eligibility.minRegisteredDays),
                    value: parseFieldValue('minRegisteredDays', e.target.value)
                  })
                }
                onToggle={(checked: boolean) => {
                  const currentValue = getCriterionValue(rules.eligibility.minRegisteredDays);
                  updateEligibility('minRegisteredDays', {
                    enabled: checked,
                    value: checked ? currentValue : 0
                  });
                }}
              />

              <EligibilityField
                fieldName="minAllTradesCount"
                label="Min All Trades Count"
                value={getCriterionValue(rules.eligibility.minAllTradesCount)}
                enabled={getCriterionEnabled(rules.eligibility.minAllTradesCount)}
                onChange={(e: any) =>
                  updateEligibility('minAllTradesCount', {
                    enabled: getCriterionEnabled(rules.eligibility.minAllTradesCount),
                    value: parseFieldValue('minAllTradesCount', e.target.value)
                  })
                }
                onToggle={(checked: boolean) => {
                  const currentValue = getCriterionValue(rules.eligibility.minAllTradesCount);
                  updateEligibility('minAllTradesCount', {
                    enabled: checked,
                    value: checked ? currentValue : 0
                  });
                }}
              />

              <EligibilityField
                fieldName="minBuyOrdersCount"
                label="Min Buy Orders Count"
                value={getCriterionValue(rules.eligibility.minBuyOrdersCount)}
                enabled={getCriterionEnabled(rules.eligibility.minBuyOrdersCount)}
                onChange={(e: any) =>
                  updateEligibility('minBuyOrdersCount', {
                    enabled: getCriterionEnabled(rules.eligibility.minBuyOrdersCount),
                    value: parseFieldValue('minBuyOrdersCount', e.target.value)
                  })
                }
                onToggle={(checked: boolean) => {
                  const currentValue = getCriterionValue(rules.eligibility.minBuyOrdersCount);
                  updateEligibility('minBuyOrdersCount', {
                    enabled: checked,
                    value: checked ? currentValue : 0
                  });
                }}
              />

              <EligibilityField
                fieldName="minSellOrdersCount"
                label="Min Sell Orders Count"
                value={getCriterionValue(rules.eligibility.minSellOrdersCount)}
                enabled={getCriterionEnabled(rules.eligibility.minSellOrdersCount)}
                onChange={(e: any) =>
                  updateEligibility('minSellOrdersCount', {
                    enabled: getCriterionEnabled(rules.eligibility.minSellOrdersCount),
                    value: parseFieldValue('minSellOrdersCount', e.target.value)
                  })
                }
                onToggle={(checked: boolean) => {
                  const currentValue = getCriterionValue(rules.eligibility.minSellOrdersCount);
                  updateEligibility('minSellOrdersCount', {
                    enabled: checked,
                    value: checked ? currentValue : 0
                  });
                }}
              />

              {/* ADVANCED OPTIONS SECTION */}
              <div className="md:col-span-2 mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-primary mb-3">🚀 Advanced Options</h4>
              </div>

              <EligibilityField
                fieldName="minTradeVolume"
                label="Min Trade Volume (USDT)"
                value={getCriterionValue(rules.eligibility.minTradeVolume)}
                enabled={getCriterionEnabled(rules.eligibility.minTradeVolume)}
                onChange={(e: any) =>
                  updateEligibility('minTradeVolume', {
                    enabled: getCriterionEnabled(rules.eligibility.minTradeVolume),
                    value: parseFieldValue('minTradeVolume', e.target.value)
                  })
                }
                onToggle={(checked: boolean) => {
                  const currentValue = getCriterionValue(rules.eligibility.minTradeVolume);
                  updateEligibility('minTradeVolume', {
                    enabled: checked,
                    value: checked ? currentValue : 0
                  });
                }}
              />

              <EligibilityField
                fieldName="maxTradeVolume"
                label="Max Trade Volume (USDT)"
                value={getCriterionValue(rules.eligibility.maxTradeVolume)}
                enabled={getCriterionEnabled(rules.eligibility.maxTradeVolume)}
                onChange={(e: any) =>
                  updateEligibility('maxTradeVolume', {
                    enabled: getCriterionEnabled(rules.eligibility.maxTradeVolume),
                    value: parseFieldValue('maxTradeVolume', e.target.value)
                  })
                }
                onToggle={(checked: boolean) => {
                  const currentValue = getCriterionValue(rules.eligibility.maxTradeVolume);
                  updateEligibility('maxTradeVolume', {
                    enabled: checked,
                    value: checked ? currentValue : 0
                  });
                }}
              />

              {/* Min + Max Trade Volume share this filter window */}
              <FilterTimeSelect
                title="Trade Volume"
                controls={['Min Trade Volume (USDT)', 'Max Trade Volume (USDT)']}
                value={ft.tradeVolume}
                onChange={(v) => updateFilterTime('tradeVolume', v)}
              />

              <EligibilityField
                fieldName="minBtcHolding"
                label="Min BTC Holdings"
                value={getCriterionValue(rules.eligibility.minBtcHolding)}
                enabled={getCriterionEnabled(rules.eligibility.minBtcHolding)}
                onChange={(e: any) =>
                  updateEligibility('minBtcHolding', {
                    enabled: getCriterionEnabled(rules.eligibility.minBtcHolding),
                    value: parseFieldValue('minBtcHolding', e.target.value)
                  })
                }
                onToggle={(checked: boolean) => {
                  const currentValue = getCriterionValue(rules.eligibility.minBtcHolding);
                  updateEligibility('minBtcHolding', {
                    enabled: checked,
                    value: checked ? currentValue : 0
                  });
                }}
              />

            </div>
          </div>

          {/* Verification Methods */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full shrink-0"></div>
              <h3 className="font-semibold text-lg">Verification Methods</h3>
            </div>
            <p className="text-xs text-muted-foreground ml-3">
              Enable any verification methods for buyers (optional)
            </p>

            {/* Method 1 */}
            <div className="border border-border bg-surface-2 p-3 sm:p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="method1_enabled"
                  checked={getMethodEnabled(rules.methods.method1.enabled)}
                  onCheckedChange={(checked) =>
                    updateMethod('method1', 'enabled', checked)
                  }
                  className="h-5 w-5 shrink-0"
                />
                <Label htmlFor="method1_enabled" className="font-semibold cursor-pointer">
                  Method 1: Liveness Check
                </Label>
              </div>
              {rules.methods.method1.enabled && (
                <div className="ml-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="method1_mobile"
                      checked={getMethodEnabled(rules.methods.method1.mobileVerification)}
                      onCheckedChange={(checked) =>
                        updateMethod('method1', 'mobileVerification', checked)
                      }
                      className="h-5 w-5 shrink-0"
                    />
                    <Label htmlFor="method1_mobile" className="text-sm text-foreground cursor-pointer">
                      Require Mobile OTP Verification
                    </Label>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground ml-6">
                Buyer completes liveness check on Binance. Fastest verification method.
                Optionally require mobile OTP after liveness (same as Method 2).
              </p>
            </div>

            {/* Method 2 */}
            <div className="border border-border bg-surface-2 p-3 sm:p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="method2_enabled"
                  checked={getMethodEnabled(rules.methods.method2.enabled)}
                  onCheckedChange={(checked) =>
                    updateMethod('method2', 'enabled', checked)
                  }
                  className="h-5 w-5 shrink-0"
                />
                <Label htmlFor="method2_enabled" className="font-semibold cursor-pointer">
                  Method 2: Documents + OTP
                </Label>
              </div>
              {rules.methods.method2.enabled && (
                <div className="ml-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="method2_mobile"
                      checked={getMethodEnabled(rules.methods.method2.mobileVerification)}
                      onCheckedChange={(checked) =>
                        updateMethod('method2', 'mobileVerification', checked)
                      }
                      className="h-5 w-5 shrink-0"
                    />
                    <Label htmlFor="method2_mobile" className="text-sm text-foreground cursor-pointer">
                      Require Mobile OTP Verification
                    </Label>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground ml-6">
                Verify Aadhaar & PAN documents. Optional mobile OTP verification.
              </p>
            </div>

            {/* Method 3 */}
            <div className="border border-border bg-surface-2 p-3 sm:p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="method3_enabled"
                  checked={getMethodEnabled(rules.methods.method3.enabled)}
                  onCheckedChange={(checked) =>
                    updateMethod('method3', 'enabled', checked)
                  }
                  className="h-5 w-5 shrink-0"
                />
                <Label htmlFor="method3_enabled" className="font-semibold cursor-pointer">
                  Method 3: Full Verification (Documents + Payment)
                </Label>
              </div>
              {rules.methods.method3.enabled && (
                <div className="ml-6 space-y-3">
                  <div>
                    <Label htmlFor="payment_gateway" className="text-sm text-foreground">
                      Payment Gateway <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={rules.methods.method3.paymentGateway}
                      onValueChange={(value) =>
                        updateMethod('method3', 'paymentGateway', value)
                      }
                    >
                      <SelectTrigger id="payment_gateway" className="bg-surface-2 border-border text-foreground mt-1">
                        <SelectValue placeholder="Choose a payment gateway" />
                      </SelectTrigger>
                      <SelectContent className="bg-surface-2 border-border">
                        <SelectItem value="easebuzz">Easebuzz (payment link + QR)</SelectItem>
                        <SelectItem value="express_upi">Express UPI (Binance native)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {rules.methods.method3.paymentGateway === 'express_upi'
                        ? 'Buyer pays to your UPI (shown as QR and/or link in chat). The bot detects the payment and auto-releases the crypto.'
                        : 'The buyer pays the exact order amount via this gateway (payment link/QR sent in chat).'}
                    </p>

                    {/* Express UPI: choose what to show the buyer — QR and/or UPI link */}
                    {rules.methods.method3.paymentGateway === 'express_upi' && (
                      <div className="mt-3 space-y-2 rounded-lg bg-background/60 border border-dashed border-border p-3">
                        <span className="text-[11px] text-muted-foreground">Show the buyer:</span>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="express_qr"
                            checked={getMethodEnabled(rules.methods.method3.expressQrEnabled)}
                            onCheckedChange={(checked) => updateMethod('method3', 'expressQrEnabled', checked)}
                            className="h-5 w-5 shrink-0"
                          />
                          <Label htmlFor="express_qr" className="text-sm text-foreground cursor-pointer">Enable QR (scannable UPI QR)</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="express_link"
                            checked={getMethodEnabled(rules.methods.method3.expressLinkEnabled)}
                            onCheckedChange={(checked) => updateMethod('method3', 'expressLinkEnabled', checked)}
                            className="h-5 w-5 shrink-0"
                          />
                          <Label htmlFor="express_link" className="text-sm text-foreground cursor-pointer">Enable Link (UPI ID / upi:// link)</Label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delivery Method only applies to link-based gateways (Easebuzz).
                      Express UPI has no link, so hide it there. */}
                  {rules.methods.method3.paymentGateway !== 'express_upi' && (
                    <div>
                      <Label htmlFor="delivery_method" className="text-sm text-foreground">
                        Delivery Method
                      </Label>
                      <Select
                        value={rules.methods.method3.deliveryMethod}
                        onValueChange={(value) =>
                          updateMethod('method3', 'deliveryMethod', value)
                        }
                      >
                        <SelectTrigger id="delivery_method" className="bg-surface-2 border-border text-foreground mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-surface-2 border-border">
                          <SelectItem value="payment_link">Payment Link</SelectItem>
                          <SelectItem value="qr_code">QR Code</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="method3_mobile"
                      checked={getMethodEnabled(rules.methods.method3.mobileVerification)}
                      onCheckedChange={(checked) =>
                        updateMethod('method3', 'mobileVerification', checked)
                      }
                      className="h-5 w-5 shrink-0"
                    />
                    <Label htmlFor="method3_mobile" className="text-sm text-foreground cursor-pointer">
                      Require Mobile OTP Verification
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="method3_payment_link"
                      checked={getMethodEnabled(rules.methods.method3.paymentLink)}
                      onCheckedChange={(checked) =>
                        updateMethod('method3', 'paymentLink', checked)
                      }
                      className="h-5 w-5 shrink-0"
                    />
                    <Label htmlFor="method3_payment_link" className="text-sm text-foreground cursor-pointer">
                      Enable Payment Link/QR
                    </Label>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground ml-6">
                Complete verification with payment proof. Highest security level.
              </p>
            </div>
          </div>

          {/* Re-order cooldown */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Re-order Cooldown</h3>
            </div>
            <div className="border border-border bg-surface-2 p-3 sm:p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="reorder_cooldown_enabled"
                  checked={!!rules.cooldown?.enabled}
                  onCheckedChange={(checked) => updateCooldown('enabled', checked === true)}
                  className="h-5 w-5 shrink-0"
                />
                <Label htmlFor="reorder_cooldown_enabled" className="font-semibold cursor-pointer">
                  Block the same buyer from re-ordering for a while
                </Label>
              </div>
              {rules.cooldown?.enabled && (
                <div className="ml-6">
                  <Label htmlFor="reorder_cooldown_hours" className="text-sm text-foreground">
                    Cooldown period (hours)
                  </Label>
                  <input
                    id="reorder_cooldown_hours"
                    type="number"
                    min={1}
                    value={rules.cooldown?.hours ?? 24}
                    onChange={(e) => updateCooldown('hours', parseInt(e.target.value) || 24)}
                    className="mt-1 h-10 w-32 px-3 rounded-lg bg-background border border-input text-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    After a buyer <span className="font-semibold text-foreground">completes</span> an order on this ad,
                    they can't place a new one for this many hours.
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground ml-6">
                Off = the same buyer can order again immediately.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="bg-surface-2 border-t border-border px-4 sm:px-6 py-4 mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end sticky bottom-0">
          <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
