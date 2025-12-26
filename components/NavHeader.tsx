"use client";

import { useState } from "react";
import { RiDashboardFill } from "react-icons/ri";

interface NavHeaderProps {
  title?: string;
  userEmail: string;
  onLogout: () => void;
  onProfileClick?: () => void;
  currentPage?: "orders" | "stock";
  onPageChange?: (page: "orders" | "stock") => void;
}

export default function NavHeader({
  title = "Shree Fashion",
  userEmail,
  onLogout,
  onProfileClick,
  currentPage = "orders",
  onPageChange,
}: NavHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get short email for mobile display
  const shortEmail = userEmail.length > 15 ? userEmail.substring(0, 12) + "..." : userEmail;

  return (
    <nav className="border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex gap-2 items-center min-w-0 flex-1">
            <div className="p-2 rounded-md bg-teal-50 text-teal-500 text-xl sm:text-3xl flex-shrink-0">
              <RiDashboardFill />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-black dark:text-zinc-50 truncate">
                {title}
              </h1>
              <p className="hidden sm:block text-xs text-zinc-400">Order Management System</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {onPageChange && (
              <div className="flex gap-2 border-r border-zinc-300 dark:border-zinc-700 pr-4">
                <button
                  onClick={() => onPageChange("orders")}
                  className={`cursor-pointer px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    currentPage === "orders"
                      ? "bg-teal-500 text-white"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-teal-500 dark:hover:text-teal-400"
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => onPageChange("stock")}
                  className={`cursor-pointer px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    currentPage === "stock"
                      ? "bg-teal-500 text-white"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-teal-500 dark:hover:text-teal-400"
                  }`}
                >
                  Stock
                </button>
              </div>
            )}
            <button
              onClick={onProfileClick}
              className="cursor-pointer text-sm text-zinc-600 dark:text-zinc-400 hover:text-teal-500 dark:hover:text-teal-400 transition-all duration-200 truncate max-w-[120px]"
              title={userEmail}
            >
              <span className="hidden lg:inline">{userEmail}</span>
              <span className="lg:hidden">{shortEmail}</span>
            </button>
            <button
              onClick={onLogout}
              className="cursor-pointer rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 sm:px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {onPageChange && (
              <div className="flex gap-1">
                <button
                  onClick={() => onPageChange("orders")}
                  className={`cursor-pointer px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    currentPage === "orders"
                      ? "bg-teal-500 text-white"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-teal-500 dark:hover:text-teal-400"
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => onPageChange("stock")}
                  className={`cursor-pointer px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    currentPage === "stock"
                      ? "bg-teal-500 text-white"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-teal-500 dark:hover:text-teal-400"
                  }`}
                >
                  Stock
                </button>
              </div>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="cursor-pointer p-2 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
              aria-label="Menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 py-4">
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  onProfileClick?.();
                  setIsMobileMenuOpen(false);
                }}
                className="cursor-pointer text-left text-sm text-zinc-600 dark:text-zinc-400 hover:text-teal-500 dark:hover:text-teal-400 transition-all duration-200 px-2 py-2"
              >
                Profile: {userEmail}
              </button>
              <button
                onClick={() => {
                  onLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="cursor-pointer text-left rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

