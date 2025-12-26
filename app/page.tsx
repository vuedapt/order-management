"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthForm from "@/components/AuthForm";
import OrderList from "@/components/OrderList";
import StockList from "@/components/StockList";
import NavHeader from "@/components/NavHeader";
import ProfileModal from "@/components/ProfileModal";
import Footer from "@/components/Footer";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [currentPage, setCurrentPage] = useState<"orders" | "stock">("orders");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <NavHeader 
        userEmail={user.email} 
        onLogout={logout}
        onProfileClick={() => setShowProfile(true)}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      <main className="mx-auto max-w-7xl flex-1 px-4 sm:px-6 py-4 sm:py-8 lg:px-8 w-full overflow-x-hidden">
        {currentPage === "orders" ? <OrderList /> : <StockList />}
      </main>
      <Footer />
      {showProfile && (
        <ProfileModal 
          userEmail={user.email} 
          onClose={() => setShowProfile(false)} 
        />
      )}
    </div>
  );
}
