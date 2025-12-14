"use client";

import { useState, useEffect, useCallback } from "react";
import { Order } from "@/types/order";
import { orderService } from "@/lib/services/orderService";
import { OrderFilters, PaginationParams } from "@/types/filter";
import OrderForm from "./OrderForm";
import OrderTable from "./OrderTable";
import OrderFiltersComponent from "./OrderFilters";
import Pagination from "./Pagination";
import PageHeader from "./PageHeader";
import SummaryView from "./SummaryView";

const PAGE_SIZE = 10;

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [filters, setFilters] = useState<OrderFilters>({
    itemId: "",
    itemName: "",
    clientName: "",
    timeRange: "all",
  });
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const result = await orderService.getOrders(filters, pagination);
      setOrders(result.orders as Order[]);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [filters]);

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination({ page: 1, pageSize: newPageSize });
  };

  const handleCreate = async (data: any) => {
    const startTime = performance.now();
    console.log("[OrderList] Creating order...", data);
    
    try {
      const orderId = await orderService.createOrder(data);
      const createDuration = performance.now() - startTime;
      console.log(`[OrderList] Order created in ${createDuration.toFixed(2)}ms, reloading list...`);
      
      const reloadStartTime = performance.now();
      await loadOrders();
      const reloadDuration = performance.now() - reloadStartTime;
      const totalDuration = performance.now() - startTime;
      
      console.log(`[OrderList] Order creation complete in ${totalDuration.toFixed(2)}ms`, {
        createDuration: `${createDuration.toFixed(2)}ms`,
        reloadDuration: `${reloadDuration.toFixed(2)}ms`,
        totalDuration: `${totalDuration.toFixed(2)}ms`,
      });
      
      setShowForm(false);
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[OrderList] Error creating order after ${duration.toFixed(2)}ms:`, error);
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
      } catch (error) {
        const duration = performance.now() - startTime;
        console.error(`[OrderList] Error updating order after ${duration.toFixed(2)}ms:`, error);
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
      } catch (error: any) {
        const duration = performance.now() - startTime;
        console.error(`[OrderList] Error deleting order after ${duration.toFixed(2)}ms:`, error);
        alert(`Failed to delete order: ${error.message || "Unknown error"}`);
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
        title=""
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-2xl rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
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

      {showSummary && <SummaryView onClose={() => setShowSummary(false)} />}
    </div>
  );
}

