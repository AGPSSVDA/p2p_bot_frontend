import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;

  // Optional: enables a "Rows per page" selector. Pass the handler and the
  // list of options to expose. Omit to keep the pageSize fixed.
  onPageSizeChange?: (n: number) => void;
  pageSizeOptions?: number[];

  // Optional: enables a "Jump to page" input. Defaults to true when total
  // pages > 10 (handy for large lists like 20k+ orders).
  showJump?: boolean;
}

export function Pagination({
  page,
  total,
  pageSize,
  onChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200],
  showJump,
}: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const clamped = Math.min(Math.max(1, page), pages);
  const goto = (p: number) => onChange(Math.min(Math.max(1, p), pages));

  // ── Visible page tokens ──
  //   • Always show 1 and last
  //   • Show ±1 around current page
  //   • Insert "…" only when a GAP of >=2 hidden pages exists. Two
  //     consecutive numbers should never be separated by an ellipsis
  //     (fixes the old "1, 2, …, 4" silliness).
  const visible: (number | "…")[] = (() => {
    if (pages <= 1) return [1];
    const wanted = new Set<number>();
    wanted.add(1);
    wanted.add(pages);
    for (let d = -1; d <= 1; d++) {
      const p = clamped + d;
      if (p >= 1 && p <= pages) wanted.add(p);
    }
    const sorted = [...wanted].sort((a, b) => a - b);
    const out: (number | "…")[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      const prev = sorted[i - 1];
      if (prev !== undefined && p - prev > 1) {
        // Only insert "…" if at least 2 numbers are skipped
        if (p - prev === 2) out.push(prev + 1);
        else out.push("…");
      }
      out.push(p);
    }
    return out;
  })();

  // ── Jump-to-page input (auto-enabled for many pages) ──
  const jumpEnabled = showJump ?? pages > 10;
  const [jumpVal, setJumpVal] = useState<string>("");
  useEffect(() => { setJumpVal(""); }, [clamped]);
  const onJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(jumpVal, 10);
    if (!Number.isFinite(n)) return;
    goto(n);
  };

  const startRow = total === 0 ? 0 : (clamped - 1) * pageSize + 1;
  const endRow = Math.min(clamped * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-3 py-4 px-2 flex-wrap">
      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
        <span>
          {total === 0
            ? "No results"
            : <>Showing <span className="font-semibold text-foreground tabular-nums">{startRow.toLocaleString("en-IN")}</span>–<span className="font-semibold text-foreground tabular-nums">{endRow.toLocaleString("en-IN")}</span> of <span className="font-semibold text-foreground tabular-nums">{total.toLocaleString("en-IN")}</span></>
          }
        </span>
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
              className="h-7 rounded-md border border-border bg-surface-2 px-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {/* First page */}
        <NavBtn
          onClick={() => goto(1)}
          disabled={clamped === 1}
          aria="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </NavBtn>
        {/* Previous */}
        <NavBtn
          onClick={() => goto(clamped - 1)}
          disabled={clamped === 1}
          aria="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </NavBtn>

        {visible.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-2 text-muted-foreground text-sm select-none">…</span>
          ) : (
            <motion.button
              key={p}
              whileTap={{ scale: 0.92 }}
              onClick={() => goto(p)}
              className={cn(
                "h-9 min-w-9 px-3 rounded-md text-sm font-medium border transition tabular-nums",
                p === clamped
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_18px_-4px_hsl(var(--primary)/0.6)]"
                  : "bg-surface-2 border-border hover:bg-surface-3 text-foreground/80"
              )}
            >
              {p.toLocaleString("en-IN")}
            </motion.button>
          )
        )}

        {/* Next */}
        <NavBtn
          onClick={() => goto(clamped + 1)}
          disabled={clamped >= pages}
          aria="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </NavBtn>
        {/* Last page */}
        <NavBtn
          onClick={() => goto(pages)}
          disabled={clamped >= pages}
          aria="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </NavBtn>

        {jumpEnabled && (
          <form onSubmit={onJumpSubmit} className="flex items-center gap-1 ml-1">
            <input
              type="number"
              min={1}
              max={pages}
              value={jumpVal}
              onChange={(e) => setJumpVal(e.target.value)}
              placeholder={`/${pages.toLocaleString("en-IN")}`}
              className="h-9 w-20 rounded-md border border-border bg-surface-2 px-2 text-xs text-foreground tabular-nums focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              aria-label="Jump to page"
            />
            <button
              type="submit"
              disabled={!jumpVal}
              className="h-9 px-2 rounded-md border border-border bg-surface-2 text-foreground/80 text-xs font-semibold hover:bg-surface-3 transition disabled:opacity-40"
            >
              Go
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function NavBtn({
  onClick, disabled, aria, children,
}: {
  onClick: () => void;
  disabled: boolean;
  aria: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={aria}
      title={aria}
      className="h-9 w-9 flex items-center justify-center rounded-md border border-border bg-surface-2 text-foreground/80 hover:bg-surface-3 hover:text-primary transition disabled:opacity-40 disabled:hover:bg-surface-2"
    >
      {children}
    </button>
  );
}
