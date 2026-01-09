"use client";

import { StockItem } from "@/types/stock";

interface StockTableProps {
  stocks: StockItem[];
  onEdit: (stock: StockItem) => void;
  onDelete: (id: string) => void;
  currentPage: number;
  pageSize: number;
  total: number;
  onPageSizeChange: (pageSize: number) => void;
}

export default function StockTable({ 
  stocks, 
  onEdit, 
  onDelete,
  currentPage,
  pageSize,
  total,
  onPageSizeChange,
}: StockTableProps) {
  if (stocks.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          No stock items found.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="min-w-full inline-block align-middle">
        <table className="w-full min-w-[600px]">
        <thead className="bg-zinc-50 dark:bg-zinc-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Item ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Item Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Stock Count
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {stocks.map((stock) => (
            <tr
              key={stock.id}
              className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
            >
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
                {stock.itemId}
              </td>
              <td className="px-4 sm:px-6 py-4 text-sm text-black dark:text-zinc-50">
                <div className="max-w-[200px] truncate" title={stock.itemName}>
                  {stock.itemName}
                </div>
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-black dark:text-zinc-50">
                {stock.stockCount}
              </td>
              <td className="px-4 sm:px-6 py-4 text-right text-sm font-medium">
                <div className="flex justify-end gap-2 flex-wrap">
                  <button
                    onClick={() => onEdit(stock)}
                    className="cursor-pointer rounded-md bg-teal-500 px-2 sm:px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 whitespace-nowrap"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(stock.id)}
                    className="cursor-pointer rounded-md bg-red-400 px-2 sm:px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 whitespace-nowrap"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
          <tr>
            <td colSpan={4} className="px-4 sm:px-6 py-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-2 sm:gap-4">
                  <span>
                    Showing <span className="font-medium text-black dark:text-zinc-50">{stocks.length}</span> of{" "}
                    <span className="font-medium text-black dark:text-zinc-50">{total}</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <span>
                    Page <span className="font-medium text-black dark:text-zinc-50">{currentPage}</span> of{" "}
                    <span className="font-medium text-black dark:text-zinc-50">{Math.ceil(total / pageSize) || 1}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline">Limit:</span>
                    <span className="sm:hidden">Limit</span>
                    <select
                      value={pageSize}
                      onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                      className="cursor-pointer appearance-none rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 sm:px-3 py-1.5 text-sm text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 relative z-10"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
      </div>
    </div>
  );
}

