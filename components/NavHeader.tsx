"use client";

interface NavHeaderProps {
  userEmail: string;
  onLogout: () => void;
  onProfileClick?: () => void;
}

export default function NavHeader({
  userEmail,
  onLogout,
  onProfileClick,
}: NavHeaderProps) {
  return (
    <nav className="border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-end gap-4">
          <button
            onClick={onProfileClick}
            className="cursor-pointer text-sm text-zinc-600 dark:text-zinc-400 hover:text-teal-500 dark:hover:text-teal-400 transition-all duration-200 truncate max-w-[200px]"
            title={userEmail}
          >
            {userEmail}
          </button>
          <button
            onClick={onLogout}
            className="cursor-pointer rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
