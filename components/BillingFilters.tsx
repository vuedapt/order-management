"use client";

import { useState, useEffect } from "react";
import { BillingFilters } from "@/types/billing";
import Autocomplete from "./Autocomplete";

interface BillingFiltersProps {
  filters: BillingFilters;
  onFiltersChange: (filters: BillingFilters) => void;
}

export default function BillingFiltersComponent({
  filters,
  onFiltersChange,
}: BillingFiltersProps) {
  const [itemIdOptions, setItemIdOptions] = useState<string[]>([]);
  const [itemNameOptions, setItemNameOptions] = useState<string[]>([]);
  const [clientNameOptions, setClientNameOptions] = useState<string[]>([]);
  const [orderOrderIdOptions, setOrderOrderIdOptions] = useState<string[]>([]);

  useEffect(() => {
    // Fetch unique values for autocomplete
    const fetchOptions = async () => {
      try {
        const response = await fetch("/api/billing/filter-options");
        if (response.ok) {
          const data = await response.json();
          setItemIdOptions(data.itemIds || []);
          setItemNameOptions(data.itemNames || []);
          setClientNameOptions(data.clientNames || []);
          setOrderOrderIdOptions(data.orderOrderIds || []);
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };
    fetchOptions();
  }, []);

  const handleFilterChange = (key: keyof BillingFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClearAll = () => {
    onFiltersChange({
      itemId: "",
      itemName: "",
      clientName: "",
      orderOrderId: "",
      timeRange: "all",
    });
  };

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Filters</h3>
        <button
          onClick={handleClearAll}
          className="cursor-pointer text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-all duration-200"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Order ID
          </label>
          <Autocomplete
            value={filters.orderOrderId}
            options={orderOrderIdOptions}
            onChange={(value) => handleFilterChange("orderOrderId", value)}
            placeholder="Search Order ID..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Item ID
          </label>
          <Autocomplete
            value={filters.itemId}
            options={itemIdOptions}
            onChange={(value) => handleFilterChange("itemId", value)}
            placeholder="Search Item ID..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Item Name
          </label>
          <Autocomplete
            value={filters.itemName}
            options={itemNameOptions}
            onChange={(value) => handleFilterChange("itemName", value)}
            placeholder="Search Item Name..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Client Name
          </label>
          <Autocomplete
            value={filters.clientName}
            options={clientNameOptions}
            onChange={(value) => handleFilterChange("clientName", value)}
            placeholder="Search Client Name..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Time Range
          </label>
          <select
            value={filters.timeRange}
            onChange={(e) => handleFilterChange("timeRange", e.target.value)}
            className="cursor-pointer appearance-none w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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

