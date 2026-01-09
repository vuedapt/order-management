"use client";

import { useState, useEffect, useCallback } from "react";
import { BillingEntry, BillingFilters } from "@/types/billing";
import { PaginationParams } from "@/types/filter";
import BillingTable from "./BillingTable";
import BillingFiltersComponent from "./BillingFilters";
import Pagination from "./Pagination";
import PageHeader from "./PageHeader";
import Snackbar from "./Snackbar";

const PAGE_SIZE = 10;

export default function BillingManagement() {
  const [billingEntries, setBillingEntries] = useState<BillingEntry[]>([]);
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
      setBillingEntries(data.billingEntries || []);
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

  if (loading && billingEntries.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-zinc-600 dark:text-zinc-400">Loading billing entries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Billing Management" />

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
          <BillingTable
            billingEntries={billingEntries}
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
