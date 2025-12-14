"use client";

import { Order } from "@/types/order";

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
            {order.itemName}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            ID: {order.itemId}
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
            <span className="text-zinc-600 dark:text-zinc-400">Stock:</span>
            <span className="font-medium text-black dark:text-zinc-50">
              {order.stockCount}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => onEdit(order)}
            className="flex-1 rounded-md bg-teal-500 px-3 py-2 text-sm font-medium text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(order.id)}
            className="flex-1 rounded-md bg-red-400 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

