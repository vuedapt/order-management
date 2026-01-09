"use client";

import { Order } from "@/types/order";
import { FiEdit2, FiTrash2, FiChevronDown } from "react-icons/fi";

interface OrderTableProps {
  orders: Order[];
  onEdit?: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  onBill?: (order: Order, itemId: string) => void;
  showEditDelete?: boolean; // Control whether to show Edit/Delete buttons
  currentPage: number;
  pageSize: number;
  total: number;
  onPageSizeChange: (pageSize: number) => void;
}

export default function OrderTable({
  orders,
  onEdit,
  onDelete,
  onBill,
  showEditDelete = true,
  currentPage,
  pageSize,
  total,
  onPageSizeChange,
}: OrderTableProps) {
  // Calculate colspan for the footer based on visible columns
  // Base columns: Order ID, Item ID, Item Name, Client Name, Requested Stock, Yet to Fulfill, Date, Time, Status = 9
  // Optional: Actions (+1)
  const visibleColumns = 9 + ((showEditDelete || onBill) ? 1 : 0);

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
      <div className="min-w-full inline-block align-middle">
        <table className="w-full min-w-[800px]">
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
              Requested Stock
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Yet to Fulfill
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Date (IST)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Time (IST)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Status
            </th>
            {(showEditDelete || onBill) && (
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {orders.map((order) => {
            const isFirstItem = true;
            return order.items.map((item, itemIndex) => {
              const yetToFulfill = Math.max(0, item.stockCount - item.billedStockCount);
              const itemStatus = item.billedStockCount >= item.stockCount
                ? "completed"
                : item.billedStockCount > 0
                ? "partially_completed"
                : "uncompleted";
              
              return (
                <tr
                  key={`${order.id}-${itemIndex}`}
                  className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                    itemIndex === 0 ? "border-t-2 border-zinc-300 dark:border-zinc-600" : ""
                  }`}
                >
                  {itemIndex === 0 && (
                    <>
                      <td 
                        rowSpan={order.items.length}
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black dark:text-zinc-50 align-top"
                      >
                        {order.orderId || "N/A"}
                      </td>
                      <td 
                        rowSpan={order.items.length}
                        className="px-6 py-4 text-sm text-black dark:text-zinc-50 align-top"
                      >
                        <div className="max-w-[150px] truncate" title={order.clientName}>
                          {order.clientName}
                        </div>
                      </td>
                      <td 
                        rowSpan={order.items.length}
                        className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50 align-top"
                      >
                        {order.date}
                      </td>
                      <td 
                        rowSpan={order.items.length}
                        className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50 align-top"
                      >
                        {order.time}
                      </td>
                      <td 
                        rowSpan={order.items.length}
                        className="px-6 py-4 whitespace-nowrap text-sm align-top"
                      >
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium text-white ${
                          order.status === "completed"
                            ? "bg-green-600 dark:bg-green-700"
                            : order.status === "partially_completed"
                            ? "bg-orange-600 dark:bg-orange-700"
                            : "bg-red-600 dark:bg-red-700"
                        }`}>
                          {order.status === "completed"
                            ? "Completed"
                            : order.status === "partially_completed"
                            ? "Partially Completed"
                            : "Uncompleted"}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
                    {item.itemId}
                  </td>
                  <td className="px-6 py-4 text-sm text-black dark:text-zinc-50">
                    <div className="max-w-[200px] truncate" title={item.itemName}>
                      {item.itemName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
                    {item.stockCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
                    {yetToFulfill}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2 flex-wrap">
                      {onBill && itemStatus !== "completed" && (
                        <button
                          onClick={() => onBill(order, item.itemId)}
                          className="cursor-pointer rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 whitespace-nowrap"
                        >
                          Bill
                        </button>
                      )}
                      {itemIndex === 0 && showEditDelete && onEdit && (
                        <button
                          onClick={() => onEdit(order)}
                          className="cursor-pointer p-1.5 rounded-full text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/30 transition-all duration-200"
                          title="Edit Order"
                        >
                          <FiEdit2 size={16} />
                        </button>
                      )}
                      {itemIndex === 0 && showEditDelete && onDelete && (
                        <button
                          onClick={() => onDelete(order.id)}
                          className="cursor-pointer p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-all duration-200"
                          title="Delete Order"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            });
          })}
        </tbody>
        <tfoot className="bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
          <tr>
            <td colSpan={visibleColumns} className="px-4 sm:px-6 py-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-2 sm:gap-4">
                  <span>
                    Showing <span className="font-medium text-black dark:text-zinc-50">{orders.length}</span> of{" "}
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
                    <div className="relative">
                      <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                        className="cursor-pointer appearance-none rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 py-1.5 text-sm text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 relative z-10"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={20}>20</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500 dark:text-zinc-400 z-20">
                        <FiChevronDown size={14} />
                      </div>
                    </div>
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

