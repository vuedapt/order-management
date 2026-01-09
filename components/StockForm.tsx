"use client";

import { useState, useEffect } from "react";
import { StockFormData, StockItem } from "@/types/stock";

interface StockFormProps {
  stock?: StockItem | null;
  onSubmit: (data: StockFormData) => Promise<void>;
  onCancel: () => void;
}

export default function StockForm({ stock, onSubmit, onCancel }: StockFormProps) {
  const [formData, setFormData] = useState<StockFormData>({
    itemId: "",
    itemName: "",
    stockCount: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stock) {
      setFormData({
        itemId: stock.itemId,
        itemName: stock.itemName,
        stockCount: stock.stockCount,
      });
    }
  }, [stock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      if (!stock) {
        setFormData({
          itemId: "",
          itemName: "",
          stockCount: 0,
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="itemId"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
        >
          Item ID
        </label>
        <input
          id="itemId"
          type="text"
          required
          value={formData.itemId}
          onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="Enter item ID"
          disabled={!!stock}
        />
      </div>

      <div>
        <label
          htmlFor="itemName"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
        >
          Item Name
        </label>
        <input
          id="itemName"
          type="text"
          required
          value={formData.itemName}
          onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="Enter item name"
        />
      </div>

      <div>
        <label
          htmlFor="stockCount"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
        >
          Stock Count
        </label>
        <input
          id="stockCount"
          type="number"
          required
          min="0"
          value={formData.stockCount}
          onChange={(e) =>
            setFormData({ ...formData, stockCount: parseInt(e.target.value) || 0 })
          }
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="Enter stock count"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 cursor-pointer rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? "Saving..." : stock ? "Update Stock" : "Create Stock"}
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

