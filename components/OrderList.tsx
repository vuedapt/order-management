"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Order } from "@/types/order";
import { orderService } from "@/lib/services/orderService";
import { OrderFilters, PaginationParams } from "@/types/filter";
import OrderForm from "./OrderForm";
import OrderTable from "./OrderTable";
import OrderFiltersComponent from "./OrderFilters";
import Pagination from "./Pagination";
import PageHeader from "./PageHeader";
import SummaryView from "./SummaryView";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import { MdFileDownload } from "react-icons/md";
import Snackbar from "./Snackbar";
import IssueLog, { Issue } from "./IssueLog";
import { issueService } from "@/lib/services/issueService";

const PAGE_SIZE = 10;

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
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
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filters, setFilters] = useState<OrderFilters>({
    itemId: "",
    itemName: "",
    clientName: "",
    timeRange: "all",
  });
  const [debouncedFilters, setDebouncedFilters] = useState<OrderFilters>(filters);
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

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const result = await orderService.getOrders(debouncedFilters, pagination);
      setOrders(result.orders as Order[]);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedFilters, pagination]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Load issues from database
  useEffect(() => {
    const loadIssues = async () => {
      try {
        const data = await issueService.getIssues();
        setIssues(data);
      } catch (error) {
        console.error("Error loading issues:", error);
      }
    };
    loadIssues();
  }, []);

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination({ page: 1, pageSize: newPageSize });
  };

  const handleCreate = async (data: any) => {
    const startTime = performance.now();
    console.log("[OrderList] Creating order(s)...", data);
    
    try {
      // Check if it's multi-order form data
      if (data.items && Array.isArray(data.items)) {
        // Create multiple orders for the same client
        const createPromises = data.items.map((item: any) =>
          orderService.createOrder({
            itemId: item.itemId,
            itemName: item.itemName,
            clientName: data.clientName,
            stockCount: item.stockCount,
          })
        );
        
        await Promise.all(createPromises);
        const createDuration = performance.now() - startTime;
        console.log(`[OrderList] ${data.items.length} order(s) created in ${createDuration.toFixed(2)}ms, reloading list...`);
      } else {
        // Single order
        await orderService.createOrder(data);
        const createDuration = performance.now() - startTime;
        console.log(`[OrderList] Order created in ${createDuration.toFixed(2)}ms, reloading list...`);
      }
      
      const reloadStartTime = performance.now();
      await loadOrders();
      const reloadDuration = performance.now() - reloadStartTime;
      const totalDuration = performance.now() - startTime;
      
      console.log(`[OrderList] Order creation complete in ${totalDuration.toFixed(2)}ms`, {
        reloadDuration: `${reloadDuration.toFixed(2)}ms`,
        totalDuration: `${totalDuration.toFixed(2)}ms`,
      });
      
      setShowForm(false);
      setSnackbar({
        isOpen: true,
        message: data.items && Array.isArray(data.items)
          ? `Successfully created ${data.items.length} order(s)!`
          : "Order created successfully!",
        type: "success",
      });
    } catch (error: any) {
      const duration = performance.now() - startTime;
      console.error(`[OrderList] Error creating order(s) after ${duration.toFixed(2)}ms:`, error);
      setSnackbar({
        isOpen: true,
        message: error.message || "Failed to create order(s)",
        type: "error",
      });
      throw error;
    }
  };

  const handleUpdate = async (data: any) => {
    if (editingOrder) {
      const startTime = performance.now();
      console.log("[OrderList] Updating order...", { orderId: editingOrder.id, data });
      
      try {
        await orderService.updateOrder(editingOrder.id, data);
        const updateDuration = performance.now() - startTime;
        console.log(`[OrderList] Order updated in ${updateDuration.toFixed(2)}ms, reloading list...`);
        
        const reloadStartTime = performance.now();
        await loadOrders();
        const reloadDuration = performance.now() - reloadStartTime;
        const totalDuration = performance.now() - startTime;
        
        console.log(`[OrderList] Order update complete in ${totalDuration.toFixed(2)}ms`, {
          updateDuration: `${updateDuration.toFixed(2)}ms`,
          reloadDuration: `${reloadDuration.toFixed(2)}ms`,
          totalDuration: `${totalDuration.toFixed(2)}ms`,
        });
        
        setEditingOrder(null);
        setShowForm(false);
        setSnackbar({
          isOpen: true,
          message: "Order updated successfully!",
          type: "success",
        });
      } catch (error: any) {
        const duration = performance.now() - startTime;
        console.error(`[OrderList] Error updating order after ${duration.toFixed(2)}ms:`, error);
        setSnackbar({
          isOpen: true,
          message: error.message || "Failed to update order",
          type: "error",
        });
        throw error;
      }
    }
  };

  const handleDelete = async (orderId: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      const startTime = performance.now();
      console.log("[OrderList] Deleting order...", { orderId });
      
      try {
        await orderService.deleteOrder(orderId);
        const deleteDuration = performance.now() - startTime;
        console.log(`[OrderList] Order deleted in ${deleteDuration.toFixed(2)}ms, reloading list...`);
        
        const reloadStartTime = performance.now();
        await loadOrders();
        const reloadDuration = performance.now() - reloadStartTime;
        const totalDuration = performance.now() - startTime;
        
        console.log(`[OrderList] Order deletion complete in ${totalDuration.toFixed(2)}ms`, {
          deleteDuration: `${deleteDuration.toFixed(2)}ms`,
          reloadDuration: `${reloadDuration.toFixed(2)}ms`,
          totalDuration: `${totalDuration.toFixed(2)}ms`,
        });
        setSnackbar({
          isOpen: true,
          message: "Order deleted successfully!",
          type: "success",
        });
      } catch (error: any) {
        const duration = performance.now() - startTime;
        console.error(`[OrderList] Error deleting order after ${duration.toFixed(2)}ms:`, error);
        setSnackbar({
          isOpen: true,
          message: error.message || "Failed to delete order",
          type: "error",
        });
      }
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingOrder(null);
  };

  const handleFiltersChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/orders/template");
      if (!response.ok) {
        throw new Error("Failed to download template");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "order-template.xlsx";
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

      const response = await fetch("/api/orders/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload file");
      }

      // Reload orders
      await loadOrders();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Show results
      if (result.errors > 0) {
        const errorCount = result.errors;
        const successCount = result.success;
        
        // Add errors to issue log (only insufficient stock errors)
        if (result.details?.errors) {
          const insufficientStockErrors = result.details.errors.filter((e: any) =>
            e.error?.includes("Insufficient stock")
          );
          
          if (insufficientStockErrors.length > 0) {
            // Save issues to database
            const newIssuesPromises = insufficientStockErrors.map((e: any) =>
              issueService.createIssue({
                row: e.row,
                itemId: e.itemId || "",
                error: e.error,
              })
            );
            
            const newIssues = await Promise.all(newIssuesPromises);
            setIssues((prev) => [...prev, ...newIssues]);
          }
        }
        
        setSnackbar({
          isOpen: true,
          message: `Upload completed with errors. ${successCount} succeeded, ${errorCount} failed. Check issue log below.`,
          type: "error",
        });
        console.log("Upload details:", result.details);
      } else {
        setSnackbar({
          isOpen: true,
          message: `Successfully uploaded ${result.success} order(s)!`,
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

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-zinc-600 dark:text-zinc-400">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Management"
        leftButton={
          !showForm
            ? {
                label: "View Summary",
                onClick: () => setShowSummary(true),
              }
            : undefined
        }
        rightButton={
          !showForm
            ? {
                label: "+ New Order",
                onClick: () => {
                  setEditingOrder(null);
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
            id="order-upload"
          />
          <label
            htmlFor="order-upload"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6 my-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                {editingOrder ? "Edit Order" : "Create New Order"}
              </h2>
              <button
                onClick={handleCancel}
                className="cursor-pointer rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
              >
                ✕
              </button>
            </div>
            <OrderForm
              order={editingOrder}
              onSubmit={editingOrder ? handleUpdate : handleCreate}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}

      {!showForm && (
        <>
          <OrderFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-zinc-600 dark:text-zinc-400">Loading orders...</p>
            </div>
          ) : (
            <>
              <OrderTable
                orders={orders}
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

      {!showForm && (
        <IssueLog
          issues={issues}
          onResolve={async (id) => {
            try {
              await issueService.resolveIssue(id);
              setIssues((prev) =>
                prev.map((issue) =>
                  issue.id === id ? { ...issue, resolved: true } : issue
                )
              );
            } catch (error: any) {
              console.error("Error resolving issue:", error);
              setSnackbar({
                isOpen: true,
                message: error.message || "Failed to resolve issue",
                type: "error",
              });
            }
          }}
          onDismiss={async (id) => {
            try {
              await issueService.deleteIssue(id);
              setIssues((prev) => prev.filter((issue) => issue.id !== id));
            } catch (error: any) {
              console.error("Error dismissing issue:", error);
              setSnackbar({
                isOpen: true,
                message: error.message || "Failed to dismiss issue",
                type: "error",
              });
            }
          }}
        />
      )}

      {showSummary && <SummaryView onClose={() => setShowSummary(false)} />}

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        isOpen={snackbar.isOpen}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
      />
    </div>
  );
}

