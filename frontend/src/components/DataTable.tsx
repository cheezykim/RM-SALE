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
};

export function DataTable<T>({ data, columns, search = "", pageSize = 30, onRowClick, getRowClassName }: DataTableProps<T>) {
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
    <div className="crm-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[1040px] w-full border-collapse text-sm">
          <thead className="bg-slate-50/80 backdrop-blur dark:bg-slate-950/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="border-b border-border px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-slate-400">
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
                  className={`border-b border-slate-100/80 bg-white/60 transition hover:bg-bank-mist/80 dark:border-white/5 dark:bg-transparent dark:hover:bg-white/5 ${onRowClick ? "cursor-pointer" : ""} ${getRowClassName?.(row.original) ?? ""}`}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-5 py-4 align-top text-slate-800 dark:text-slate-200">
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
