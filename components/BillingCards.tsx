"use client";

import { useState } from "react";
import { BillingBill } from "@/types/billing";
import { exportBillToPDF } from "@/lib/exports/billingPdf";
import { MdFileDownload } from "react-icons/md";

interface BillingCardsProps {
  bills: BillingBill[];
  currentPage: number;
  pageSize: number;
  total: number;
  onPageSizeChange: (pageSize: number) => void;
}

export default function BillingCards({
  bills,
  currentPage,
  pageSize,
  total,
  onPageSizeChange,
}: BillingCardsProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (bill: BillingBill) => {
    setDownloading(bill.billId);
    try {
      await exportBillToPDF(bill);
    } catch (error) {
      console.error("Error downloading bill:", error);
      alert("Failed to download bill. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  if (bills.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          No billing entries found. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {bills.map((bill) => (
          <div
            key={bill.billId}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Bill Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
                    Bill ID: {bill.billId}
                  </h3>
                  <button
                    onClick={() => handleDownload(bill)}
                    disabled={downloading === bill.billId}
                    className="cursor-pointer p-2 text-teal-500 hover:text-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                    title="Download Bill as PDF"
                  >
                    <MdFileDownload className="text-lg" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Order:</span> {bill.orderOrderId}
                  </span>
                  <span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Client:</span> {bill.clientName}
                  </span>
                  <span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Date:</span> {bill.date}
                  </span>
                  <span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Time:</span> {bill.time}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Amount</div>
                <div className="text-xl font-bold text-teal-600 dark:text-teal-400">
                  LKR {bill.totalAmount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Bill Items */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Items ({bill.items.length})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Item ID
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Item Name
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Quantity
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Price/Unit
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {bill.items.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="px-3 py-2 text-black dark:text-zinc-50 font-medium">
                          {item.itemId}
                        </td>
                        <td className="px-3 py-2 text-black dark:text-zinc-50">
                          {item.itemName}
                        </td>
                        <td className="px-3 py-2 text-right text-black dark:text-zinc-50">
                          {item.billedStockCount}
                        </td>
                        <td className="px-3 py-2 text-right text-black dark:text-zinc-50">
                          LKR {item.price.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-black dark:text-zinc-50">
                          LKR {item.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer with pagination info */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2 sm:gap-4">
            <span>
              Showing <span className="font-medium text-black dark:text-zinc-50">{bills.length}</span> of{" "}
              <span className="font-medium text-black dark:text-zinc-50">{total}</span> bills
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span>
              Page <span className="font-medium text-black dark:text-zinc-50">{currentPage}</span> of{" "}
              <span className="font-medium text-black dark:text-zinc-50">{Math.ceil(total / pageSize) || 1}</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Limit:</span>
              <span className="sm:hidden">Limit</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                className="cursor-pointer appearance-none rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 sm:px-3 py-1.5 text-sm text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 relative z-10"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
