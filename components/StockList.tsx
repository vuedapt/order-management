"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { stockService, StockItem, StockFormData, PaginationParams, StockFilters } from "@/lib/services/stockService";
import StockForm from "./StockForm";
import StockTable from "./StockTable";
import PageHeader from "./PageHeader";
import Pagination from "./Pagination";
import StockSummaryView from "./StockSummaryView";
import StockFiltersComponent from "./StockFilters";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import { MdFileDownload } from "react-icons/md";
import Snackbar from "./Snackbar";

const PAGE_SIZE = 10;

export default function StockList() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    type: "success",
  });
  const [filters, setFilters] = useState<StockFilters>({
    itemId: "",
    itemName: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState<StockFilters>(filters);
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

  const loadStocks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await stockService.getStocks(pagination, debouncedFilters);
      setStocks(data.stocks);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error) {
      console.error("Error loading stocks:", error);
      setSnackbar({
        isOpen: true,
        message: "Failed to load stock items.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [pagination, debouncedFilters]);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  const handleCreate = async (data: StockFormData) => {
    try {
      await stockService.createStock(data);
      await loadStocks();
      setShowForm(false);
      setSnackbar({
        isOpen: true,
        message: "Stock item created successfully!",
        type: "success",
      });
    } catch (error: any) {
      console.error("Error creating stock:", error);
      setSnackbar({
        isOpen: true,
        message: error.message || "Failed to create stock item",
        type: "error",
      });
      throw error;
    }
  };

  const handleUpdate = async (data: StockFormData) => {
    if (editingStock) {
      try {
        await stockService.updateStock(editingStock.id, data);
        await loadStocks();
        setEditingStock(null);
        setShowForm(false);
        setSnackbar({
          isOpen: true,
          message: "Stock item updated successfully!",
          type: "success",
        });
      } catch (error: any) {
        console.error("Error updating stock:", error);
        setSnackbar({
          isOpen: true,
          message: error.message || "Failed to update stock item",
          type: "error",
        });
        throw error;
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this stock item?")) {
      try {
        await stockService.deleteStock(id);
        await loadStocks();
        setSnackbar({
          isOpen: true,
          message: "Stock item deleted successfully!",
          type: "success",
        });
      } catch (error: any) {
        console.error("Error deleting stock:", error);
        setSnackbar({
          isOpen: true,
          message: error.message || "Failed to delete stock item",
          type: "error",
        });
      }
    }
  };

  const handleEdit = (stock: StockItem) => {
    setEditingStock(stock);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStock(null);
  };

  const handleFiltersChange = (newFilters: StockFilters) => {
    setFilters(newFilters);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination({ page: 1, pageSize: newPageSize });
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/stock/template");
      if (!response.ok) {
        throw new Error("Failed to download template");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stock-template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error downloading template:", error);
      alert(error.message || "Failed to download template");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/stock/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload file");
      }

      // Reload stocks
      await loadStocks();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Show results
      if (result.errors > 0) {
        const errorMessages = result.details?.errors
          ?.map((e: any) => `Row ${e.row}: ${e.error}`)
          .join("\n") || "Some rows failed to upload";
        setSnackbar({
          isOpen: true,
          message: `Upload completed with errors. ${result.success} succeeded, ${result.errors} failed.`,
          type: "error",
        });
        console.log("Upload details:", result.details);
      } else {
        setSnackbar({
          isOpen: true,
          message: `Successfully uploaded ${result.success} stock item(s)!`,
          type: "success",
        });
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      setSnackbar({
        isOpen: true,
        message: error.message || "Failed to upload file",
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Management"
        leftButton={
          !showForm && !showSummary
            ? {
                label: "View Summary",
                onClick: () => setShowSummary(true),
              }
            : undefined
        }
        rightButton={
          !showForm && !showSummary
            ? {
                label: "+ New Stock Item",
                onClick: () => {
                  setEditingStock(null);
                  setShowForm(true);
                },
              }
            : undefined
        }
      />

      {!showForm && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="stock-upload"
          />
          <label
            htmlFor="stock-upload"
            className="cursor-pointer flex items-center gap-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 sm:px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 whitespace-nowrap"
          >
            <PiMicrosoftExcelLogoFill className={`text-base sm:text-lg ${uploading ? "text-zinc-400" : "text-green-700"}`} />
            {uploading ? "Uploading..." : "Upload Excel"}
          </label>
          <button
            onClick={handleDownloadTemplate}
            className="cursor-pointer flex items-center gap-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 sm:px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 whitespace-nowrap"
          >
            <MdFileDownload className="text-base sm:text-lg" />
            Download Template
          </button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-2xl rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                {editingStock ? "Edit Stock Item" : "Create New Stock Item"}
              </h2>
              <button
                onClick={handleCancel}
                className="cursor-pointer rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
              >
                ✕
              </button>
            </div>
            <StockForm
              stock={editingStock}
              onSubmit={editingStock ? handleUpdate : handleCreate}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}

      {!showForm && (
        <>
          <StockFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-zinc-600 dark:text-zinc-400">Loading stocks...</p>
            </div>
          ) : (
            <>
              <StockTable
                stocks={stocks}
                onEdit={handleEdit}
                onDelete={handleDelete}
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
        </>
      )}

      {showSummary && <StockSummaryView onClose={() => setShowSummary(false)} />}

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        isOpen={snackbar.isOpen}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
      />
    </div>
  );
}

