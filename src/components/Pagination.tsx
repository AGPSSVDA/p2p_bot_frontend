import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}

export function Pagination({ page, total, pageSize, onChange }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const goto = (p: number) => onChange(Math.min(Math.max(1, p), pages));

  const visible = (() => {
    const arr: (number | "…")[] = [];
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || Math.abs(i - page) <= 1) arr.push(i);
      else if (arr[arr.length - 1] !== "…") arr.push("…");
    }
    return arr;
  })();

  return (
    <div className="flex items-center justify-between gap-3 py-4 px-2 flex-wrap">
      <p className="text-xs text-muted-foreground">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => goto(page - 1)}
          disabled={page === 1}
          className="h-9 w-9 flex items-center justify-center rounded-md border border-border bg-surface-2 text-foreground/80 hover:bg-surface-3 hover:text-primary transition disabled:opacity-40 disabled:hover:bg-surface-2"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {visible.map((p, i) =>
          p === "…" ? (
            <span key={i} className="px-2 text-muted-foreground text-sm">…</span>
          ) : (
            <motion.button
              key={p}
              whileTap={{ scale: 0.92 }}
              onClick={() => goto(p)}
              className={cn(
                "h-9 min-w-9 px-3 rounded-md text-sm font-medium border transition relative",
                p === page
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_18px_-4px_hsl(var(--primary)/0.6)]"
                  : "bg-surface-2 border-border hover:bg-surface-3 text-foreground/80"
              )}
            >
              {p}
            </motion.button>
          )
        )}
        <button
          onClick={() => goto(page + 1)}
          disabled={page === pages}
          className="h-9 w-9 flex items-center justify-center rounded-md border border-border bg-surface-2 text-foreground/80 hover:bg-surface-3 hover:text-primary transition disabled:opacity-40 disabled:hover:bg-surface-2"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
