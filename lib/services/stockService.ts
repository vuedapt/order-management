export interface StockItem {
  id: string;
  itemId: string;
  itemName: string;
  stockCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StockFormData {
  itemId: string;
  itemName: string;
  stockCount: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface StockFilters {
  itemId: string;
  itemName: string;
}

export interface StockListResponse {
  stocks: StockItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const stockService = {
  // Get all stock items with pagination and filters
  async getStocks(pagination?: PaginationParams, filters?: StockFilters): Promise<StockListResponse> {
    try {
      const params = new URLSearchParams();
      if (pagination) {
        params.append("page", pagination.page.toString());
        params.append("pageSize", pagination.pageSize.toString());
      }
      if (filters) {
        if (filters.itemId) {
          params.append("itemId", filters.itemId);
        }
        if (filters.itemName) {
          params.append("itemName", filters.itemName);
        }
      }
      
      const url = `/api/stock${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch stock");
      }
      const data = await response.json();
      return {
        stocks: data.stocks,
        total: data.total || data.stocks.length,
        page: data.page || 1,
        pageSize: data.pageSize || 10,
        totalPages: data.totalPages || 1,
      };
    } catch (error) {
      console.error("Error fetching stock:", error);
      throw error;
    }
  },

  // Create a new stock item
  async createStock(stockData: StockFormData): Promise<string> {
    try {
      const response = await fetch("/api/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stockData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create stock item");
      }

      const stock = await response.json();
      return stock.id;
    } catch (error) {
      console.error("Error creating stock:", error);
      throw error;
    }
  },

  // Update a stock item
  async updateStock(id: string, stockData: StockFormData): Promise<void> {
    try {
      const response = await fetch(`/api/stock/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stockData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update stock item");
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      throw error;
    }
  },

  // Delete a stock item
  async deleteStock(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/stock/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete stock item");
      }
    } catch (error) {
      console.error("Error deleting stock:", error);
      throw error;
    }
  },

  // Get stock summary
  async getSummary(filters: { itemId: string; itemName: string }): Promise<{
    stocks: Array<{ itemId: string; itemName: string; stockCount: number }>;
    totalItems: number;
    totalStockCount: number;
  }> {
    try {
      const params = new URLSearchParams({
        itemId: filters.itemId || "",
        itemName: filters.itemName || "",
      });

      const response = await fetch(`/api/stock/summary?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch stock summary");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching stock summary:", error);
      throw error;
    }
  },
};

