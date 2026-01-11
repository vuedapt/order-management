"use client";

import { useState, useEffect, useCallback } from "react";
import { BillingBill, BillingFilters } from "@/types/billing";
import { PaginationParams } from "@/types/filter";
import BillingCards from "./BillingCards";
import BillingFiltersComponent from "./BillingFilters";
import Pagination from "./Pagination";
import PageHeader from "./PageHeader";
import Snackbar from "./Snackbar";
import { exportBillingSummaryToPDF } from "@/lib/exports/billingSummaryPdf";
import { MdFileDownload } from "react-icons/md";

const PAGE_SIZE = 10;

export default function BillingManagement() {
  const [bills, setBills] = useState<BillingBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    type: "success",
  });
  const [filters, setFilters] = useState<BillingFilters>({
    itemId: "",
    itemName: "",
    clientName: "",
    orderOrderId: "",
    timeRange: "all",
  });
  const [debouncedFilters, setDebouncedFilters] = useState<BillingFilters>(filters);
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [downloadingSummary, setDownloadingSummary] = useState(false);

  // Debounce filter changes (1000ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 1000);

    return () => clearTimeout(timer);
  }, [filters]);

  const loadBillingEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(debouncedFilters.itemId && { itemId: debouncedFilters.itemId }),
        ...(debouncedFilters.itemName && { itemName: debouncedFilters.itemName }),
        ...(debouncedFilters.clientName && { clientName: debouncedFilters.clientName }),
        ...(debouncedFilters.orderOrderId && { orderOrderId: debouncedFilters.orderOrderId }),
        ...(debouncedFilters.timeRange && { timeRange: debouncedFilters.timeRange }),
      });

      const response = await fetch(`/api/billing?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load billing entries");
      }
      const data = await response.json();
      setBills(data.bills || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error loading billing entries:", error);
      setSnackbar({
        isOpen: true,
        message: "Failed to load billing entries",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedFilters, pagination]);

  useEffect(() => {
    loadBillingEntries();
  }, [loadBillingEntries]);

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination({ page: 1, pageSize: newPageSize });
  };

  const handleFiltersChange = (newFilters: BillingFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownloadSummary = async () => {
    setDownloadingSummary(true);
    try {
      // Fetch all bills matching current filters (no pagination)
      const params = new URLSearchParams({
        page: "1",
        pageSize: "10000", // Large number to get all bills
        ...(debouncedFilters.itemId && { itemId: debouncedFilters.itemId }),
        ...(debouncedFilters.itemName && { itemName: debouncedFilters.itemName }),
        ...(debouncedFilters.clientName && { clientName: debouncedFilters.clientName }),
        ...(debouncedFilters.orderOrderId && { orderOrderId: debouncedFilters.orderOrderId }),
        ...(debouncedFilters.timeRange && { timeRange: debouncedFilters.timeRange }),
      });

      const response = await fetch(`/api/billing?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load billing summary");
      }
      const data = await response.json();
      const allBills = data.bills || [];
      
      // Calculate total amount
      const totalAmount = allBills.reduce((sum: number, bill: BillingBill) => sum + bill.totalAmount, 0);
      
      // Export to PDF
      await exportBillingSummaryToPDF({
        bills: allBills,
        totalAmount,
        filters: debouncedFilters,
      });
      
      setSnackbar({
        isOpen: true,
        message: "Billing summary downloaded successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Error downloading summary:", error);
      setSnackbar({
        isOpen: true,
        message: "Failed to download billing summary",
        type: "error",
      });
    } finally {
      setDownloadingSummary(false);
    }
  };

  if (loading && bills.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-zinc-600 dark:text-zinc-400">Loading billing entries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Billing Management" />
        <button
          onClick={handleDownloadSummary}
          disabled={downloadingSummary || loading}
          className="cursor-pointer rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
          title="Download Billing Summary"
        >
          <MdFileDownload className="text-lg" />
          {downloadingSummary ? "Downloading..." : "Download Summary"}
        </button>
      </div>

      <BillingFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-zinc-600 dark:text-zinc-400">Loading billing entries...</p>
        </div>
      ) : (
        <>
          <BillingCards
            bills={bills}
            currentPage={pagination.page}
            pageSize={pagination.pageSize}
            total={total}
            onPageSizeChange={handlePageSizeChange}
          />

          <Pagination
            currentPage={pagination.page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        isOpen={snackbar.isOpen}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
      />
    </div>
  );
}
