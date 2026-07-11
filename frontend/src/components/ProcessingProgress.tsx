"use client";

import React from "react";

interface ProcessingProgressProps {
  status: string;
  totalRows: number;
  processedRows: number;
  skippedRows: number;
  progressPercent: number;
  fileName: string;
  error?: string | null;
}

export default function ProcessingProgress({
  status,
  totalRows,
  processedRows,
  skippedRows,
  progressPercent,
  fileName,
  error,
}: ProcessingProgressProps) {
  const isFailed = status === "FAILED";
  const displayPercent = isFailed ? 0 : Math.min(Math.max(progressPercent, 0), 100);

  // SVG parameters for circular progress
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayPercent / 100) * circumference;

  return (
    <div className="card animate-fade-in" style={{ padding: "40px 24px", textAlign: "center" }}>
      <div style={{ marginBottom: "24px" }}>
        <span className="badge b-sale" style={{ marginBottom: "12px" }}>
          AI EXTRACTION ACTIVE
        </span>
        <h3 className="card-title" style={{ fontSize: "22px", marginBottom: "4px" }}>
          Processing Lead Data
        </h3>
        <p className="card-description" style={{ marginBottom: 0 }}>
          AI is analyzing structure, mapping columns, and clean-formatting records from <strong>{fileName}</strong>.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", margin: "24px 0" }}>
        {isFailed ? (
          <div
            className="upload-icon"
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              backgroundColor: "var(--bad-bg)",
              color: "var(--bad)",
              margin: 0,
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        ) : (
          <div className="progress-ring">
            <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
              {/* Background Circle */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="var(--accent-soft)"
                strokeWidth={strokeWidth}
              />
              {/* Progress Circle */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="var(--accent)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.3s ease" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="progress-ring-value">{displayPercent}%</span>
              <span style={{ fontSize: "11px", color: "var(--ink-soft)", fontWeight: 600, textTransform: "uppercase" }}>
                Progress
              </span>
            </div>
          </div>
        )}
      </div>

      {isFailed ? (
        <div className="banner banner-warning" style={{ margin: "20px auto", maxWidth: "480px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 700 }}>Extraction Failed</div>
            <div style={{ fontSize: "13px", marginTop: "2px" }}>
              {error || "An error occurred inside the backend AI pipeline."}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Animated Log Subtext */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} />
            <span style={{ fontSize: "14px", color: "var(--ink)", fontWeight: 500 }}>
              {status === "PENDING"
                ? "Queueing rows for processing..."
                : `Mapping rows ${processedRows + skippedRows} of ${totalRows || "?"}...`}
            </span>
          </div>

          {/* Stats Bar */}
          <div className="stats-grid" style={{ maxWidth: "480px", width: "100%", gridTemplateColumns: "1fr 1fr" }}>
            <div className="stat-card" style={{ padding: "12px 16px", alignItems: "center" }}>
              <span className="stat-val" style={{ fontSize: "20px", color: "var(--good)" }}>
                {processedRows}
              </span>
              <span className="stat-lbl" style={{ fontSize: "10px" }}>
                Success Mapped
              </span>
            </div>
            <div className="stat-card" style={{ padding: "12px 16px", alignItems: "center" }}>
              <span className="stat-val" style={{ fontSize: "20px", color: "var(--bad)" }}>
                {skippedRows}
              </span>
              <span className="stat-lbl" style={{ fontSize: "10px" }}>
                Skipped Rows
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
