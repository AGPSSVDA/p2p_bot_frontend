import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, Loader2, MessageSquare, Save, Plus, Trash2, GripVertical 
} from "lucide-react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  MouseSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  TouchSensor
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { templateService, Template, TemplateMessage } from "@/services/template.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FIELD_METADATA: Record<string, { label: string; hint: string }> = {
  // Onboarding
  welcome:               { label: "Welcome message",        hint: "Sent immediately when a new order is detected." },
  panRequest:            { label: "PAN request",            hint: "Asks the seller to share their PAN." },

  // PAN handling
  panNotFound:           { label: "PAN not detected",       hint: "When no valid PAN is found in the seller's reply." },
  panImageRejected:      { label: "PAN image rejected",     hint: "When the seller sends an image instead of typing." },
  panInvalidFormat:      { label: "PAN invalid format",     hint: "When the PAN doesn't match the required format." },
  panApiInvalid:         { label: "PAN API invalid",        hint: "When Surepass returns invalid. Placeholder: {reason}." },
  panVerifiedTds:        { label: "PAN verified + TDS",     hint: "After verification — shows pre/post-TDS breakdown." },
  panReminder:           { label: "PAN reminder",           hint: "Sent if seller hasn't shared PAN yet." },
  panLastWarning:        { label: "PAN last warning",       hint: "Final warning before auto-cancel." },
  panMaxRetries:         { label: "PAN max retries",        hint: "After too many invalid PAN attempts." },
  panApiDown:            { label: "PAN API down",           hint: "When PAN verification system is unreachable." },
  nameMismatch:          { label: "Name mismatch",          hint: "PAN name vs KYC/bank name doesn't match." },

  // TDS
  tdsInfo:               { label: "TDS info",               hint: "TDS credit timing info (quarter/credit month)." },
  tdsConsent:            { label: "TDS consent request",    hint: "Asks seller to reply 'I AGREE' to TDS deduction." },
  tdsConsentRetry:       { label: "TDS consent retry",      hint: "Sent if reply is not a valid agreement." },
  consentReceived:       { label: "Consent received",       hint: "Acks TDS consent and starts payment flow." },

  // Payment
  paymentSent:           { label: "Payment sent",           hint: "After auto-payout. Placeholders: {method}, {utr}, {tan}." },
  manualPaymentPending:  { label: "Manual payment pending", hint: "Phase 1 manual payout placeholder." },
  manualPaymentAboveLimit: {
    label: "Manual payment (above auto-pay limit)",
    hint:  "Sent when amount exceeds the auto-pay cap; buyer team will pay manually. Placeholders: {amount}, {limit}, {method}.",
  },
  manualPaymentUpi: {
    label: "Manual payment (UPI-only seller)",
    hint:  "Sent when seller's only payment method is UPI (auto-payout requires bank account). Placeholders: {upi}, {postTDS}.",
  },
  paymentFailed:         { label: "Payment failed",         hint: "When payment processing throws an error." },

  // Cancellation & completion
  orderCancelled:        { label: "Order cancelled",        hint: "When order is auto-cancelled due to no response." },
  orderCancelledRemote:  { label: "Order cancelled (remote)", hint: "When seller cancels from Binance side." },
  thankYou:              { label: "Thank you",              hint: "Final message when order completes." },

  // Edge cases
  systemError:           { label: "System error",           hint: "Generic safety-net message." },
  escalated:             { label: "Escalated",              hint: "When order is escalated for manual review." },
  waitProcessing:        { label: "Wait processing",        hint: "Generic 'please wait' message." },
  waitRelease:           { label: "Wait release",           hint: "After payment sent; if seller messages again. Placeholder: {method}." },

  // Returning-seller shortcut
  returningSellerTdsApplied: {
    label: "Returning seller (TDS auto-applied)",
    hint:  "Sent when the seller already has a verified prior order. Placeholders: {kycName}, {sellerNickname}, {previousOrderNo}, {pan}, {panName}, {preTDS}, {tds}, {postTDS}.",
  },
};

interface SortableItemProps {
  id: string;
  value: string;
  onUpdate: (val: string) => void;
  onDelete: () => void;
  showDragHandle: boolean;
}

