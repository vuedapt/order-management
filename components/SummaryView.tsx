"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { OrderFilters } from "@/types/filter";
import { orderService } from "@/lib/services/orderService";
import { exportToPDF, exportToExcel, exportToCSV } from "@/lib/exports";
import type { SummaryByItem, SummaryByClientItem } from "@/lib/exports";
import OrderFiltersComponent from "./OrderFilters";

interface SummaryViewProps {
  onClose: () => void;
}

export default function SummaryView({ onClose }: SummaryViewProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [summaryByItem, setSummaryByItem] = useState<SummaryByItem[]>([]);
  const [summaryByClientItem, setSummaryByClientItem] = useState<SummaryByClientItem[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrderFilters>({
    itemId: "",
    itemName: "",
    clientName: "",
    timeRange: "all",
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
    try {
      setLoading(true);
      const result = await orderService.getSummary(filters);
      setSummaryByItem(result.summaryByItem);
      setSummaryByClientItem(result.summaryByClientItem);
      setTotalOrders(result.totalOrders);
    } catch (error) {
      console.error("Error loading summary:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleFiltersChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF({
        summaryByItem,
        summaryByClientItem,
        totalOrders,
      });
      setShowExportMenu(false);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
    }
  };

  const handleExportExcel = () => {
    exportToExcel({
      summaryByItem,
      summaryByClientItem,
      totalOrders,
    });
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    exportToCSV({
      summaryByItem,
      summaryByClientItem,
      totalOrders,
    });
    setShowExportMenu(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        ref={modalRef}
        className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            Summary
          </h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="cursor-pointer rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
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
              className="cursor-pointer rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <OrderFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-zinc-600 dark:text-zinc-400">Loading summary...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
              Summary by Item
            </h2>
            {summaryByItem.length === 0 ? (
              <p className="text-zinc-600 dark:text-zinc-400">No data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Item ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Item Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Total Stock Count
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {summaryByItem.map((row, index) => (
                      <tr
                        key={index}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
                          {row.itemId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
                          {row.itemName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black dark:text-zinc-50">
                          {row.totalStock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
              Summary by Client and Item
            </h2>
            {summaryByClientItem.length === 0 ? (
              <p className="text-zinc-600 dark:text-zinc-400">No data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Item ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Item Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Total Stock Count
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {summaryByClientItem.map((row, index) => (
                      <tr
                        key={index}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
                          {row.client}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
                          {row.itemId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
                          {row.itemName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black dark:text-zinc-50">
                          {row.totalStock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

