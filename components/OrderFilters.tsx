"use client";

import { useState, useEffect } from "react";
import { OrderFilters, TimeRange } from "@/types/filter";
import Autocomplete from "./Autocomplete";

interface OrderFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
}

export default function OrderFiltersComponent({
  filters,
  onFiltersChange,
}: OrderFiltersProps) {
  const [clientNames, setClientNames] = useState<string[]>([]);
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [itemNames, setItemNames] = useState<string[]>([]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const response = await fetch("/api/orders?page=1&pageSize=1000");
        if (response.ok) {
          const data = await response.json();
          const clientNamesSet = new Set<string>();
          const itemIdsSet = new Set<string>();
          const itemNamesSet = new Set<string>();

          data.orders?.forEach((order: any) => {
            if (order.clientName) clientNamesSet.add(order.clientName);
            order.items?.forEach((item: any) => {
              if (item.itemId) itemIdsSet.add(item.itemId);
              if (item.itemName) itemNamesSet.add(item.itemName);
            });
          });

          setClientNames(Array.from(clientNamesSet).sort());
          setItemIds(Array.from(itemIdsSet).sort());
          setItemNames(Array.from(itemNamesSet).sort());
        }
      } catch (error) {
        console.error("Error loading filter options:", error);
      }
    };
    loadFilterOptions();
  }, []);
  const handleFilterChange = (key: keyof OrderFilters, value: string | TimeRange) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      itemId: "",
      itemName: "",
      clientName: "",
      timeRange: "all",
    });
  };

  const hasActiveFilters =
    filters.itemId.trim() !== "" ||
    filters.itemName.trim() !== "" ||
    filters.clientName.trim() !== "" ||
    filters.timeRange !== "all";

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-semibold text-black dark:text-zinc-50">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="cursor-pointer text-sm text-teal-500 hover:text-teal-600 dark:text-teal-400 transition-all duration-200 whitespace-nowrap"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Autocomplete
            id="itemId"
            label="Item ID"
            value={filters.itemId}
            onChange={(value) => handleFilterChange("itemId", value)}
            options={itemIds}
            placeholder="Filter by item ID"
          />
        </div>

        <div>
          <Autocomplete
            id="itemName"
            label="Item Name"
            value={filters.itemName}
            onChange={(value) => handleFilterChange("itemName", value)}
            options={itemNames}
            placeholder="Filter by item name"
          />
        </div>

        <div>
          <Autocomplete
            id="clientName"
            label="Client Name"
            value={filters.clientName}
            onChange={(value) => handleFilterChange("clientName", value)}
            options={clientNames}
            placeholder="Filter by client name"
          />
        </div>

        <div>
          <label
            htmlFor="timeRange"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Time Range
          </label>
          <select
            id="timeRange"
            value={filters.timeRange}
            onChange={(e) => handleFilterChange("timeRange", e.target.value as TimeRange)}
            className="appearance-none w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_0.5rem_center] bg-no-repeat pr-10"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="1m">Last Month</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
      </div>
    </div>
  );
}

