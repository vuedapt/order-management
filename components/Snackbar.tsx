"use client";

import { useEffect } from "react";
import { MdCheckCircle, MdError, MdClose } from "react-icons/md";

interface SnackbarProps {
  message: string;
  type: "success" | "error";
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Snackbar({
  message,
  type,
  isOpen,
  onClose,
  duration = 4000,
}: SnackbarProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div
        className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg min-w-[300px] max-w-md ${
          type === "success"
            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
            : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
        }`}
      >
        <div
          className={`flex-shrink-0 ${
            type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {type === "success" ? (
            <MdCheckCircle className="text-xl" />
          ) : (
            <MdError className="text-xl" />
          )}
        </div>
        <p
          className={`flex-1 text-sm font-medium ${
            type === "success"
              ? "text-green-800 dark:text-green-200"
              : "text-red-800 dark:text-red-200"
          }`}
        >
          {message}
        </p>
        <button
          onClick={onClose}
          className={`flex-shrink-0 rounded p-1 transition-colors ${
            type === "success"
              ? "text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/40"
              : "text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40"
          }`}
        >
          <MdClose className="text-lg" />
        </button>
      </div>
    </div>
  );
}

