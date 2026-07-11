"use client";

import React, { useState } from "react";
import { apiFetch } from "@/lib/api";

interface ImportJob {
  id: string;
  fileName: string;
  status: string;
  totalRows: number;
  processedRows: number;
  skippedRows: number;
  createdAt: string;
}

interface ImportHistoryProps {
  jobs: ImportJob[];
  onView: (jobId: string, fileName: string) => void;
  onDeleted: () => void;
  onError: (message: string) => void;
}

export default function ImportHistory({ jobs, onView, onDeleted, onError }: ImportHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this import job and all associated leads?")) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await apiFetch(`/api/v1/import/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete import job.");
      }

      onDeleted();
    } catch (err: any) {
      onError(err.message || "An error occurred while deleting the job.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "b-good";
      case "PROCESSING":
        return "b-sale";
      case "PENDING":
        return "b-dnc";
      case "FAILED":
        return "b-bad";
      default:
        return "b-default";
    }
  };

  return (
    <div className="card animate-fade-in">
      <h3 className="card-title" style={{ fontSize: "18px", marginBottom: "16px" }}>Import History</h3>

      {jobs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ink-soft)" }}>
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ marginBottom: "8px", color: "var(--ink-muted)" }}
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <p style={{ fontSize: "14px" }}>No previous imports found.</p>
          <p style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "4px" }}>
            Upload a CSV above to start your first CRM mapping.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {jobs.map((job) => (
            <div
              key={job.id}
              className="history-item"
              onClick={() => job.status === "COMPLETED" && onView(job.id, job.fileName)}
              style={{ cursor: job.status === "COMPLETED" ? "pointer" : "default" }}
            >
              <div className="history-info">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="history-title">{job.fileName}</span>
                  <span className={`badge ${getStatusBadgeClass(job.status)}`} style={{ fontSize: "9px", padding: "2px 8px" }}>
                    {job.status}
                  </span>
                </div>
                <div className="history-meta">
                  <span>{formatDate(job.createdAt)}</span>
                  <span>
                    Rows: {job.totalRows} (Success: {job.processedRows}, Skipped: {job.skippedRows})
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {job.status === "COMPLETED" && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(job.id, job.fileName);
                    }}
                  >
                    View Leads
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: "6px 10px", fontSize: "12px" }}
                  disabled={deletingId === job.id}
                  onClick={(e) => handleDelete(e, job.id)}
                >
                  {deletingId === job.id ? (
                    <div className="spinner" style={{ width: "12px", height: "12px", borderWidth: "1.5px" }} />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
