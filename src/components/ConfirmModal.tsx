import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel",
  destructive, onConfirm, onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCancel}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative w-full max-w-md surface-card rounded-2xl p-6 shadow-[var(--shadow-elevated)]"
          >
            <button
              onClick={onCancel}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className={cn(
                "h-11 w-11 shrink-0 rounded-full flex items-center justify-center",
                destructive ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"
              )}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base text-foreground">{title}</h3>
                {description && (
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onCancel}
                className="px-4 h-10 rounded-lg border border-border bg-surface-2 hover:bg-surface-3 text-sm font-medium transition"
              >
                {cancelLabel}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onConfirm}
                className={cn(
                  "px-4 h-10 rounded-lg text-sm font-semibold transition shadow-[0_4px_18px_-4px_hsl(var(--primary)/0.5)]",
                  destructive
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_4px_18px_-4px_hsl(var(--destructive)/0.5)]"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
