import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, MessageSquare, Save, Plus, Trash2, Braces, ChevronDown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  sellerService,
  SellerMessageGroup,
  SellerMessageVariable,
} from '@/services/seller.service';
import { cn } from '@/lib/utils';

// Friendly labels for each seller template key (falls back to the DB
// small_description / a humanised key).
const KEY_LABELS: Record<string, string> = {
  seller_cooldown_24h: 'Order cooldown (24h)',
  seller_liveness_request: 'Liveness — request',
  seller_liveness_timeout: 'Liveness — timeout',
  seller_doc_upload_request: 'Documents — upload request',
  seller_doc_name_mismatch: 'Documents — name mismatch',
  seller_doc_unreadable: 'Documents — unreadable',
  seller_doc_pan_failed: 'Documents — PAN failed',
  seller_doc_not_document: 'Documents — not a valid ID',
  seller_doc_missing: 'Documents — still missing',
  seller_doc_limit_exceeded: 'Documents — attempt limit',
  seller_doc_timeout: 'Documents — timeout',
  seller_verification_unavailable: 'Verification unavailable (credit out)',
  seller_thank_you: 'Thank you (payment done)',
  seller_otp_mobile_request: 'OTP — ask mobile number',
  seller_otp_mobile_invalid: 'OTP — invalid mobile number',
  seller_otp_sent: 'OTP — sent confirmation',
  seller_otp_send_failed: 'OTP — SMS send failed',
  seller_otp_invalid: 'OTP — wrong OTP',
  seller_otp_limit_exceeded: 'OTP — attempt limit',
  seller_sms_otp_template: 'OTP — SMS text (⚠️ DLT-approved)',
  seller_m3_order_verified_pay: 'Method 3 — order verified, pay',
  seller_m3_payment_link: 'Method 3 — payment link/QR',
  seller_m3_payment_received: 'Method 3 — payment received',
  seller_m3_released: 'Method 3 — crypto released',
  seller_m3_name_mismatch_refund: 'Method 3 — name mismatch refund',
  seller_m3_link_failed: 'Method 3 — link failed',
};

