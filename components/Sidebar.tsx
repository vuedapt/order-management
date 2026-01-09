"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiDashboardFill, RiBillFill } from "react-icons/ri";
import { MdInventory } from "react-icons/md";
import { FaBars, FaTimes } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { IoIosListBox } from "react-icons/io";

export default function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    {
      id: "dashboard" as const,
      label: "Dashboard",
      icon: RiDashboardFill,
      href: "/dashboard",
    },
    {
      id: "orders" as const,
      label: "Order Management",
      icon: IoIosListBox,
      href: "/orders",
    },
    {
      id: "stock" as const,
      label: "Inventory Management",
      icon: MdInventory,
      href: "/stock",
    },
    {
      id: "billing" as const,
      label: "Billing Management",
      icon: RiBillFill,
      href: "/billing",
    },
    {
      id: "settings" as const,
      label: "Settings",
      icon: FaGear,
      href: "/settings",
    },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all duration-200"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center gap-2 p-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="p-2 rounded-md bg-teal-50 dark:bg-teal-900/20 text-teal-500 text-2xl">
              <RiDashboardFill />
            </div>
            <div>
              <h2 className="text-lg font-bold text-black dark:text-zinc-50">Shree Fashion</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Admin Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/");
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-teal-500 text-white"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icon className="text-lg" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}

