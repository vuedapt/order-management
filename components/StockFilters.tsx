"use client";

import { useState, useEffect } from "react";
import Autocomplete from "./Autocomplete";

interface StockFilters {
  itemId: string;
  itemName: string;
}

interface StockFiltersProps {
  filters: StockFilters;
  onFiltersChange: (filters: StockFilters) => void;
}

export default function StockFiltersComponent({
  filters,
  onFiltersChange,
}: StockFiltersProps) {
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [itemNames, setItemNames] = useState<string[]>([]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const response = await fetch("/api/stock?page=1&pageSize=1000");
        if (response.ok) {
          const data = await response.json();
          const itemIdsSet = new Set<string>();
          const itemNamesSet = new Set<string>();

          data.stocks?.forEach((stock: any) => {
            if (stock.itemId) itemIdsSet.add(stock.itemId);
            if (stock.itemName) itemNamesSet.add(stock.itemName);
          });

          setItemIds(Array.from(itemIdsSet).sort());
          setItemNames(Array.from(itemNamesSet).sort());
        }
      } catch (error) {
        console.error("Error loading filter options:", error);
      }
    };
    loadFilterOptions();
  }, []);

  const handleFilterChange = (key: keyof StockFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      itemId: "",
      itemName: "",
    });
  };

  const hasActiveFilters = filters.itemId.trim() !== "" || filters.itemName.trim() !== "";

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

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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
      </div>
    </div>
  );
}

