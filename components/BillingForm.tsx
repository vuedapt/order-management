"use client";

import { useState, useEffect } from "react";
import { Order, BillingData } from "@/types/order";

interface BillingFormProps {
  order: Order;
  itemId: string; // Which item in the order to bill
  onSubmit: (data: BillingData) => Promise<void>;
  onCancel: () => void;
}

export default function BillingForm({ order, itemId, onSubmit, onCancel }: BillingFormProps) {
  // Find the item in the order
  const orderItem = order.items.find((item) => item.itemId === itemId);
  
  if (!orderItem) {
    return (
      <div className="p-4 text-red-600 dark:text-red-400">
        Item {itemId} not found in order
      </div>
    );
  }

  // Calculate how much stock is yet to be fulfilled
  const alreadyBilled = orderItem.billedStockCount || 0;
  const yetToFulfill = Math.max(0, orderItem.stockCount - alreadyBilled);

  const [formData, setFormData] = useState<BillingData>({
    itemId: itemId,
    billedStockCount: yetToFulfill > 0 ? yetToFulfill : 0, // Default to remaining amount to fulfill
    price: 0, // Price is entered fresh for each billing transaction
  });
  const [loading, setLoading] = useState(false);
  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [loadingStock, setLoadingStock] = useState(true);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        setLoadingStock(true);
        const response = await fetch(`/api/stock?itemId=${encodeURIComponent(itemId)}&pageSize=1`);
        if (response.ok) {
          const data = await response.json();
          const stockItem = data.stocks?.[0];
          setAvailableStock(stockItem?.stockCount ?? null);
        } else {
          setAvailableStock(null);
        }
      } catch (error) {
        console.error("Error fetching stock:", error);
        setAvailableStock(null);
      } finally {
        setLoadingStock(false);
      }
    };

    fetchStock();
  }, [itemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onCancel();
    } catch (error) {
      console.error("Error submitting billing:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = formData.billedStockCount * formData.price;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-zinc-50 dark:bg-zinc-800">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Order Details</h3>
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Order ID:</span> {order.orderId}</p>
          <p><span className="font-medium">Item:</span> {orderItem.itemId} - {orderItem.itemName}</p>
          <p><span className="font-medium">Client:</span> {order.clientName}</p>
          <p><span className="font-medium">Ordered Quantity:</span> {orderItem.stockCount}</p>
          {alreadyBilled > 0 && (
            <p><span className="font-medium">Already Billed:</span> {alreadyBilled}</p>
          )}
          <p>
            <span className="font-medium">Yet to Fulfill:</span>{" "}
            <span className="font-semibold text-orange-600 dark:text-orange-400">{yetToFulfill}</span>
          </p>
          {loadingStock ? (
            <p><span className="font-medium">Available Stock:</span> Loading...</p>
          ) : availableStock !== null ? (
            <p>
              <span className="font-medium">Available Stock:</span>{" "}
              <span className={availableStock < formData.billedStockCount ? "text-red-600 dark:text-red-400 font-semibold" : "text-green-600 dark:text-green-400 font-semibold"}>
                {availableStock}
              </span>
            </p>
          ) : (
            <p><span className="font-medium">Available Stock:</span> <span className="text-zinc-500 dark:text-zinc-400">Not found</span></p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="billedStockCount"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
        >
          Quantity to Bill
        </label>
        <input
          id="billedStockCount"
          type="number"
          required
          min="0"
          value={formData.billedStockCount}
          onChange={(e) =>
            setFormData({ ...formData, billedStockCount: parseFloat(e.target.value) || 0 })
          }
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="Enter quantity to bill"
        />
        <div className="mt-1 space-y-1">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Ordered: {orderItem.stockCount}
            {alreadyBilled > 0 && ` | Already Billed: ${alreadyBilled}`}
          </p>
          <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
            Yet to Fulfill: {yetToFulfill}
          </p>
          {availableStock !== null && (
            <p className={`text-xs font-medium ${
              availableStock < formData.billedStockCount
                ? "text-red-600 dark:text-red-400"
                : "text-green-600 dark:text-green-400"
            }`}>
              Available: {availableStock}
              {availableStock < formData.billedStockCount && (
                <span className="ml-1">⚠ Insufficient stock</span>
              )}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
        >
          Price per Unit
        </label>
        <input
          id="price"
          type="number"
          required
          min="0"
          step="0.01"
          value={formData.price}
          onChange={(e) =>
            setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
          }
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="Enter price per unit"
        />
      </div>

      <div className="rounded-lg border border-teal-200 dark:border-teal-700 p-4 bg-teal-50 dark:bg-teal-900/20">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Total Amount:</span>
          <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
            LKR {totalAmount.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          {formData.billedStockCount} × LKR {formData.price.toFixed(2)}
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={loading || (availableStock !== null && formData.billedStockCount > availableStock) || formData.billedStockCount <= 0}
          className="flex-1 cursor-pointer rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? "Processing..." : "Bill Order"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 cursor-pointer rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

