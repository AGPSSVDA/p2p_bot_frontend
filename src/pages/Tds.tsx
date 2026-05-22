import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, FileBarChart2, Search, ArrowUpDown, Loader2, Calendar as CalendarIcon, ArrowRight, X } from "lucide-react";
import { tdsService, TdsRecord, TdsPeriod } from "@/services/tds.service";
import { Pagination } from "@/components/Pagination";
import { ConfirmModal } from "@/components/ConfirmModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format, subDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";

type SortKey = "date" | "amount" | "tds_deducted" | "tds_deposited";

export default function Tds() {
  const [records, setRecords] = useState<TdsRecord[]>([]);
  const [summary, setSummary] = useState<{ records: number; payout_volume: number; total_tds: number }>({
    records: 0, payout_volume: 0, total_tds: 0,
  });
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<TdsPeriod>("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params: any = { period };
      if (period === "CUSTOM" && dateRange?.from && dateRange?.to) {
        params.from = format(dateRange.from, "yyyy-MM-dd");
        params.to = format(dateRange.to, "yyyy-MM-dd 23:59:59");
      }
      if (search) params.q = search;
      const data = await tdsService.list(params);
      setRecords(data.records);
      setSummary(data.summary);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load TDS data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, dateRange?.from, dateRange?.to, search]);

  const sorted = useMemo(() => {
    const arr = [...records];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      if (sortKey === "date") return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      return dir * (a[sortKey] - b[sortKey]);
    });
    return arr;
  }, [records, sortKey, sortDir]);

  const [pageSize, setPageSize] = useState(25);
  useEffect(() => { setPage(1); }, [search, period, dateRange, pageSize]);

  const slice = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  const handleExport = () => {
    if (sorted.length === 0) {
      toast.error("No data to export");
      return;
    }
    setShowExportConfirm(true);
  };

  const executeExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("TDS Report");

    worksheet.columns = [
      { header: "SR NO.", key: "sr", width: 8 },
      { header: "DATE", key: "date", width: 12 },
      { header: "NAME", key: "name", width: 30 },
      { header: "PAN", key: "pan", width: 15 },
      { header: "AMOUNT (INR)", key: "amount", width: 18 },
      { header: "1% TDS DEDUCTED", key: "deducted", width: 22 },
      { header: "1% TDS DEPOSITED", key: "deposited", width: 22 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = { bottom: { style: "thin", color: { argb: "FF000000" } } };
    });
    headerRow.height = 30;

    sorted.forEach((r, i) => {
      const row = worksheet.addRow({
        sr: i + 1,
        date: r.date,
        name: r.name || "-",
        pan: (r.pan || "").toUpperCase(),
        amount: r.amount,
        deducted: r.tds_deducted,
        deposited: r.tds_deposited,
      });
      row.eachCell((cell, colNumber) => {
        cell.alignment = { vertical: "middle", horizontal: colNumber === 3 ? "left" : "center" };
        cell.font = { size: 10 };
        if (i % 2 !== 0) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } };
        }
      });
      row.height = 25;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const rangeStr = period === "CUSTOM" && dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, "dd-MMM")}_to_${format(dateRange.to, "dd-MMM")}`
      : period;
    saveAs(new Blob([buffer]), `TDS_Report_${rangeStr}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    setShowExportConfirm(false);
    toast.success(`Exported ${sorted.length} records!`);
  };

  const periodLabel = period === "ALL" ? "All Time"
    : period === "MONTH" ? "Monthly"
    : period === "QUARTER" ? "Quarterly"
    : period === "YEAR" ? "Yearly"
    : "Custom Range";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">TDS Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Track TDS deductions across payouts.</p>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleExport}
            className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition shadow-[0_6px_22px_-8px_hsl(var(--primary)/0.6)]"
          >
            <Download className="h-4 w-4" /> Export Excel
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Records" value={summary.records.toString()} />
        <Stat label="Payout Volume" value={`₹${summary.payout_volume.toLocaleString("en-IN")}`} />
        <Stat label="Total TDS" value={`₹${summary.total_tds.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} accent />
      </div>

      <div className="surface-card rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or PAN…"
            className="w-full h-10 rounded-lg bg-surface-2 border border-border pl-10 pr-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition" />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="flex gap-1 p-1 rounded-lg bg-surface-2 border border-border w-full sm:w-auto">
            {(["ALL", "MONTH", "QUARTER", "YEAR"] as TdsPeriod[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn(
                  "flex-1 sm:flex-none px-3 h-8 rounded-md text-[11px] font-semibold transition whitespace-nowrap",
                  period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}>
                {p === "ALL" ? "All time" : p === "MONTH" ? "Monthly" : p === "QUARTER" ? "Quarterly" : "Yearly"}
              </button>
            ))}
          </div>

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={() => setPeriod("CUSTOM")}
                className={cn(
                  "h-10 px-3 rounded-lg border border-border bg-surface-2 flex items-center justify-center gap-2 text-[11px] font-semibold transition w-full sm:w-auto sm:min-w-[140px]",
                  period === "CUSTOM" ? "border-primary text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {period === "CUSTOM" && dateRange?.from ? (
                  dateRange.to ? (
                    <>{format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}</>
                  ) : (
                    format(dateRange.from, "MMM dd")
                  )
                ) : (
                  "Custom Range"
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-screen sm:w-auto p-0 border-0 sm:border bg-transparent sm:bg-popover shadow-none sm:shadow-md" align="end" sideOffset={8}>
              <div className="surface-card sm:bg-popover rounded-2xl sm:rounded-xl overflow-hidden border border-border sm:border-none max-w-[95vw] mx-auto sm:mx-0">
                <div className="bg-surface-2 p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">From</span>
                      <span className={cn("text-xs font-semibold", !dateRange?.from && "text-muted-foreground/50")}>
                        {dateRange?.from ? format(dateRange.from, "dd MMM yyyy") : "Select Date"}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">To</span>
                      <span className={cn("text-xs font-semibold", !dateRange?.to && "text-muted-foreground/50")}>
                        {dateRange?.to ? format(dateRange.to, "dd MMM yyyy") : "Select Date"}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setIsCalendarOpen(false)} className="sm:hidden p-1 rounded-full hover:bg-surface-3 transition">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-2 sm:p-3 overflow-x-auto no-scrollbar">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => setDateRange(range)}
                    numberOfMonths={typeof window !== "undefined" && window.innerWidth > 640 ? 2 : 1}
                    className="rounded-lg"
                  />
                </div>
                <div className="p-4 bg-surface-2 border-t border-border flex justify-end gap-2">
                  <button onClick={() => { setDateRange(undefined); setPeriod("ALL"); setIsCalendarOpen(false); }}
                    className="px-3 h-8 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition">
                    Reset
                  </button>
                  <button onClick={() => setIsCalendarOpen(false)}
                    disabled={!dateRange?.from || !dateRange?.to}
                    className="px-4 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm disabled:opacity-50">
                    Apply Range
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="surface-card rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[0.5fr_1fr_1.5fr_1.2fr_1.2fr_1.2fr_1.2fr] gap-3 px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border bg-surface-2/50">
          <span>SR NO.</span>
          <SortHeader label="DATE" active={sortKey === "date"} dir={sortDir} onClick={() => toggleSort("date")} />
          <span>NAME</span>
          <span>PAN</span>
          <SortHeader label="AMOUNT" active={sortKey === "amount"} dir={sortDir} onClick={() => toggleSort("amount")} />
          <SortHeader label="1% TDS DEDUCTED" active={sortKey === "tds_deducted"} dir={sortDir} onClick={() => toggleSort("tds_deducted")} />
          <SortHeader label="1% TDS DEPOSITED" active={sortKey === "tds_deposited"} dir={sortDir} onClick={() => toggleSort("tds_deposited")} />
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Fetching records...</p>
          </div>
        ) : slice.length === 0 ? (
          <div className="py-14 flex flex-col items-center text-center">
            <FileBarChart2 className="h-10 w-10 text-muted-foreground/60" />
            <p className="mt-3 font-semibold">No records found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or date range.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              {slice.map((r, i) => (
                <motion.div key={r.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}
                  className="grid grid-cols-[0.5fr_1fr_1.5fr_1.2fr_1.2fr_1.2fr_1.2fr] gap-3 px-5 py-4 border-b border-border hover:bg-surface-2/60 transition items-center"
                >
                  <span className="text-xs text-muted-foreground">{(page - 1) * pageSize + i + 1}</span>
                  <span className="text-xs">{r.date_display || r.date}</span>
                  <span className="text-xs font-semibold">{r.name || "-"}</span>
                  <span className="text-xs font-mono text-muted-foreground uppercase">{r.pan}</span>
                  <span className="text-xs tabular-nums font-medium">₹{r.amount.toLocaleString("en-IN")}</span>
                  <span className="text-xs tabular-nums text-primary font-semibold">₹{r.tds_deducted.toLocaleString("en-IN")}</span>
                  <span className="text-xs tabular-nums text-green-500 font-semibold">₹{r.tds_deposited.toLocaleString("en-IN")}</span>
                </motion.div>
              ))}
            </div>

            <div className="md:hidden divide-y divide-border">
              {slice.map((r, i) => (
                <div key={r.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{r.name || "N/A"}</p>
                    <span className="text-[10px] text-muted-foreground font-medium">SR #{(page - 1) * pageSize + i + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">PAN</p>
                      <p className="text-xs font-mono font-medium">{r.pan}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Date</p>
                      <p className="text-xs font-medium">{r.date_display || r.date}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-3 bg-surface-2 rounded-lg border border-border">
                    <div>
                      <p className="text-[9px] uppercase text-muted-foreground">Amount</p>
                      <p className="text-[11px] font-bold">₹{r.amount.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-muted-foreground text-primary">Deducted</p>
                      <p className="text-[11px] font-bold text-primary">₹{r.tds_deducted.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-muted-foreground text-green-500">Deposited</p>
                      <p className="text-[11px] font-bold text-green-500">₹{r.tds_deposited.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              page={page}
              total={sorted.length}
              pageSize={pageSize}
              onChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </>
        )}
      </div>

      <ConfirmModal
        open={showExportConfirm}
        title="Confirm Excel Export"
        description={`Export ${sorted.length} records (${periodLabel})?`}
        confirmLabel="Export Excel"
        onConfirm={executeExport}
        onCancel={() => setShowExportConfirm(false)}
      />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="surface-card rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("text-base lg:text-xl font-bold mt-1 truncate", accent && "text-primary")}>{value}</p>
    </div>
  );
}

function SortHeader({ label, active, dir, onClick }: { label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-1.5 text-left transition", active ? "text-primary" : "hover:text-foreground")}>
      {label} <ArrowUpDown className={cn("h-3 w-3", active && (dir === "asc" ? "rotate-180" : ""))} />
    </button>
  );
}
