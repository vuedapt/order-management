"use client";

import { useState, useEffect } from "react";
import { OrderFormData, Order, OrderItem, MultiOrderFormData, SingleOrderFormData } from "@/types/order";
import { StockItem } from "@/types/stock";
import Autocomplete from "./Autocomplete";

interface OrderFormProps {
  order?: Order | null;
  onSubmit: (data: OrderFormData | MultiOrderFormData) => Promise<void>;
  onCancel: () => void;
}

export default function OrderForm({ order, onSubmit, onCancel }: OrderFormProps) {
  const [formData, setFormData] = useState<SingleOrderFormData>({
    itemId: "",
    itemName: "",
    clientName: "",
    stockCount: 0,
  });
  const [multiFormData, setMultiFormData] = useState<MultiOrderFormData>({
    clientName: "",
    items: [{ itemId: "", itemName: "", stockCount: 0 }],
  });
  const [isMultiMode, setIsMultiMode] = useState(!order);
  const [loading, setLoading] = useState(false);
  const [clientNames, setClientNames] = useState<string[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load client names from orders
        const ordersResponse = await fetch("/api/orders?page=1&pageSize=1000");
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          const clientNamesSet = new Set<string>();
          ordersData.orders?.forEach((order: any) => {
            if (order.clientName) clientNamesSet.add(order.clientName);
          });
          setClientNames(Array.from(clientNamesSet).sort());
        }

        // Load stock items
        const stockResponse = await fetch("/api/stock?page=1&pageSize=1000");
        if (stockResponse.ok) {
          const stockData = await stockResponse.json();
          setStockItems(stockData.stocks || []);
        }
      } catch (error) {
        console.error("Error loading form data:", error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (order) {
      // Handle new Order structure with items array
      const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
      if (firstItem) {
        setFormData({
          itemId: firstItem.itemId,
          itemName: firstItem.itemName,
          clientName: order.clientName,
          stockCount: firstItem.stockCount,
        });
      } else {
        // Fallback for legacy orders (shouldn't happen with new structure)
        setFormData({
          itemId: "",
          itemName: "",
          clientName: order.clientName,
          stockCount: 0,
        });
      }
      setIsMultiMode(false);
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isMultiMode && !order) {
        await onSubmit(multiFormData);
        setMultiFormData({
          clientName: "",
          items: [{ itemId: "", itemName: "", stockCount: 0 }],
        });
      } else {
        // Convert single form data to OrderFormData format
        const orderFormData: OrderFormData = {
          clientName: formData.clientName,
          items: [{
            itemId: formData.itemId,
            itemName: formData.itemName,
            stockCount: formData.stockCount,
            billedStockCount: 0,
          }],
        };
        await onSubmit(orderFormData);
        if (!order) {
          setFormData({
            itemId: "",
            itemName: "",
            clientName: "",
            stockCount: 0,
          });
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setMultiFormData({
      ...multiFormData,
      items: [...multiFormData.items, { itemId: "", itemName: "", stockCount: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (multiFormData.items.length > 1) {
      setMultiFormData({
        ...multiFormData,
        items: multiFormData.items.filter((_, i) => i !== index),
      });
    }
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const updatedItems = [...multiFormData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setMultiFormData({ ...multiFormData, items: updatedItems });
  };

  if (isMultiMode && !order) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Autocomplete
            id="clientName"
            label="Client Name"
            value={multiFormData.clientName}
            onChange={(value) => setMultiFormData({ ...multiFormData, clientName: value })}
            options={clientNames}
            placeholder="Enter client name"
            required
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Items
            </label>
            <button
              type="button"
              onClick={addItem}
              className="cursor-pointer rounded-md bg-teal-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
            >
              + Add Item
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
            {multiFormData.items.map((item, index) => (
            <div key={index} className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Item {index + 1}
                </span>
                {multiFormData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="cursor-pointer rounded-md bg-red-400 px-2 py-1 text-xs font-medium text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div>
                <label
                  htmlFor={`item-${index}`}
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Item
                </label>
                <select
                  id={`item-${index}`}
                  value={item.itemId || ""}
                  onChange={(e) => {
                    const selectedStock = stockItems.find(s => s.itemId === e.target.value);
                    if (selectedStock) {
                      const updatedItems = [...multiFormData.items];
                      updatedItems[index] = {
                        itemId: selectedStock.itemId,
                        itemName: selectedStock.itemName,
                        stockCount: updatedItems[index].stockCount,
                      };
                      setMultiFormData({ ...multiFormData, items: updatedItems });
                    } else {
                      const updatedItems = [...multiFormData.items];
                      updatedItems[index] = {
                        itemId: "",
                        itemName: "",
                        stockCount: updatedItems[index].stockCount,
                      };
                      setMultiFormData({ ...multiFormData, items: updatedItems });
                    }
                  }}
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_0.5rem_center] bg-no-repeat pr-10 cursor-pointer transition-all duration-200"
                  required
                >
                  <option value="">Select an item</option>
                  {stockItems.map((stock) => (
                    <option key={stock.id} value={stock.itemId}>
                      {stock.itemId} - {stock.itemName} (Available: {stock.stockCount})
                    </option>
                  ))}
                </select>
                {item.itemId && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Available stock: {stockItems.find(s => s.itemId === item.itemId)?.stockCount || 0}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`stockCount-${index}`}
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Stock Count
                </label>
                <input
                  id={`stockCount-${index}`}
                  type="number"
                  required
                  min="0"
                  value={item.stockCount}
                  onChange={(e) =>
                    updateItem(index, "stockCount", parseInt(e.target.value) || 0)
                  }
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Enter stock count"
                />
              </div>
            </div>
          ))}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 cursor-pointer rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? "Saving..." : `Create ${multiFormData.items.length} Order${multiFormData.items.length > 1 ? "s" : ""}`}
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="item"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
        >
          Item
        </label>
        <select
          id="item"
          value={formData.itemId || ""}
          onChange={(e) => {
            const selectedStock = stockItems.find(s => s.itemId === e.target.value);
            if (selectedStock) {
              setFormData({
                ...formData,
                itemId: selectedStock.itemId,
                itemName: selectedStock.itemName,
              });
            } else {
              setFormData({
                ...formData,
                itemId: "",
                itemName: "",
              });
            }
          }}
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_0.5rem_center] bg-no-repeat pr-10 cursor-pointer transition-all duration-200"
          required
        >
          <option value="">Select an item</option>
          {stockItems.map((stock) => (
            <option key={stock.id} value={stock.itemId}>
              {stock.itemId} - {stock.itemName} (Available: {stock.stockCount})
            </option>
          ))}
        </select>
        {formData.itemId && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Available stock: {stockItems.find(s => s.itemId === formData.itemId)?.stockCount || 0}
          </p>
        )}
      </div>

      <div>
        <Autocomplete
          id="clientName"
          label="Client Name"
          value={formData.clientName}
          onChange={(value) => setFormData({ ...formData, clientName: value })}
          options={clientNames}
          placeholder="Enter client name"
          required
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
          {loading ? "Saving..." : order ? "Update Order" : "Create Order"}
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

