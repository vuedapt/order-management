"use client";

import { useState, useEffect, useCallback } from "react";
import { Order } from "@/types/order";
import { OrderFilters, PaginationParams } from "@/types/filter";
import OrderForm from "./OrderForm";
import OrderTable from "./OrderTable";
import OrderFiltersComponent from "./OrderFilters";
import Pagination from "./Pagination";
import PageHeader from "./PageHeader";
import SummaryView from "./SummaryView";
import Snackbar from "./Snackbar";
import IssueLog, { Issue } from "./IssueLog";

const PAGE_SIZE = 10;

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
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
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(debouncedFilters.itemId && { itemId: debouncedFilters.itemId }),
        ...(debouncedFilters.itemName && { itemName: debouncedFilters.itemName }),
        ...(debouncedFilters.clientName && { clientName: debouncedFilters.clientName }),
        ...(debouncedFilters.timeRange && { timeRange: debouncedFilters.timeRange }),
      });

      const response = await fetch(`/api/orders?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load orders");
      }
      const data = await response.json();
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedFilters, pagination]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Load issues
  useEffect(() => {
    const loadIssues = async () => {
      try {
        const response = await fetch("/api/issues");
        if (response.ok) {
          const data = await response.json();
          setIssues(data || []);
        }
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
              // Frontend-only: API service removed. Connect to your backend API here.
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
              // Frontend-only: API service removed. Connect to your backend API here.
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

