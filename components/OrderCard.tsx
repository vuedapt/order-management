"use client";

import { Order } from "@/types/order";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

interface OrderCardProps {
  order: Order;
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => void;
}

export default function OrderCard({ order, onEdit, onDelete }: OrderCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
            {order.items.length > 0 ? order.items[0].itemName : "No items"}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Items: {order.items.length}
          </p>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Client:</span>
            <span className="font-medium text-black dark:text-zinc-50">
              {order.clientName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Total Stock:</span>
            <span className="font-medium text-black dark:text-zinc-50">
              {order.items.reduce((sum, item) => sum + item.stockCount, 0)}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => onEdit(order)}
            className="flex-1 flex items-center justify-center gap-2 rounded-md bg-teal-50 dark:bg-teal-900/20 px-3 py-2 text-xs font-medium text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-all duration-200"
          >
            <FiEdit2 size={14} />
            Edit
          </button>
          <button
            onClick={() => onDelete(order.id)}
            className="flex-1 flex items-center justify-center gap-2 rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200"
          >
            <FiTrash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

