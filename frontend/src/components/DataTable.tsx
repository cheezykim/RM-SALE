import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/Button";

type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  search?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T) => string;
  tone?: "default" | "emerald" | "blue";
  headerTone?: "default" | "emerald" | "blue";
};

export function DataTable<T>({ data, columns, search = "", pageSize = 30, onRowClick, getRowClassName, tone = "default", headerTone = tone }: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    state: { globalFilter: search },
    initialState: { pagination: { pageSize } },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className={`crm-card overflow-hidden ${tone === "emerald" ? "ring-2 ring-emerald-200/90 dark:ring-emerald-400/30" : tone === "blue" ? "ring-2 ring-blue-200/90 dark:ring-blue-400/30" : ""}`}>
      <div className="responsive-table-scroll" role="region" aria-label="Scrollable data table" tabIndex={0}>
        <table className="w-full min-w-[760px] border-collapse text-sm lg:min-w-[1040px]">
          <thead className={`${headerToneClass(headerTone)} backdrop-blur`}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className={`border-b px-3 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider sm:px-5 sm:py-4 ${headerCellToneClass(headerTone)}`}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={`border-b transition ${rowToneClass(tone, index)} ${onRowClick ? "cursor-pointer" : ""} ${getRowClassName?.(row.original) ?? ""}`}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="border-r border-slate-200/80 px-3 py-3 align-top text-slate-800 last:border-r-0 dark:border-white/10 dark:text-slate-200 sm:px-5 sm:py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-border bg-white/50 px-4 py-3 text-xs font-semibold text-muted dark:border-white/10 dark:bg-slate-950/30 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <div className="order-2 sm:order-1">
          {table.getFilteredRowModel().rows.length
            ? `${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-${Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )} of ${table.getFilteredRowModel().rows.length}`
            : "0 of 0"}
        </div>
        <div className="order-1 flex items-center gap-2 sm:order-2">
          <Button variant="ghost" className="h-8 px-2" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
          </span>
          <Button variant="ghost" className="h-8 px-2" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function headerToneClass(tone: "default" | "emerald" | "blue") {
  if (tone === "emerald") return "bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 shadow-sm dark:from-emerald-900 dark:via-emerald-800 dark:to-teal-900";
  if (tone === "blue") return "bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 shadow-sm dark:from-blue-950 dark:via-blue-900 dark:to-indigo-950";
  return "bg-slate-50/80 dark:bg-slate-950/60";
}

function headerCellToneClass(tone: "default" | "emerald" | "blue") {
  if (tone === "emerald") return "border-emerald-600/80 text-white dark:border-emerald-500/40 dark:text-white";
  if (tone === "blue") return "border-blue-600/80 text-white dark:border-blue-500/40 dark:text-white";
  return "border-border text-slate-950 dark:border-white/10 dark:text-slate-100";
}

function rowToneClass(tone: "default" | "emerald" | "blue", index: number) {
  if (tone === "emerald") return `${index % 2 ? "bg-emerald-50/90" : "bg-white"} border-emerald-200/80 hover:bg-emerald-100 hover:shadow-[inset_4px_0_0_#059669] dark:border-emerald-400/20 dark:bg-transparent dark:hover:bg-emerald-500/15`;
  if (tone === "blue") return `${index % 2 ? "bg-blue-50/90" : "bg-white"} border-blue-200/80 hover:bg-blue-100 hover:shadow-[inset_4px_0_0_#2563eb] dark:border-blue-400/20 dark:bg-transparent dark:hover:bg-blue-500/15`;
  return "border-slate-100/80 bg-white/60 hover:bg-bank-mist/80 dark:border-white/5 dark:bg-transparent dark:hover:bg-white/5";
}
