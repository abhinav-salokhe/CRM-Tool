"use client";

import React, { useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

interface UploadZoneProps {
  onUploadSuccess: (rows: any[], fileName: string) => void;
  onError: (message: string) => void;
}

export default function UploadZone({ onUploadSuccess, onError }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      onError("Invalid file type. Please upload a valid CSV file.");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await apiFetch("/api/v1/simple-parse", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to parse the CSV file.");
      }

      if (!result.data || result.data.length === 0) {
        throw new Error("The uploaded CSV file appears to be empty.");
      }

      onUploadSuccess(result.data, selectedFile.name);
    } catch (err: any) {
      onError(err.message || "An error occurred while uploading and parsing the CSV.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-fade-in" style={{ padding: "32px" }}>
      <h3 className="card-title" style={{ fontSize: "20px", marginBottom: "6px" }}>Upload CRM Lead CSV</h3>
      <p className="card-description">
        Drag & drop any CSV layout (Facebook Lead Export, Google Ads, custom spreadsheets).
        Our AI mapping model will identify the fields dynamically.
      </p>

      <div
        className={`upload-zone ${dragActive ? "upload-zone-active" : ""}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        style={{ minHeight: "220px", marginBottom: "20px" }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          style={{ display: "none" }}
          accept=".csv"
          onChange={handleChange}
        />

        <div className="upload-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
        </div>

        {selectedFile ? (
          <div>
            <p className="upload-title" style={{ color: "var(--accent)" }}>
              {selectedFile.name}
            </p>
            <p className="upload-subtitle" style={{ marginTop: "4px" }}>
              {(selectedFile.size / 1024).toFixed(2)} KB • Click or drag another file to replace
            </p>
          </div>
        ) : (
          <div>
            <p className="upload-title">Drag & drop your CSV file here</p>
            <p className="upload-subtitle" style={{ marginTop: "4px" }}>
              or click to browse local files
            </p>
          </div>
        )}
      </div>

      {selectedFile && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSelectedFile(null)}
            disabled={loading}
          >
            Clear
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={loading}
            style={{ minWidth: "120px" }}
          >
            {loading ? (
              <div className="spinner" style={{ width: "18px", height: "18px", borderWidth: "2px" }} />
            ) : (
              "Parse & Preview"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
