import { Order, OrderFormData } from "@/types/order";
import { OrderFilters, PaginationParams, PaginatedOrders } from "@/types/filter";

const DEFAULT_PAGE_SIZE = 12;

export const orderService = {
  // Create a new order
  async createOrder(orderData: OrderFormData): Promise<string> {
    const startTime = performance.now();
    console.log("[OrderService] Creating order...", orderData);
    
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create order");
      }

      const order = await response.json();
      const duration = performance.now() - startTime;
      console.log(`[OrderService] Order created successfully in ${duration.toFixed(2)}ms`, {
        orderId: order.id,
        duration: `${duration.toFixed(2)}ms`,
      });
      
      return order.id;
    } catch (error: any) {
      const duration = performance.now() - startTime;
      console.error(`[OrderService] Error creating order after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  },

  // Get all orders with filters and pagination
  async getOrders(
    filters: OrderFilters,
    pagination: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE }
  ): Promise<PaginatedOrders> {
    const startTime = performance.now();
    console.log("[OrderService] Fetching orders...", { filters, pagination });
    
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        itemId: filters.itemId || "",
        itemName: filters.itemName || "",
        clientName: filters.clientName || "",
        timeRange: filters.timeRange || "all",
      });

      const queryStartTime = performance.now();
      const response = await fetch(`/api/orders?${params.toString()}`);
      const queryDuration = performance.now() - queryStartTime;

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch orders");
      }

      const data = await response.json();
      const duration = performance.now() - startTime;
      
      console.log(`[OrderService] Orders fetched successfully in ${duration.toFixed(2)}ms`, {
        total: data.total,
        returned: data.orders.length,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
        queryDuration: `${queryDuration.toFixed(2)}ms`,
      });

      return {
        orders: data.orders,
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
      };
    } catch (error: any) {
      const duration = performance.now() - startTime;
      console.error(`[OrderService] Error fetching orders after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  },

  // Get all orders (backward compatibility)
  async getAllOrders(): Promise<Order[]> {
    try {
      const result = await this.getOrders(
        { itemId: "", itemName: "", clientName: "", timeRange: "all" },
        { page: 1, pageSize: 1000 }
      );
      return result.orders as Order[];
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  },

  // Update an order
  async updateOrder(orderId: string, orderData: Partial<OrderFormData>): Promise<void> {
    const startTime = performance.now();
    console.log("[OrderService] Updating order...", { orderId, orderData });
    
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update order");
      }

      const duration = performance.now() - startTime;
      console.log(`[OrderService] Order updated successfully in ${duration.toFixed(2)}ms`, {
        orderId,
        duration: `${duration.toFixed(2)}ms`,
      });
    } catch (error: any) {
      const duration = performance.now() - startTime;
      console.error(`[OrderService] Error updating order after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  },

  // Delete an order
  async deleteOrder(orderId: string): Promise<void> {
    const startTime = performance.now();
    console.log("[OrderService] Deleting order...", { orderId });
    
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        const duration = performance.now() - startTime;
        console.error(`[OrderService] Error deleting order after ${duration.toFixed(2)}ms:`, {
          orderId,
          status: response.status,
          error: error.error,
        });
        throw new Error(error.error || "Failed to delete order");
      }

      const duration = performance.now() - startTime;
      console.log(`[OrderService] Order deleted successfully in ${duration.toFixed(2)}ms`, {
        orderId,
        duration: `${duration.toFixed(2)}ms`,
      });
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[OrderService] Error deleting order after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  },

  // Get all unique client names
  async getClientNames(): Promise<string[]> {
    try {
      const response = await fetch("/api/orders/filter-options");
      if (!response.ok) {
        throw new Error("Failed to fetch client names");
      }
      const data = await response.json();
      return data.clientNames || [];
    } catch (error) {
      console.error("Error fetching client names:", error);
      throw error;
    }
  },

  // Get all unique item IDs
  async getItemIds(): Promise<string[]> {
    try {
      const response = await fetch("/api/orders/filter-options");
      if (!response.ok) {
        throw new Error("Failed to fetch item IDs");
      }
      const data = await response.json();
      return data.itemIds || [];
    } catch (error) {
      console.error("Error fetching item IDs:", error);
      throw error;
    }
  },

  // Get all unique item names
  async getItemNames(): Promise<string[]> {
    try {
      const response = await fetch("/api/orders/filter-options");
      if (!response.ok) {
        throw new Error("Failed to fetch item names");
      }
      const data = await response.json();
      return data.itemNames || [];
    } catch (error) {
      console.error("Error fetching item names:", error);
      throw error;
    }
  },

  // Get summary data
  async getSummary(filters: OrderFilters): Promise<{
    summaryByItem: Array<{ itemId: string; itemName: string; totalStock: number }>;
    summaryByClientItem: Array<{ client: string; itemId: string; itemName: string; totalStock: number }>;
    totalOrders: number;
  }> {
    try {
      const params = new URLSearchParams({
        itemId: filters.itemId,
        itemName: filters.itemName,
        clientName: filters.clientName,
        timeRange: filters.timeRange,
      });

      const response = await fetch(`/api/orders/summary?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch summary");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching summary:", error);
      throw error;
    }
  },
};
