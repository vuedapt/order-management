"use client";

import { Order } from "@/types/order";

interface OrderTableProps {
  orders: Order[];
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => void;
  currentPage: number;
  pageSize: number;
  total: number;
  onPageSizeChange: (pageSize: number) => void;
}

export default function OrderTable({
  orders,
  onEdit,
  onDelete,
  currentPage,
  pageSize,
  total,
  onPageSizeChange,
}: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          No orders found. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <table className="w-full">
        <thead className="bg-zinc-50 dark:bg-zinc-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Order ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Item ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Item Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Client Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Stock Count
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Date (IST)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Time (IST)
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {orders.map((order) => (
            <tr
              key={order.id}
              className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black dark:text-zinc-50">
                {order.orderId || "N/A"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
                {order.itemId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
                {order.itemName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
                {order.clientName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
                {order.stockCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
                {order.date}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
                {order.time}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(order)}
                    className="cursor-pointer rounded-md bg-teal-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(order.id)}
                    className="cursor-pointer rounded-md bg-red-400 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
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
            <td colSpan={8} className="px-6 py-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-4">
                  <span>
                    Showing <span className="font-medium text-black dark:text-zinc-50">{orders.length}</span> of{" "}
                    <span className="font-medium text-black dark:text-zinc-50">{total}</span>
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span>
                    Page <span className="font-medium text-black dark:text-zinc-50">{currentPage}</span> of{" "}
                    <span className="font-medium text-black dark:text-zinc-50">{Math.ceil(total / pageSize) || 1}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span>Limit:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                      className="cursor-pointer appearance-none rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_0.5rem_center] bg-no-repeat pr-8"
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
  );
}

