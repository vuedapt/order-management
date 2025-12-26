"use client";

interface PageHeaderProps {
  title: string;
  leftButton?: {
    label: string;
    onClick: () => void;
    show?: boolean;
  };
  rightButton?: {
    label: string;
    onClick: () => void;
    show?: boolean;
  };
  // Legacy support
  actionButton?: {
    label: string;
    onClick: () => void;
    show?: boolean;
  };
}

export default function PageHeader({ 
  title, 
  leftButton, 
  rightButton,
  actionButton 
}: PageHeaderProps) {
  // Legacy support: if actionButton is provided, use it as rightButton
  const finalRightButton = rightButton || actionButton;
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-zinc-50 truncate">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
      {leftButton && leftButton.show !== false && (
          <button
            onClick={leftButton.onClick}
            className="cursor-pointer rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 sm:px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 whitespace-nowrap"
          >
            {leftButton.label}
          </button>
        )}
      {finalRightButton && finalRightButton.show !== false && (
        <button
          onClick={finalRightButton.onClick}
          className="cursor-pointer rounded-md bg-teal-500 px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 whitespace-nowrap"
        >
          {finalRightButton.label}
        </button>
      )}
      </div>
    </div>
  );
}

