"use client";

import { useState } from "react";
import { FaFileArchive } from "react-icons/fa";
import Snackbar from "./Snackbar";

export default function Settings() {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    type: "success",
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setSnackbar({
        isOpen: true,
        message: "All fields are required",
        type: "error",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setSnackbar({
        isOpen: true,
        message: "New password must be at least 6 characters long",
        type: "error",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSnackbar({
        isOpen: true,
        message: "New passwords do not match",
        type: "error",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setSnackbar({
        isOpen: true,
        message: "Password changed successfully!",
        type: "success",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowChangePassword(false);
    } catch (error: any) {
      setSnackbar({
        isOpen: true,
        message: error.message || "Failed to change password",
        type: "error",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleArchiveData = async () => {
    setArchiving(true);
    try {
      const response = await fetch("/api/archive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to archive data");
      }

      setSnackbar({
        isOpen: true,
        message: `Successfully archived ${data.archivedCount} records. The application will now only show new data.`,
        type: "success",
      });
      setShowArchiveConfirm(false);
    } catch (error: any) {
      setSnackbar({
        isOpen: true,
        message: error.message || "Failed to archive data",
        type: "error",
      });
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50">Settings</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">Manage application settings and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Change Password Section */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50">Change Password</h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
                Update your account password
              </p>
            </div>
            {!showChangePassword && (
              <button
                onClick={() => setShowChangePassword(true)}
                className="cursor-pointer rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
              >
                Change Password
              </button>
            )}
          </div>

          {showChangePassword && (
            <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                  minLength={6}
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Must be at least 6 characters long
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-black dark:text-zinc-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="cursor-pointer rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changingPassword ? "Changing..." : "Update Password"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  className="cursor-pointer rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Archive Data Section */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50">Archive Data</h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
                Archive all past data. Once archived, only new data will be visible in the application.
                <br />
                <span className="text-orange-600 dark:text-orange-400 font-medium">
                  Warning: This action cannot be undone. All orders, billings, inventory, and issue logs created before now will be archived.
                </span>
              </p>
            </div>
          </div>

          {!showArchiveConfirm ? (
            <button
              onClick={() => setShowArchiveConfirm(true)}
              className="cursor-pointer flex items-center gap-2 rounded-md border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
            >
              <FaFileArchive className="text-base" />
              Archive All Past Data
            </button>
          ) : (
            <div className="space-y-4 mt-4">
              <div className="rounded-md border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 p-4">
                <p className="text-sm text-orange-800 dark:text-orange-200 font-medium mb-2">
                  Are you sure you want to archive all past data?
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  This will archive all orders, billings, inventory records, and issue logs created before this moment.
                  The application will only show data created after archiving. This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleArchiveData}
                  disabled={archiving}
                  className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {archiving ? "Archiving..." : "Confirm Archive"}
                </button>
                <button
                  onClick={() => setShowArchiveConfirm(false)}
                  disabled={archiving}
                  className="cursor-pointer rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        isOpen={snackbar.isOpen}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
      />
    </div>
  );
}

