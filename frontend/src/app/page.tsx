"use client";

import React, { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import AuthForm from "@/components/AuthForm";
import UploadZone from "@/components/UploadZone";
import PreviewTable from "@/components/PreviewTable";
import ProcessingProgress from "@/components/ProcessingProgress";
import ResultsDashboard from "@/components/ResultsDashboard";
import ImportHistory from "@/components/ImportHistory";
import { apiFetch, clearAuth, getStoredUsername } from "@/lib/api";

type WizardStep = "upload" | "preview" | "process" | "results";

interface ProgressInfo {
  status: string;
  totalRows: number;
  processedRows: number;
  skippedRows: number;
  progressPercent: number;
}

export default function Page() {
  // Auth states
  const [username, setUsername] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Wizard state
  const [step, setStep] = useState<WizardStep>("upload");
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importId, setImportId] = useState<string | null>(null);

  // Results & active import job status
  const [progressInfo, setProgressInfo] = useState<ProgressInfo>({
    status: "PENDING",
    totalRows: 0,
    processedRows: 0,
    skippedRows: 0,
    progressPercent: 0,
  });
  const [leads, setLeads] = useState<any[]>([]);
  const [skipped, setSkipped] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);

  // History list
  const [historyJobs, setHistoryJobs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Error banners
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);

  // Ref for polling interval to prevent memory leaks/multiple intervals
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // On mount: check session by listing history
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await apiFetch("/api/v1/import", {
        method: "GET",
      });

      if (response.status === 401) {
        clearAuth();
        setUsername(null);
      } else if (response.ok) {
        const jobs = await response.json();
        setHistoryJobs(jobs);
        const storedUser = getStoredUsername() || "Active User";
        setUsername(storedUser);
      }
    } catch (err) {
      console.error("Session check failed", err);
    } finally {
      setAuthChecked(true);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await apiFetch("/api/v1/import", {
        method: "GET",
      });
      if (response.ok) {
        const jobs = await response.json();
        setHistoryJobs(jobs);
      } else if (response.status === 401) {
        clearAuth();
        setUsername(null);
      }
    } catch (err) {
      console.error("Failed to load import history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAuthSuccess = (name: string) => {
    setUsername(name);
    loadHistory();
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/api/v1/user/logout", {
        method: "POST",
      });
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      clearAuth();
      setUsername(null);
      setStep("upload");
      // Reset wizard data
      setImportId(null);
      setParsedRows([]);
      setLeads([]);
      setSkipped([]);
    }
  };

  const handleUploadSuccess = (rows: any[], file: string) => {
    setParsedRows(rows);
    setFileName(file);
    setStep("preview");
    setBannerError(null);
  };

  const handleConfirmImport = async () => {
    setBannerError(null);
    setProcessError(null);
    try {
      // Step A: Initialize Import Job on Backend
      const initResponse = await apiFetch("/api/v1/import/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          rawJsonRows: parsedRows,
        }),
      });

      const initResult = await initResponse.json();
      if (!initResponse.ok || !initResult.importId) {
        throw new Error(initResult.error || "Failed to initialize import job.");
      }

      const activeImportId = initResult.importId;
      setImportId(activeImportId);

      // Step B: Start processing
      const processResponse = await apiFetch(`/api/v1/import/${activeImportId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawJsonRows: parsedRows,
        }),
      });

      const processResult = await processResponse.json();
      if (!processResponse.ok) {
        throw new Error(processResult.error || "Failed to start AI processing pipeline.");
      }

      // Step C: Update state & initiate polling
      setStep("process");
      setProgressInfo({
        status: "PROCESSING",
        totalRows: parsedRows.length,
        processedRows: 0,
        skippedRows: 0,
        progressPercent: 0,
      });

      startPolling(activeImportId);
    } catch (err: any) {
      setBannerError(err.message || "Failed to initialize the import pipeline.");
    }
  };

  const startPolling = (jobId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(() => {
      pollJobStatus(jobId);
    }, 1200); // Poll status every 1.2 seconds
  };

  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await apiFetch(`/api/v1/import/${jobId}/status`, {
        method: "GET",
      });

      if (!response.ok) {
        if (response.status === 401) {
          stopPolling();
          setUsername(null);
          return;
        }
        throw new Error("Failed to fetch import job status.");
      }

      const statusResult = await response.json();
      setProgressInfo(statusResult);

      if (statusResult.status === "COMPLETED") {
        stopPolling();
        // Fetch leads & skipped records
        fetchImportResults(jobId);
      } else if (statusResult.status === "FAILED") {
        stopPolling();
        setProcessError(statusResult.error || "AI background job processing failed.");
      }
    } catch (err: any) {
      console.error(err);
      // We don't stop polling immediately on standard fetch failure in case of brief network drops
    }
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const fetchImportResults = async (jobId: string) => {
    try {
      const response = await apiFetch(`/api/v1/import/${jobId}/summary`);

      if (!response.ok) {
        throw new Error("Failed to load processed leads results.");
      }

      const data = await response.json();

      setSummaryData(data);
      setLeads(data.parsedRecords || []);
      setSkipped(data.skippedRecords || []);
      setStep("results");
      loadHistory(); // Refresh history log list
    } catch (err: any) {
      setBannerError(err.message || "Failed to load results dashboard.");
      setStep("upload");
    }
  };

  const handleViewHistoricalJob = async (jobId: string, name: string) => {
    setFileName(name);
    setImportId(jobId);
    setBannerError(null);
    try {
      await fetchImportResults(jobId);
    } catch (err: any) {
      setBannerError(err.message || "Failed to load historical import.");
    }
  };

  const handleReset = () => {
    setStep("upload");
    setImportId(null);
    setParsedRows([]);
    setLeads([]);
    setSkipped([]);
    setBannerError(null);
    loadHistory();
  };

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  if (!authChecked) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh", backgroundColor: "var(--background)" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!username) {
    return (
      <>
        <Navbar username={null} onLogout={handleLogout} />
        <AuthForm onAuthSuccess={handleAuthSuccess} />
      </>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar username={username} onLogout={handleLogout} />

      <main className="container animate-fade-in">
        {/* Banner error display */}
        {bannerError && (
          <div className="banner banner-warning animate-fade-in">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>Operation Error</div>
              <div style={{ fontSize: "13px", marginTop: "2px" }}>{bannerError}</div>
            </div>
            <button
              onClick={() => setBannerError(null)}
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: "bold" }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Wizard Step Routing */}
        {step === "upload" && (
          <div className="grid-2">
            <div>
              <UploadZone
                onUploadSuccess={handleUploadSuccess}
                onError={(msg) => setBannerError(msg)}
              />
            </div>
            <div>
              <ImportHistory
                jobs={historyJobs}
                onView={handleViewHistoricalJob}
                onDeleted={loadHistory}
                onError={(msg) => setBannerError(msg)}
              />
            </div>
          </div>
        )}

        {step === "preview" && (
          <PreviewTable
            rows={parsedRows}
            fileName={fileName}
            onConfirm={handleConfirmImport}
            onCancel={handleReset}
          />
        )}

        {step === "process" && (
          <ProcessingProgress
            status={progressInfo.status}
            totalRows={progressInfo.totalRows}
            processedRows={progressInfo.processedRows}
            skippedRows={progressInfo.skippedRows}
            progressPercent={progressInfo.progressPercent}
            fileName={fileName}
            error={processError}
          />
        )}

        {step === "results" && (
          <ResultsDashboard
            leads={leads}
            skipped={skipped}
            fileName={fileName}
            summaryData={summaryData}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}
