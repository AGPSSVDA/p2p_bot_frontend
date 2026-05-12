import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

interface Props {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  value, decimals = 0, prefix = "", suffix = "", duration = 1.2, className,
}: Props) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) =>
    `${prefix}${v.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`
  );

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: "easeOut" });
    return controls.stop;
  }, [value, duration, mv]);

  return <motion.span className={className}>{display}</motion.span>;
}