const humanise = (k: string) =>
  KEY_LABELS[k] || k.replace(/^seller_/, '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

export default function SellerMessages() {
  const [groups, setGroups] = useState<SellerMessageGroup[]>([]);
  const [variables, setVariables] = useState<SellerMessageVariable[]>([]);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(true);

  // Last-focused textarea so a clicked variable chip knows where to insert.
  const activeField = useRef<{ el: HTMLTextAreaElement; key: string; index: number } | null>(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [msgs, vars] = await Promise.all([
        sellerService.getSellerMessages(),
        sellerService.getSellerMessageVariables(),
      ]);
      if (msgs.success) {
        setGroups(
          msgs.data.map((g) => ({
            ...g,
            messages: [...g.messages].sort((a, b) => a.step_order - b.step_order),
          }))
        );
        setDirty(new Set());
      }
      if (vars.success) setVariables(vars.data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load seller messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const markDirty = (key: string) => setDirty((prev) => new Set(prev).add(key));

  const updateText = (key: string, index: number, val: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.template_key !== key) return g;
        const messages = [...g.messages];
        messages[index] = { ...messages[index], message_text: val };
        return { ...g, messages };
      })
    );
    markDirty(key);
  };

  const addVariation = (key: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.template_key !== key) return g;
        if (g.messages.length >= 5) {
          toast.error('Maximum 5 variations per message');
          return g;
        }
        return {
          ...g,
          messages: [...g.messages, { message_text: '', step_order: g.messages.length + 1 }],
        };
      })
    );
    markDirty(key);
  };

  const deleteVariation = async (key: string, index: number) => {
    const group = groups.find((g) => g.template_key === key);
    if (!group || group.messages.length <= 1) return;
    const target = group.messages[index];

    if (target.id) {
      try {
        await sellerService.deleteSellerMessage(target.id);
        toast.success('Variation deleted');
        await fetchAll();
      } catch {
        toast.error('Failed to delete');
      }
    } else {
      setGroups((prev) =>
        prev.map((g) =>
          g.template_key === key
            ? { ...g, messages: g.messages.filter((_, i) => i !== index) }
            : g
        )
      );
      markDirty(key);
    }
  };

  const insertVariable = (token: string) => {
    const active = activeField.current;
    if (!active) {
      navigator.clipboard?.writeText(token).catch(() => {});
      toast.info(`Copied ${token} — click a message field, then click the variable`);
      return;
    }
    const { el, key, index } = active;
    const group = groups.find((g) => g.template_key === key);
    if (!group?.messages[index]) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const current = group.messages[index].message_text ?? '';
    updateText(key, index, current.slice(0, start) + token + current.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      try {
        el.setSelectionRange(pos, pos);
      } catch {
        /* noop */
      }
    });
  };

  const onSave = async () => {
    if (dirty.size === 0) {
      toast.info('No changes to save');
      return;
    }
    setSaving(true);
    try {
      for (const key of Array.from(dirty)) {
        const group = groups.find((g) => g.template_key === key);
        if (!group) continue;
        const withOrder = group.messages.map((m, i) => ({ ...m, step_order: i + 1 }));
        const news = withOrder.filter((m) => !m.id && m.message_text.trim());
        const existing = withOrder.filter((m) => m.id);
        if (existing.length > 0) await sellerService.updateSellerMessages(key, existing);
        if (news.length > 0) await sellerService.createSellerMessages(key, news);
      }
      setSaved(true);
      toast.success('Messages saved');
      await fetchAll();
      setTimeout(() => setSaved(false), 1800);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading messages…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Chat Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Messages the bot sends buyers during verification (Method 1 &amp; 2). Add up to 5 variations — one is picked at random.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dirty.size > 0 && (
            <p className="text-[10px] text-primary font-medium animate-pulse">Unsaved changes in {dirty.size} block(s)</p>
          )}
          <button
            onClick={fetchAll}
            className="h-10 px-3 rounded-lg bg-surface-2 border border-border text-sm font-semibold flex items-center gap-2 hover:bg-surface-3 transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onSave}
            disabled={saving || dirty.size === 0}
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold text-sm flex items-center gap-2 disabled:opacity-50 disabled:grayscale transition-all"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
          </motion.button>
        </div>
      </div>

      {/* Variable palette */}
      {variables.length > 0 && (
        <div className="surface-card rounded-2xl border border-border overflow-hidden">
          <button
            onClick={() => setPaletteOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface-2/50 transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <Braces className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Variables</p>
                <p className="text-[11px] text-muted-foreground">
                  Click a message field, then click a variable to insert it.
                </p>
              </div>
            </div>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', paletteOpen && 'rotate-180')} />
          </button>
          <AnimatePresence initial={false}>
            {paletteOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 pt-1 flex flex-wrap gap-2">
                  {variables.map((v) => (
                    <button
                      key={v.name}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertVariable(v.token)}
                      title={`${v.description}  •  e.g. ${v.example}`}
                      className="inline-flex items-center gap-1 rounded-md bg-surface-2 border border-border px-2 py-1 text-[11px] font-mono text-primary hover:border-primary/50 hover:bg-primary/10 transition"
                    >
                      {v.token}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Message blocks */}
      <div className="grid gap-6 md:grid-cols-2">
        {groups.map((g, i) => {
          const isDirty = dirty.has(g.template_key);
          return (
            <motion.div
              key={g.template_key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                'surface-card rounded-2xl p-5 flex flex-col transition-all duration-300 border',
                isDirty ? 'border-primary/40 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.2)]' : 'border-border'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{humanise(g.template_key)}</p>
                    {g.small_description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{g.small_description}</p>
                    )}
                  </div>
                </div>
                {isDirty && <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />}
              </div>

              <div className="space-y-3 flex-1">
                {g.messages.map((msg, idx) => (
                  <div key={msg.id ?? `new-${idx}`} className="relative">
                    <AutoTextarea
                      value={msg.message_text}
                      onChange={(val) => updateText(g.template_key, idx, val)}
                      onFocus={(el) => (activeField.current = { el, key: g.template_key, index: idx })}
                    />
                    {g.messages.length > 1 && (
                      <button
                        onClick={() => deleteVariation(g.template_key, idx)}
                        className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-surface-3 border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition flex items-center justify-center shadow-lg"
                        title="Delete variation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {g.messages.length < 5 && (
                <button
                  onClick={() => addVariation(g.template_key)}
                  className="mt-4 w-full py-2 border border-dashed border-border rounded-lg text-[11px] font-medium text-muted-foreground hover:text-primary hover:border-primary/50 transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3 w-3" /> Add Variation
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function AutoTextarea({
  value,
  onChange,
  onFocus,
}: {
  value: string;
  onChange: (val: string) => void;
  onFocus: (el: HTMLTextAreaElement) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => ref.current && onFocus(ref.current)}
      rows={1}
      placeholder="Enter message…"
      className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition resize-none pr-9 overflow-hidden"
    />
  );
}