function SortableItem({ id, value, onUpdate, onDelete, showDragHandle }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);


  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex gap-2 group relative transition-opacity",
        isDragging && "opacity-50"
      )}
    >
      {showDragHandle && (
        <div 
          {...attributes} 
          {...listeners}
          style={{ touchAction: "none" }}
          className="mt-2.5 cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-primary transition shrink-0"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}
      {!showDragHandle && <div className="w-6 shrink-0" />}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onUpdate(e.target.value)}
          rows={1}
          className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition resize-none pr-9 overflow-hidden"
          placeholder="Enter message..."
        />
        {showDragHandle && (
          <button
            onClick={onDelete}
            className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-surface-3 border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition flex items-center justify-center shadow-lg"
            title="Delete message"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function ChatConfig() {
  const [tpl, setTpl] = useState<Record<string, Template>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchTemplates = async () => {
    try {
      const res = await templateService.getTemplates();
      if (res.success && res.data) {
        const mapped: Record<string, Template> = {};
        res.data.forEach((item: Template) => {
          mapped[item.template_key] = {
            ...item,
            messages: item.messages.sort((a, b) => a.step_order - b.step_order)
          };
        });
        setTpl(mapped);
        setDirtyKeys(new Set()); 
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const markDirty = (key: string) => {
    setDirtyKeys(prev => new Set(prev).add(key));
  };

  const onSave = async () => {
    if (dirtyKeys.size === 0) {
      toast.info("No changes to save");
      return;
    }

    setSaving(true);
    try {
      const dirtyArray = Array.from(dirtyKeys);
      
      for (const key of dirtyArray) {
        const messages = tpl[key].messages;
        
        // 1. Separate New vs Existing messages
        const newMessages = messages
          .map((m, idx) => ({ ...m, step_order: idx + 1 }))
          .filter(m => !m.id);
          
        const existingMessages = messages
          .map((m, idx) => ({ ...m, step_order: idx + 1 }))
          .filter(m => m.id);

        // 2. If there are NEW messages, call POST /api/templates
        if (newMessages.length > 0) {
          await templateService.createTemplates(key, newMessages);
        }

        // 3. If there are EXISTING messages (even if just reordered), call PUT /api/templates
        if (existingMessages.length > 0) {
          await templateService.updateTemplates(key, existingMessages);
        }
      }

      setSaved(true);
      toast.success("Changes saved successfully!");
      await fetchTemplates();
      setTimeout(() => setSaved(false), 1800);
    } catch (error: any) {
      console.error("Save failed:", error);
      toast.error(error.response?.data?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const addMessage = (key: string) => {
    if (tpl[key].messages.length >= 5) {
      toast.error("Maximum 5 messages per block");
      return;
    }
    const nextOrder = tpl[key].messages.length + 1;
    setTpl(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        messages: [...prev[key].messages, { message_text: "", step_order: nextOrder }]
      }
    }));
    markDirty(key);
  };

  const updateMessage = (key: string, index: number, val: string) => {
    setTpl(prev => {
      const nextMessages = [...prev[key].messages];
      nextMessages[index] = { ...nextMessages[index], message_text: val };
      return { 
        ...prev, 
        [key]: { ...prev[key], messages: nextMessages }
      };
    });
    markDirty(key);
  };

  const deleteMessage = async (key: string, index: number) => {
    if (tpl[key].messages.length <= 1) return;
    const target = tpl[key].messages[index];
    
    if (target.id) {
      try {
        setLoading(true);
        await templateService.deleteMessage(target.id);
        toast.success("Message deleted");
        await fetchTemplates();
      } catch (error) {
        toast.error("Failed to delete");
      } finally {
        setLoading(false);
      }
    } else {
      setTpl(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          messages: prev[key].messages.filter((_, i) => i !== index)
        }
      }));
      markDirty(key);
    }
  };

  const handleDragEnd = (event: DragEndEvent, key: string) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTpl((prev) => {
        const oldIndex = parseInt(active.id.toString().split("-").pop() || "0");
        const newIndex = parseInt(over.id.toString().split("-").pop() || "0");
        return {
          ...prev,
          [key]: {
            ...prev[key],
            messages: arrayMove(prev[key].messages, oldIndex, newIndex)
          },
        };
      });
      markDirty(key);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Syncing templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Chat Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">Customize automated replies. Up to 5 variations per scenario.</p>
        </div>
        <div className="flex items-center gap-3">
           {dirtyKeys.size > 0 && (
             <p className="text-[10px] text-primary font-medium animate-pulse">Unsaved changes in {dirtyKeys.size} block(s)</p>
           )}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onSave}
            disabled={saving || dirtyKeys.size === 0}
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold text-sm shadow-[0_6px_22px_-8px_hsl(var(--primary)/0.6)] flex items-center gap-2 disabled:opacity-50 disabled:grayscale transition-all"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
          </motion.button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Object.keys(tpl).map((key, i) => {
          const item = tpl[key];
          const meta = { 
            label: FIELD_METADATA[key]?.label || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
            hint: item.small_description || FIELD_METADATA[key]?.hint || "No description available." 
          };
          const isDirty = dirtyKeys.has(key);
          
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.03 }}
              className={cn(
                "surface-card rounded-2xl p-5 flex flex-col transition-all duration-300 border",
                isDirty ? "border-primary/40 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.2)]" : "border-border"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{meta.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{meta.hint}</p>
                  </div>
                </div>
                {isDirty && (
                  <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                )}
              </div>

              <div className="space-y-3 flex-1">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(e, key)}
                >
                  <SortableContext
                    items={item.messages.map((_, idx) => `${key}-${idx}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {item.messages.map((msg, idx) => (
                        <SortableItem
                          key={`${key}-${idx}`}
                          id={`${key}-${idx}`}
                          value={msg.message_text}
                          onUpdate={(val) => updateMessage(key, idx, val)}
                          onDelete={() => deleteMessage(key, idx)}
                          showDragHandle={item.messages.length > 1}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              {item.messages.length < 5 && (
                <button
                  onClick={() => addMessage(key)}
                  className="mt-4 w-full py-2 border border-dashed border-border rounded-lg text-[11px] font-medium text-muted-foreground hover:text-primary hover:border-primary/50 transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3 w-3" />
                  Add Variation
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
