"use client";

import { useState } from "react";
import { MdError, MdCheckCircle, MdClose } from "react-icons/md";
import { FaChevronDown } from "react-icons/fa6";

export interface Issue {
  id: string;
  row: number;
  itemId: string;
  error: string;
  timestamp: Date;
  resolved: boolean;
}

interface IssueLogProps {
  issues: Issue[];
  onResolve: (id: string) => void;
  onDismiss: (id: string) => void;
}

export default function IssueLog({ issues, onResolve, onDismiss }: IssueLogProps) {
  const [expanded, setExpanded] = useState(true);
  const unresolvedIssues = issues.filter((issue) => !issue.resolved);

  if (unresolvedIssues.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <MdError className="text-xl text-red-600 dark:text-red-400 flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-semibold text-red-800 dark:text-red-200 truncate">
            Issue Log ({unresolvedIssues.length} unresolved)
          </h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className={`text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        >
          <FaChevronDown className="text-lg" />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-red-200 dark:border-red-800">
          <div className="max-h-64 overflow-y-auto">
            {unresolvedIssues.map((issue) => (
              <div
                key={issue.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-red-200 dark:border-red-800 last:border-b-0 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <MdError className="text-lg text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">
                      Row {issue.row}
                    </span>
                    {issue.itemId && (
                      <span className="text-xs text-red-600 dark:text-red-400">
                        (Item: {issue.itemId})
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 break-words">{issue.error}</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {new Date(issue.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 justify-end sm:justify-start">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onResolve(issue.id);
                    }}
                    className="cursor-pointer rounded-md bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 transition-all duration-200 whitespace-nowrap"
                    title="Mark as resolved"
                  >
                    Mark as resolved
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss(issue.id);
                    }}
                    className="cursor-pointer rounded-md p-1.5 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                    title="Dismiss"
                  >
                    <MdClose className="text-lg" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

