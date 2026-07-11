"use client";

import React from "react";

interface PreviewTableProps {
  rows: any[];
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PreviewTable({ rows, fileName, onConfirm, onCancel }: PreviewTableProps) {
  if (!rows || rows.length === 0) return null;

  // Extract all unique headers across all rows in case some records have partial fields
  const headers = Array.from(
    new Set(rows.reduce((acc: string[], row) => [...acc, ...Object.keys(row)], []))
  );

  return (
    <div className="animate-fade-in">
      <div className="head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--ink)" }}>File Preview: {fileName}</h2>
          <p style={{ margin: "4px 0 0", color: "var(--ink-soft)", fontSize: "14px" }}>
            Reviewing {rows.length} rows before running the AI mapping pipeline.
          </p>
        </div>
        <div className="stats" style={{ display: "flex", gap: "10px" }}>
          <div className="stat" style={{
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            padding: "8px 16px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--ink)" }}>{rows.length}</div>
            <div style={{ fontSize: "11px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: ".04em" }}>Total Rows</div>
          </div>
        </div>
      </div>

      <div className="banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <span>Preview only — no AI mapping or data extraction has been run yet. Press &quot;Confirm Import&quot; to begin.</span>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: "60px", textAlign: "center" }}>#</th>
                {headers.map((header) => {
                  const isFirstCol = header === headers[0];
                  return (
                    <th
                      key={header}
                      className={isFirstCol ? "sticky-col" : ""}
                      style={{ minWidth: "160px" }}
                    >
                      {header}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: "center", color: "var(--ink-muted)", fontVariantNumeric: "tabular-nums" }}>
                    {idx + 1}
                  </td>
                  {headers.map((header) => {
                    const isFirstCol = header === headers[0];
                    const val = row[header];
                    const isMuted = val === null || val === undefined || val === "";

                    return (
                      <td
                        key={header}
                        className={isFirstCol ? "sticky-col" : ""}
                        title={val?.toString() || ""}
                      >
                        {isMuted ? (
                          <span className="text-muted">—</span>
                        ) : (
                          val?.toString()
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="footer-info">
          Showing {rows.length} of {rows.length} rows detected in file.
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel & Back
        </button>
        <button type="button" className="btn btn-primary" onClick={onConfirm}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Confirm Import
        </button>
      </div>
    </div>
  );
}
