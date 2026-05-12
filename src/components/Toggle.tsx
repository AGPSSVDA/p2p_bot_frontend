import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  checked: boolean;
  onChange: () => void;
  label?: string;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, size = "md", disabled }: Props) {
  const w = size === "sm" ? 36 : 48;
  const h = size === "sm" ? 20 : 26;
  const knob = size === "sm" ? 14 : 20;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative shrink-0 rounded-full transition-colors border",
        checked ? "bg-primary border-primary shadow-[0_0_18px_-4px_hsl(var(--primary)/0.7)]" : "bg-surface-3 border-border",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      style={{ width: w, height: h }}
    >
      <motion.span
        className={cn(
          "absolute top-1/2 left-1 rounded-full bg-background shadow-md",
          checked && "bg-primary-foreground"
        )}
        style={{ width: knob, height: knob, marginTop: -knob / 2 }}
        animate={{ x: checked ? w - knob - 8 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
      />
    </button>
  );
}
