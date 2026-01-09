"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  RiNumbersFill,
  RiMoneyDollarCircleFill,
} from "react-icons/ri";
import { IoIosListBox } from "react-icons/io";
import { MdInventory } from "react-icons/md";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

const PIE_COLORS = {
  completed: "#10b981",
  partially_completed: "#f59e0b",
  uncompleted: "#ef4444",
};

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/stats?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error("Failed to load statistics");
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-zinc-600 dark:text-zinc-400">Loading dashboard...</p>
      </div>
    );
  }

  // Prepare pie chart data
  const orderStatusData = [
    { name: "Completed", value: stats.orderStatusDistribution.completed, color: PIE_COLORS.completed },
    { name: "Partially Completed", value: stats.orderStatusDistribution.partially_completed, color: PIE_COLORS.partially_completed },
    { name: "Uncompleted", value: stats.orderStatusDistribution.uncompleted, color: PIE_COLORS.uncompleted },
  ].filter((item) => item.value > 0);

  const statCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: IoIosListBox,
      color: "bg-blue-500",
    },
    {
      title: "Total Revenue",
      value: `LKR ${stats.totalRevenue.toLocaleString()}`,
      icon: RiMoneyDollarCircleFill,
      color: "bg-green-500",
    },
    {
      title: "Stock Items",
      value: stats.totalInventoryItems,
      icon: MdInventory,
      color: "bg-teal-500",
    },
    {
      title: "Total Stock Count",
      value: stats.totalStockCount,
      icon: RiNumbersFill,
      color: "bg-purple-500",
    },
  ];

  // Format dates for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">Dashboard</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">Welcome to Shree Fashion Admin Panel</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Time Range:
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="appearance-none cursor-pointer rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="1m">Last Month</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{card.title}</p>
                  <p className="text-3xl font-bold text-black dark:text-zinc-50 mt-2">
                    {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg text-white`}>
                  <Icon className="text-2xl" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Over Time - Line Chart */}
        {stats.ordersOverTime.length > 0 && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
              Orders Over Time
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.ordersOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 10 }}
                  className="text-zinc-600 dark:text-zinc-400"
                />
                <YAxis tick={{ fontSize: 10 }} className="text-zinc-600 dark:text-zinc-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--tooltip-bg, white)",
                    border: "1px solid var(--tooltip-border, #e4e4e7)",
                    borderRadius: "6px",
                    color: "var(--tooltip-text, black)",
                    fontSize: "10px",
                  }}
                  labelStyle={{ fontSize: "10px" }}
                  itemStyle={{ fontSize: "10px" }}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Orders"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Order Status Distribution - Pie Chart */}
        {orderStatusData.length > 0 && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
              Order Status Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => (
                    <text
                      x={0}
                      y={0}
                      fontSize="9px"
                      fill="currentColor"
                      textAnchor="middle"
                    >
                      {`${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    </text>
                  )}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: "10px" }}
                  labelStyle={{ fontSize: "10px" }}
                  itemStyle={{ fontSize: "10px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue Over Time - Area Chart */}
        {stats.revenueOverTime.length > 0 && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
              Revenue Over Time
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  className="text-xs text-zinc-600 dark:text-zinc-400"
                />
                <YAxis className="text-xs text-zinc-600 dark:text-zinc-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--tooltip-bg, white)",
                    border: "1px solid var(--tooltip-border, #e4e4e7)",
                    borderRadius: "6px",
                    color: "var(--tooltip-text, black)",
                  }}
                  labelFormatter={(label) => formatDate(label)}
                  formatter={(value: number | undefined) => `LKR ${(value || 0).toLocaleString()}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Billing Trends - Line Chart */}
        {stats.billingTrends.length > 0 && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
              Billing Trends
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.billingTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 10 }}
                  className="text-zinc-600 dark:text-zinc-400"
                />
                <YAxis tick={{ fontSize: 10 }} className="text-zinc-600 dark:text-zinc-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--tooltip-bg, white)",
                    border: "1px solid var(--tooltip-border, #e4e4e7)",
                    borderRadius: "6px",
                    color: "var(--tooltip-text, black)",
                    fontSize: "10px",
                  }}
                  labelStyle={{ fontSize: "10px" }}
                  itemStyle={{ fontSize: "10px" }}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Billing Count"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Revenue"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Items and Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items by Quantity - Bar Chart */}
        {stats.topItemsByQuantity.length > 0 && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
              Top Items by Quantity Ordered
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.topItemsByQuantity}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                <XAxis type="number" tick={{ fontSize: 10 }} className="text-zinc-600 dark:text-zinc-400" />
                <YAxis
                  dataKey="itemName"
                  type="category"
                  width={90}
                  tick={{ fontSize: 9 }}
                  className="text-zinc-600 dark:text-zinc-400"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--tooltip-bg, white)",
                    border: "1px solid var(--tooltip-border, #e4e4e7)",
                    borderRadius: "6px",
                    color: "var(--tooltip-text, black)",
                    fontSize: "10px",
                  }}
                  labelStyle={{ fontSize: "10px" }}
                  itemStyle={{ fontSize: "10px" }}
                />
                <Bar dataKey="quantity" fill="#3b82f6" name="Quantity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Items by Revenue - Bar Chart */}
        {stats.topItemsByRevenue.length > 0 && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
              Top Items by Revenue
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.topItemsByRevenue}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 9 }}
                  className="text-zinc-600 dark:text-zinc-400"
                  tickFormatter={(value) => `LKR ${value.toLocaleString()}`}
                />
                <YAxis
                  dataKey="itemName"
                  type="category"
                  width={90}
                  tick={{ fontSize: 9 }}
                  className="text-zinc-600 dark:text-zinc-400"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--tooltip-bg, white)",
                    border: "1px solid var(--tooltip-border, #e4e4e7)",
                    borderRadius: "6px",
                    color: "var(--tooltip-text, black)",
                    fontSize: "9px",
                  }}
                  labelStyle={{ fontSize: "9px" }}
                  itemStyle={{ fontSize: "9px" }}
                  formatter={(value: number | undefined) => `LKR ${(value || 0).toLocaleString()}`}
                />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Clients by Orders - Bar Chart */}
        {stats.topClientsByOrders.length > 0 && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
              Top Clients by Orders
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.topClientsByOrders}
                margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                <XAxis
                  dataKey="client"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 9 }}
                  className="text-zinc-600 dark:text-zinc-400"
                />
                <YAxis tick={{ fontSize: 10 }} className="text-zinc-600 dark:text-zinc-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--tooltip-bg, white)",
                    border: "1px solid var(--tooltip-border, #e4e4e7)",
                    borderRadius: "6px",
                    color: "var(--tooltip-text, black)",
                    fontSize: "10px",
                  }}
                  labelStyle={{ fontSize: "10px" }}
                  itemStyle={{ fontSize: "10px" }}
                />
                <Bar dataKey="count" fill="#8b5cf6" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Clients by Revenue - Bar Chart */}
        {stats.topClientsByRevenue.length > 0 && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
              Top Clients by Revenue
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.topClientsByRevenue}
                margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                <XAxis
                  dataKey="client"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 9 }}
                  className="text-zinc-600 dark:text-zinc-400"
                />
                <YAxis
                  tick={{ fontSize: 9 }}
                  className="text-zinc-600 dark:text-zinc-400"
                  tickFormatter={(value) => `LKR ${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--tooltip-bg, white)",
                    border: "1px solid var(--tooltip-border, #e4e4e7)",
                    borderRadius: "6px",
                    color: "var(--tooltip-text, black)",
                    fontSize: "9px",
                  }}
                  labelStyle={{ fontSize: "9px" }}
                  itemStyle={{ fontSize: "9px" }}
                  formatter={(value: number | undefined) => `LKR ${(value || 0).toLocaleString()}`}
                />
                <Bar dataKey="revenue" fill="#f59e0b" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
