"use client";

import { useState } from "react";
import { Order, OrderStatus } from "@/types/order";
import { FaChevronDown, FaChevronUp, FaEdit, FaTrash } from "react-icons/fa";
import { FaCheck } from "react-icons/fa6";

interface OrderCardsProps {
  orders: Order[];
  onEdit?: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  onBill?: (order: Order) => void;
  showEditDelete?: boolean;
  currentPage: number;
  pageSize: number;
  total: number;
  onPageSizeChange: (pageSize: number) => void;
}

export default function OrderCards({
  orders,
  onEdit,
  onDelete,
  onBill,
  showEditDelete = true,
  currentPage,
  pageSize,
  total,
  onPageSizeChange,
}: OrderCardsProps) {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleExpand = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700";
      case "partially_completed":
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700";
      case "uncompleted":
        return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700";
      default:
        return "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700";
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "partially_completed":
        return "Partially Completed";
      case "uncompleted":
        return "Uncompleted";
      default:
        return status;
    }
  };

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
    <div className="space-y-4">
      {/* Cards */}
      {orders.map((order) => {
        const isExpanded = expandedOrders.has(order.id);
        const items = order.items || [];
        const totalItems = items.length;
        const totalStockCount = items.reduce((sum, item) => sum + (item.stockCount || 0), 0);
        const totalBilledCount = items.reduce((sum, item) => sum + (item.billedStockCount || 0), 0);
        const yetToFulfill = totalStockCount - totalBilledCount;

        return (
          <div
            key={order.id}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden transition-all duration-200"
          >
            {/* Card Header */}
            <div
              className="p-4 sm:p-6 cursor-pointer"
              onClick={() => toggleExpand(order.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
                      {order.orderId}
                    </h3>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(order.status)}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-zinc-600 dark:text-zinc-400">Client: </span>
                      <span className="font-medium text-black dark:text-zinc-50">
                        {order.clientName}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-600 dark:text-zinc-400">Items: </span>
                      <span className="font-medium text-black dark:text-zinc-50">
                        {totalItems}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-600 dark:text-zinc-400">Total Qty: </span>
                      <span className="font-medium text-black dark:text-zinc-50">
                        {totalStockCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-600 dark:text-zinc-400">Date: </span>
                      <span className="font-medium text-black dark:text-zinc-50">
                        {order.date} {order.time}
                      </span>
                    </div>
                  </div>
                  {yetToFulfill > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                        Yet to Fulfill: {yetToFulfill}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {showEditDelete && onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(order);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      <FaEdit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                  {showEditDelete && onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(order.id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
                  <button
                    className="p-2 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? (
                      <FaChevronUp className="w-4 h-4" />
                    ) : (
                      <FaChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-4 sm:p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-black dark:text-zinc-50 mb-3">
                      Order Items ({totalItems})
                    </h4>
                    <div className="space-y-3">
                      {items.map((item, index) => {
                        const itemYetToFulfill = item.stockCount - (item.billedStockCount || 0);
                        return (
                          <div
                            key={`${item.itemId}-${index}`}
                            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-black dark:text-zinc-50">
                                    {item.itemName}
                                  </span>
                                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    ({item.itemId})
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <span className="text-zinc-600 dark:text-zinc-400">Requested: </span>
                                    <span className="font-medium text-black dark:text-zinc-50">
                                      {item.stockCount}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-600 dark:text-zinc-400">Billed: </span>
                                    <span className="font-medium text-green-600 dark:text-green-400">
                                      {item.billedStockCount || 0}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-600 dark:text-zinc-400">Yet to Fulfill: </span>
                                    <span
                                      className={`font-medium ${
                                        itemYetToFulfill > 0
                                          ? "text-orange-600 dark:text-orange-400"
                                          : "text-green-600 dark:text-green-400"
                                      }`}
                                    >
                                      {itemYetToFulfill}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-600 dark:text-zinc-400">Progress: </span>
                                    <span className="font-medium text-black dark:text-zinc-50">
                                      {item.stockCount > 0
                                        ? Math.round(((item.billedStockCount || 0) / item.stockCount) * 100)
                                        : 0}
                                      %
                                    </span>
                                  </div>
                                </div>
                                {/* Progress Bar */}
                                <div className="mt-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                                  <div
                                    className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${
                                        item.stockCount > 0
                                          ? Math.min(
                                              ((item.billedStockCount || 0) / item.stockCount) * 100,
                                              100
                                            )
                                          : 0
                                      }%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Bill button for the entire order */}
                  {onBill && yetToFulfill > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onBill(order);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors"
                        title="Bill this order"
                      >
                        <FaCheck className="w-4 h-4" />
                        Bill Order
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Footer with page size selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {orders.length} of {total} orders
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">
            Items per page:
          </label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="appearance-none rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </div>
  );
}

