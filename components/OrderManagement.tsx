"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Order, OrderStatus, BillingData } from "@/types/order";
import { OrderFilters, PaginationParams } from "@/types/filter";
import OrderForm from "./OrderForm";
import OrderCards from "./OrderCards";
import OrderFiltersComponent from "./OrderFilters";
import Pagination from "./Pagination";
import PageHeader from "./PageHeader";
import BillingForm from "./BillingForm";
import SummaryView from "./SummaryView";
import Snackbar from "./Snackbar";
import IssueLog, { Issue } from "./IssueLog";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import { MdFileDownload } from "react-icons/md";

const PAGE_SIZE = 10;

export default function OrderManagement() {
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
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "all">("all");
  const [showCompleted, setShowCompleted] = useState(false); // Hide completed orders by default
  const [filters, setFilters] = useState<OrderFilters>({
    itemId: "",
    itemName: "",
    clientName: "",
    timeRange: "all",
    status: "",
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

  // Update filters when status changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      status: selectedStatus === "all" ? "" : selectedStatus,
    }));
  }, [selectedStatus]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(debouncedFilters.itemId && { itemId: debouncedFilters.itemId }),
        ...(debouncedFilters.itemName && { itemName: debouncedFilters.itemName }),
        ...(debouncedFilters.clientName && { clientName: debouncedFilters.clientName }),
        ...(debouncedFilters.timeRange && { timeRange: debouncedFilters.timeRange }),
        ...(debouncedFilters.status && { status: debouncedFilters.status }),
      });

      // Hide completed orders by default unless switch is on
      if (!showCompleted && !debouncedFilters.status) {
        // Don't set status filter, we'll filter client-side
      }

      const response = await fetch(`/api/orders?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load orders");
      }
      const data = await response.json();
      let orders = data.orders || [];
      
      // Hide completed orders by default unless switch is on
      if (!showCompleted && !debouncedFilters.status) {
        orders = orders.filter((order: Order) => order.status !== "completed");
      }
      
      setOrders(orders);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error loading orders:", error);
      setSnackbar({
        isOpen: true,
        message: "Failed to load orders",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedFilters, pagination, showCompleted]);

  const loadIssues = useCallback(async () => {
    try {
      const response = await fetch("/api/issues");
      if (!response.ok) {
        throw new Error("Failed to load issues");
      }
      const data = await response.json();
      setIssues(data || []);
    } catch (error) {
      console.error("Error loading issues:", error);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    loadIssues();
  }, [loadOrders, loadIssues]);

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination({ page: 1, pageSize: newPageSize });
  };

  const handleCreate = async (data: any) => {
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create order");
      }

      setSnackbar({
        isOpen: true,
        message: "Order created successfully!",
        type: "success",
      });
      setShowForm(false);
      loadOrders();
    } catch (error: any) {
      setSnackbar({
        isOpen: true,
        message: error.message || "Failed to create order",
        type: "error",
      });
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingOrder) return;

    try {
      const response = await fetch(`/api/orders/${editingOrder.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update order");
      }

      setSnackbar({
        isOpen: true,
        message: "Order updated successfully!",
        type: "success",
      });
      setEditingOrder(null);
      setShowForm(false);
      loadOrders();
    } catch (error: any) {
      setSnackbar({
        isOpen: true,
        message: error.message || "Failed to update order",
        type: "error",
      });
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete order");
      }

      setSnackbar({
        isOpen: true,
        message: "Order deleted successfully!",
        type: "success",
      });
      loadOrders();
    } catch (error: any) {
      setSnackbar({
        isOpen: true,
        message: error.message || "Failed to delete order",
        type: "error",
      });
    }
  };

  const [billingOrder, setBillingOrder] = useState<Order | null>(null);
  const [billingItemId, setBillingItemId] = useState<string>("");

  const handleBill = (order: Order, itemId: string) => {
    setBillingOrder(order);
    setBillingItemId(itemId);
  };

  const handleBillingSubmit = async (data: BillingData) => {
    if (!billingOrder) return;

    try {
      const response = await fetch(`/api/orders/${billingOrder.id}/bill`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: billingItemId,
          billedStockCount: data.billedStockCount,
          price: data.price,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to bill order");
      }

      setSnackbar({
        isOpen: true,
        message: "Order billed successfully!",
        type: "success",
      });
      setBillingOrder(null);
      setBillingItemId("");
      loadOrders();
    } catch (error: any) {
      setSnackbar({
        isOpen: true,
        message: error.message || "Failed to bill order",
        type: "error",
      });
    }
  };

  const handleBillingCancel = () => {
    setBillingOrder(null);
    setBillingItemId("");
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


  const handleResolveIssue = async (id: string) => {
    try {
      const response = await fetch(`/api/issues/${id}/resolve`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to resolve issue");
      }

      await loadIssues();
      setSnackbar({
        isOpen: true,
        message: "Issue resolved successfully!",
        type: "success",
      });
    } catch (error: any) {
      setSnackbar({
        isOpen: true,
        message: error.message || "Failed to resolve issue",
        type: "error",
      });
    }
  };

  const handleDismissIssue = async (id: string) => {
    try {
      const response = await fetch(`/api/issues/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to dismiss issue");
      }

      await loadIssues();
      setSnackbar({
        isOpen: true,
        message: "Issue dismissed successfully!",
        type: "success",
      });
    } catch (error: any) {
      setSnackbar({
        isOpen: true,
        message: error.message || "Failed to dismiss issue",
        type: "error",
      });
    }
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
      setSnackbar({
        isOpen: true,
        message: error.message || "Failed to download template",
        type: "error",
      });
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

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        // If response is not JSON, get text instead
        const text = await response.text();
        throw new Error(text || "Failed to upload file");
      }

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
        const errorMessages = result.details?.errors
          ?.map((e: any) => `Row ${e.row}: ${e.error}`)
          .join("\n") || "Some rows failed to upload";
        setSnackbar({
          isOpen: true,
          message: `Upload completed with errors. ${result.success} order(s) created, ${result.errors} error(s).`,
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

  if (loading && orders.length === 0 && issues.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-zinc-600 dark:text-zinc-400">Loading orders...</p>
      </div>
    );
  }

  const statusOptions: { value: OrderStatus | "all"; label: string }[] = [
    { value: "all", label: "All Orders" },
    { value: "uncompleted", label: "Uncompleted" },
    { value: "partially_completed", label: "Partially Completed" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Management"
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
                label: "+ New Order",
                onClick: () => {
                  setEditingOrder(null);
                  setShowForm(true);
                },
              }
            : undefined
        }
      />

      {showSummary && <SummaryView onClose={() => setShowSummary(false)} />}

      {!showForm && !showSummary && (
        <>
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

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Filter by Status:
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus | "all")}
                  className="cursor-pointer appearance-none rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Show Completed:
                </label>
                <button
                  type="button"
                  onClick={() => setShowCompleted(!showCompleted)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                    showCompleted ? "bg-teal-500" : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                  role="switch"
                  aria-checked={showCompleted}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showCompleted ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6 my-auto">
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

          {issues.length > 0 && (
            <IssueLog
              issues={issues}
              onResolve={handleResolveIssue}
              onDismiss={handleDismissIssue}
            />
          )}

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-zinc-600 dark:text-zinc-400">Loading orders...</p>
            </div>
          ) : (
            <>
              <OrderCards
                orders={orders}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onBill={handleBill}
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

      {billingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6 my-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                Bill Order
              </h2>
              <button
                onClick={handleBillingCancel}
                className="cursor-pointer rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
              >
                ✕
              </button>
            </div>
            <BillingForm
              order={billingOrder}
              itemId={billingItemId}
              onSubmit={handleBillingSubmit}
              onCancel={handleBillingCancel}
            />
          </div>
        </div>
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

