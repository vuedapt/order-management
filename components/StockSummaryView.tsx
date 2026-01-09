"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { exportStockToPDF, exportStockToExcel, exportStockToCSV } from "@/lib/exports/stockExports";
import type { StockExportData } from "@/lib/exports/stockTypes";
import StockFiltersComponent from "./StockFilters";

interface StockSummaryViewProps {
  onClose: () => void;
}

export default function StockSummaryView({ onClose }: StockSummaryViewProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [stocks, setStocks] = useState<Array<{ itemId: string; itemName: string; stockCount: number }>>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalStockCount, setTotalStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{ itemId: string; itemName: string }>({
    itemId: "",
    itemName: "",
  });
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "1000",
        ...(filters.itemId && { itemId: filters.itemId }),
        ...(filters.itemName && { itemName: filters.itemName }),
      });

      const response = await fetch(`/api/stock?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load stocks");
      }
      const data = await response.json();
      const filtered = data.stocks || [];
      const stockSummary = filtered.map((stock: any) => ({
        itemId: stock.itemId,
        itemName: stock.itemName,
        stockCount: stock.stockCount,
      }));
      const totalStockCount = filtered.reduce((sum: number, stock: any) => sum + (stock.stockCount || 0), 0);
      setStocks(stockSummary);
      setTotalItems(filtered.length);
      setTotalStockCount(totalStockCount);
    } catch (error) {
      console.error("Error loading stock summary:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleFiltersChange = (newFilters: { itemId: string; itemName: string }) => {
    setFilters(newFilters);
  };

  const handleExportPDF = async () => {
    try {
      const exportData: StockExportData = {
        stocks,
        totalItems,
        totalStockCount,
      };
      await exportStockToPDF(exportData);
      setShowExportMenu(false);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
    }
  };

  const handleExportExcel = () => {
    const exportData: StockExportData = {
      stocks,
      totalItems,
      totalStockCount,
    };
    exportStockToExcel(exportData);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const exportData: StockExportData = {
      stocks,
      totalItems,
      totalStockCount,
    };
    exportStockToCSV(exportData);
    setShowExportMenu(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4 overflow-y-auto">
      <div
        ref={modalRef}
        className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6 my-auto"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-zinc-50">
            Stock Summary
          </h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="cursor-pointer rounded-md bg-teal-500 px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
              >
                Export
              </button>
              {showExportMenu && (
                <div className="absolute right-0 z-10 mt-2 w-48 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg">
                  <div className="py-1">
                    <button
                      onClick={handleExportPDF}
                      className="cursor-pointer w-full text-left px-4 py-2 text-sm text-black dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all duration-200"
                    >
                      Export as PDF
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="cursor-pointer w-full text-left px-4 py-2 text-sm text-black dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all duration-200"
                    >
                      Export as Excel
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="cursor-pointer w-full text-left px-4 py-2 text-sm text-black dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all duration-200"
                    >
                      Export as CSV
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 sm:px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <StockFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-zinc-600 dark:text-zinc-400">Loading summary...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-2">
                    Stock Summary
                  </h2>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    <p>Total Items: <span className="font-medium text-black dark:text-zinc-50">{totalItems}</span></p>
                    <p>Total Stock Count: <span className="font-medium text-black dark:text-zinc-50">{totalStockCount}</span></p>
                  </div>
                </div>
                {stocks.length === 0 ? (
                  <p className="text-zinc-600 dark:text-zinc-400">No data available</p>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-full inline-block align-middle">
                      <table className="w-full min-w-[600px]">
                        <thead className="bg-zinc-50 dark:bg-zinc-800">
                          <tr>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                              Item ID
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                              Item Name
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                              Stock Count
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                          {stocks.map((stock, index) => (
                            <tr
                              key={index}
                              className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                            >
                              <td className="px-4 sm:px-6 py-4 text-sm text-black dark:text-zinc-50">
                                {stock.itemId}
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-sm text-black dark:text-zinc-50">
                                <div className="max-w-[200px] truncate" title={stock.itemName}>
                                  {stock.itemName}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-sm font-medium text-black dark:text-zinc-50">
                                {stock.stockCount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

