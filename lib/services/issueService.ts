import { Issue } from "@/components/IssueLog";

export const issueService = {
  // Get all unresolved issues
  async getIssues(): Promise<Issue[]> {
    try {
      const response = await fetch("/api/issues");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch issues");
      }
      const data = await response.json();
      return data.issues.map((issue: any) => ({
        id: issue.id,
        row: issue.row,
        itemId: issue.itemId,
        error: issue.error,
        timestamp: new Date(issue.timestamp),
        resolved: issue.resolved,
      }));
    } catch (error) {
      console.error("Error fetching issues:", error);
      throw error;
    }
  },

  // Create a new issue
  async createIssue(issueData: {
    row: number;
    itemId?: string;
    error: string;
  }): Promise<Issue> {
    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issueData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create issue");
      }

      const issue = await response.json();
      return {
        id: issue.id,
        row: issue.row,
        itemId: issue.itemId,
        error: issue.error,
        timestamp: new Date(issue.timestamp),
        resolved: issue.resolved,
      };
    } catch (error) {
      console.error("Error creating issue:", error);
      throw error;
    }
  },

  // Mark issue as resolved
  async resolveIssue(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/issues/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resolved: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to resolve issue");
      }
    } catch (error) {
      console.error("Error resolving issue:", error);
      throw error;
    }
  },

  // Delete issue
  async deleteIssue(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/issues/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete issue");
      }
    } catch (error) {
      console.error("Error deleting issue:", error);
      throw error;
    }
  },
};

