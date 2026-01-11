"use client";

import { useState, useEffect } from "react";
import { Order, BillingData, BillingItemData } from "@/types/order";

interface BillingFormProps {
  order: Order;
  onSubmit: (data: BillingData) => Promise<void>;
  onCancel: () => void;
}

export default function BillingForm({ order, onSubmit, onCancel }: BillingFormProps) {
  // Initialize form data for all items that have remaining quantity to fulfill
  const initializeFormData = (): BillingItemData[] => {
    return order.items
      .filter((item) => {
        const alreadyBilled = item.billedStockCount || 0;
        const yetToFulfill = Math.max(0, item.stockCount - alreadyBilled);
        return yetToFulfill > 0;
      })
      .map((item) => {
        const alreadyBilled = item.billedStockCount || 0;
        const yetToFulfill = Math.max(0, item.stockCount - alreadyBilled);
        return {
          itemId: item.itemId,
          billedStockCount: 0, // User will enter the quantity
          price: 0, // User will enter the price
        };
      });
  };

  const [formData, setFormData] = useState<BillingItemData[]>(initializeFormData());
  const [loading, setLoading] = useState(false);
  const [availableStocks, setAvailableStocks] = useState<Map<string, number>>(new Map());
  const [loadingStock, setLoadingStock] = useState(true);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoadingStock(true);
        const stockMap = new Map<string, number>();
        
        // Fetch stock for all items in the form
        const promises = formData.map(async (item) => {
          try {
            const response = await fetch(`/api/stock?itemId=${encodeURIComponent(item.itemId)}&pageSize=1`);
            if (response.ok) {
              const data = await response.json();
              const stockItem = data.stocks?.[0];
              if (stockItem) {
                stockMap.set(item.itemId, stockItem.stockCount);
              }
            }
          } catch (error) {
            console.error(`Error fetching stock for ${item.itemId}:`, error);
          }
        });
        
        await Promise.all(promises);
        setAvailableStocks(stockMap);
      } catch (error) {
        console.error("Error fetching stocks:", error);
      } finally {
        setLoadingStock(false);
      }
    };

    if (formData.length > 0) {
      fetchStocks();
    } else {
      setLoadingStock(false);
    }
  }, [formData.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out items with zero quantity
    const itemsToBill = formData.filter(item => item.billedStockCount > 0 && item.price > 0);
    
    if (itemsToBill.length === 0) {
      alert("Please enter at least one item with quantity and price to bill.");
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit({ items: itemsToBill });
      onCancel();
    } catch (error) {
      console.error("Error submitting billing:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateItemData = (index: number, field: keyof BillingItemData, value: number) => {
    const updated = [...formData];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(updated);
  };

  const totalAmount = formData.reduce((sum, item) => sum + (item.billedStockCount * item.price), 0);

  if (formData.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          All items in this order have been fully billed.
        </p>
        <button
          onClick={onCancel}
          className="mt-4 cursor-pointer rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-zinc-50 dark:bg-zinc-800">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Order Details</h3>
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Order ID:</span> {order.orderId}</p>
          <p><span className="font-medium">Client:</span> {order.clientName}</p>
          <p><span className="font-medium">Total Items:</span> {order.items.length}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-black dark:text-zinc-50">
          Select Items to Bill
        </h4>
        {formData.map((itemData, index) => {
          const orderItem = order.items.find((item) => item.itemId === itemData.itemId);
          if (!orderItem) return null;

          const alreadyBilled = orderItem.billedStockCount || 0;
          const yetToFulfill = Math.max(0, orderItem.stockCount - alreadyBilled);
          const availableStock = availableStocks.get(itemData.itemId) ?? null;
          const itemTotal = itemData.billedStockCount * itemData.price;

          return (
            <div
              key={itemData.itemId}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-black dark:text-zinc-50">
                    {orderItem.itemName}
                  </h5>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {orderItem.itemId}
                  </p>
                </div>
                <div className="text-right text-xs text-zinc-600 dark:text-zinc-400">
                  <p>Ordered: {orderItem.stockCount}</p>
                  {alreadyBilled > 0 && <p>Billed: {alreadyBilled}</p>}
                  <p className="font-medium text-orange-600 dark:text-orange-400">
                    Yet to Fulfill: {yetToFulfill}
                  </p>
                  {loadingStock ? (
                    <p>Loading stock...</p>
                  ) : availableStock !== null ? (
                    <p className={availableStock < itemData.billedStockCount ? "text-red-600 dark:text-red-400 font-semibold" : "text-green-600 dark:text-green-400"}>
                      Available: {availableStock}
                    </p>
                  ) : (
                    <p className="text-zinc-500 dark:text-zinc-400">Stock: N/A</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor={`quantity-${index}`}
                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                  >
                    Quantity to Bill
                  </label>
                  <input
                    id={`quantity-${index}`}
                    type="number"
                    min="0"
                    max={yetToFulfill}
                    value={itemData.billedStockCount}
                    onChange={(e) => {
                      const value = Math.min(parseInt(e.target.value) || 0, yetToFulfill);
                      updateItemData(index, "billedStockCount", value);
                    }}
                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`price-${index}`}
                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                  >
                    Price per Unit
                  </label>
                  <input
                    id={`price-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemData.price}
                    onChange={(e) =>
                      updateItemData(index, "price", parseFloat(e.target.value) || 0)
                    }
                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {itemData.billedStockCount > 0 && itemData.price > 0 && (
                <div className="rounded-md border border-teal-200 dark:border-teal-700 p-2 bg-teal-50 dark:bg-teal-900/20">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Item Total: <span className="font-semibold text-teal-600 dark:text-teal-400">LKR {itemTotal.toFixed(2)}</span>
                  </p>
                </div>
              )}

              {availableStock !== null && itemData.billedStockCount > availableStock && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  ⚠ Insufficient stock available
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-teal-200 dark:border-teal-700 p-4 bg-teal-50 dark:bg-teal-900/20">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Total Amount:</span>
          <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
            LKR {totalAmount.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          {formData.filter(item => item.billedStockCount > 0).length} item(s) selected
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={loading || formData.every(item => item.billedStockCount <= 0 || item.price <= 0) || formData.some(item => {
            const availableStock = availableStocks.get(item.itemId);
            return availableStock !== null && availableStock !== undefined && item.billedStockCount > availableStock;
          })}
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

