"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import NavHeader from "@/components/NavHeader";
import Footer from "@/components/Footer";
import ProfileModal from "@/components/ProfileModal";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <Sidebar />
      
      <div className="flex flex-col flex-1 lg:ml-64">
        <NavHeader 
          userEmail={user?.email || ""} 
          onLogout={logout}
          onProfileClick={() => setShowProfile(true)}
        />
        <main className="flex-1 px-4 sm:px-6 py-4 sm:py-8 lg:px-8 w-full overflow-x-hidden">
          {children}
        </main>
        <Footer />
      </div>

      {showProfile && user && (
        <ProfileModal 
          userEmail={user.email} 
          onClose={() => setShowProfile(false)} 
        />
      )}
    </div>
  );
}

