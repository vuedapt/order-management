"use client";

import { useState, useEffect } from "react";
import { OrderFormData, Order, OrderItem, MultiOrderFormData } from "@/types/order";
import { orderService } from "@/lib/services/orderService";
import Autocomplete from "./Autocomplete";

interface OrderFormProps {
  order?: Order | null;
  onSubmit: (data: OrderFormData | MultiOrderFormData) => Promise<void>;
  onCancel: () => void;
}

export default function OrderForm({ order, onSubmit, onCancel }: OrderFormProps) {
  const [formData, setFormData] = useState<OrderFormData>({
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
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [itemNames, setItemNames] = useState<string[]>([]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [clientNamesData, itemIdsData, itemNamesData] = await Promise.all([
          orderService.getClientNames(),
          orderService.getItemIds(),
          orderService.getItemNames(),
        ]);
        setClientNames(clientNamesData);
        setItemIds(itemIdsData);
        setItemNames(itemNamesData);
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (order) {
      setFormData({
        itemId: order.itemId,
        itemName: order.itemName,
        clientName: order.clientName,
        stockCount: order.stockCount,
      });
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
        await onSubmit(formData);
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
                <Autocomplete
                  id={`itemId-${index}`}
                  label="Item ID"
                  value={item.itemId}
                  onChange={(value) => updateItem(index, "itemId", value)}
                  options={itemIds}
                  placeholder="Enter item ID"
                  required
                />
              </div>

              <div>
                <Autocomplete
                  id={`itemName-${index}`}
                  label="Item Name"
                  value={item.itemName}
                  onChange={(value) => updateItem(index, "itemName", value)}
                  options={itemNames}
                  placeholder="Enter item name"
                  required
                />
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
        <Autocomplete
          id="itemId"
          label="Item ID"
          value={formData.itemId}
          onChange={(value) => setFormData({ ...formData, itemId: value })}
          options={itemIds}
          placeholder="Enter item ID"
          required
        />
      </div>

      <div>
        <Autocomplete
          id="itemName"
          label="Item Name"
          value={formData.itemName}
          onChange={(value) => setFormData({ ...formData, itemName: value })}
          options={itemNames}
          placeholder="Enter item name"
          required
        />
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

