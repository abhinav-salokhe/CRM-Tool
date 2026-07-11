"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

interface LeadRecord {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  country_code: string | null;
  mobile_without_country_code: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lead_owner: string | null;
  crm_status: string | null;
  crm_note: string | null;
  data_source: string | null;
  possession_time: string | null;
  description: string | null;
  duplicate: boolean;
  duplicate_reason: string | null;
}

interface SkippedRecord {
  id: string;
  rowNumber: number;
  reason: string;
  rawData: Record<string, any>;
}

interface ResultsDashboardProps {
  leads: LeadRecord[];
  skipped: SkippedRecord[];
  fileName: string;
  summaryData?: {
    summary: {
      uploaded: number;
      imported: number;
      skipped: number;
      duplicates: number;
      validEmails: number;
      invalidEmails: number;
      validPhones: number;
      invalidPhones: number;
    };
  } | null;
  onReset: () => void;
}

// Requirement 1: Map status to exact uppercase normalized enum values in Status badges
const statusMap: Record<string, { label: string; cls: string }> = {
  GOOD_LEAD_FOLLOW_UP: { label: "GOOD_LEAD_FOLLOW_UP", cls: "b-good" },
  DID_NOT_CONNECT: { label: "DID_NOT_CONNECT", cls: "b-dnc" },
  BAD_LEAD: { label: "BAD_LEAD", cls: "b-bad" },
  SALE_DONE: { label: "SALE_DONE", cls: "b-sale" },
};

export default function ResultsDashboard({
  leads,
  skipped,
  fileName,
  summaryData,
  onReset,
}: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<"success" | "skipped">("success");

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");

  // Sorting states
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Virtualization states
  const [scrollTop, setScrollTop] = useState(0);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = 52; // height of a table row in pixels

  // Requirement 9, 13 & 14: Read statistics from backend summary nested object structure
  const stats = useMemo(() => {
    if (summaryData && summaryData.summary) {
      return {
        totalUploaded: summaryData.summary.uploaded,
        totalImported: summaryData.summary.imported,
        totalSkipped: summaryData.summary.skipped,
        duplicates: summaryData.summary.duplicates,
        validEmails: summaryData.summary.validEmails,
        invalidEmails: summaryData.summary.invalidEmails,
        validPhones: summaryData.summary.validPhones,
        invalidPhones: summaryData.summary.invalidPhones,
      };
    }
    
    // Fallback calculations for stats if summaryData is not loaded
    const validEmails = leads.filter((l) => l.email && l.email.trim()).length;
    const invalidEmails = leads.filter((l) => l.crm_note?.includes("[Invalid Email:")).length;
    const validPhones = leads.filter((l) => l.mobile_without_country_code && l.mobile_without_country_code.trim()).length;
    const invalidPhones = leads.filter((l) => l.crm_note?.includes("[Invalid Phone:")).length;
    const duplicates = leads.filter((l) => l.duplicate).length;

    return {
      totalUploaded: leads.length + skipped.length,
      totalImported: leads.length,
      totalSkipped: skipped.length,
      duplicates,
      validEmails,
      invalidEmails,
      validPhones,
      invalidPhones,
    };
  }, [leads, skipped, summaryData]);

  // Extract unique lead owners and data sources for filter dropdowns
  const uniqueOwners = useMemo(() => {
    const owners = new Set<string>();
    leads.forEach((l) => {
      if (l.lead_owner && l.lead_owner.trim()) {
        owners.add(l.lead_owner.trim());
      }
    });
    return Array.from(owners);
  }, [leads]);

  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    leads.forEach((l) => {
      if (l.data_source && l.data_source.trim()) {
        sources.add(l.data_source.trim());
      }
    });
    return Array.from(sources);
  }, [leads]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, ownerFilter, sourceFilter]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search match
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        matchesSearch =
          (lead.name || "").toLowerCase().includes(q) ||
          (lead.email || "").toLowerCase().includes(q) ||
          (lead.mobile_without_country_code || "").toLowerCase().includes(q) ||
          (lead.company || "").toLowerCase().includes(q) ||
          (lead.city || "").toLowerCase().includes(q) ||
          (lead.state || "").toLowerCase().includes(q) ||
          (lead.country || "").toLowerCase().includes(q) ||
          (lead.lead_owner || "").toLowerCase().includes(q) ||
          (lead.crm_note || "").toLowerCase().includes(q);
      }

      // Column dropdown filter matches
      let matchesStatus = true;
      if (statusFilter !== "All") {
        const target = statusFilter === "Unknown" ? "" : statusFilter;
        matchesStatus = (lead.crm_status || "") === target;
      }

      let matchesOwner = true;
      if (ownerFilter !== "All") {
        matchesOwner = (lead.lead_owner || "").trim() === ownerFilter;
      }

      let matchesSource = true;
      if (sourceFilter !== "All") {
        matchesSource = (lead.data_source || "").trim() === sourceFilter;
      }

      return matchesSearch && matchesStatus && matchesOwner && matchesSource;
    });
  }, [leads, searchQuery, statusFilter, ownerFilter, sourceFilter]);

  // Sorted Leads
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      const key = sortField as keyof LeadRecord;
      let valA: any = a[key] ?? "";
      let valB: any = b[key] ?? "";

      if (sortField === "created_at") {
        const timeA = valA ? new Date(valA).getTime() : 0;
        const timeB = valB ? new Date(valB).getTime() : 0;
        return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
      }

      const strA = valA.toString().toLowerCase();
      const strB = valB.toString().toLowerCase();

      if (strA < strB) return sortDirection === "asc" ? -1 : 1;
      if (strA > strB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredLeads, sortField, sortDirection]);

  // Paginated Leads
  const paginatedLeads = useMemo(() => {
    if (pageSize === -1) return sortedLeads; // "All"
    const start = (currentPage - 1) * pageSize;
    return sortedLeads.slice(start, start + pageSize);
  }, [sortedLeads, currentPage, pageSize]);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(sortedLeads.length / pageSize) || 1;
  const startIndexPaginated = pageSize === -1 ? 0 : (currentPage - 1) * pageSize;

  // Virtualization Calculations
  const visibleCount = Math.ceil(400 / ROW_HEIGHT);
  const bufferCount = 4;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - bufferCount);
  const endIndex = Math.min(
    paginatedLeads.length - 1,
    startIndex + visibleCount + bufferCount
  );

  const visibleLeads = useMemo(() => {
    return paginatedLeads.slice(startIndex, endIndex + 1);
  }, [paginatedLeads, startIndex, endIndex]);

  const topSpacerHeight = startIndex * ROW_HEIGHT;
  const bottomSpacerHeight = Math.max(0, (paginatedLeads.length - endIndex - 1) * ROW_HEIGHT);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return " ↕";
    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  // CSV Exporter
  const handleExportCSV = () => {
    const headers = [
      "Created At",
      "Name",
      "Email",
      "Country Code",
      "Mobile",
      "Company",
      "City",
      "State",
      "Country",
      "Lead Owner",
      "CRM Status",
      "CRM Note",
      "Data Source",
      "Possession Time",
      "Description",
      "Duplicate",
      "Duplicate Reason",
    ];

    const csvRows = [headers.join(",")];

    for (const lead of sortedLeads) {
      const row = [
        lead.created_at || "",
        lead.name || "",
        lead.email || "",
        lead.country_code || "",
        lead.mobile_without_country_code || "",
        lead.company || "",
        lead.city || "",
        lead.state || "",
        lead.country || "",
        lead.lead_owner || "",
        lead.crm_status || "",
        lead.crm_note || "",
        lead.data_source || "",
        lead.possession_time || "",
        lead.description || "",
        lead.duplicate ? "TRUE" : "FALSE",
        lead.duplicate_reason || "",
      ].map((val) => {
        const escaped = val.toString().replace(/"/g, '""');
        return escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')
          ? `"${escaped}"`
          : escaped;
      });
      csvRows.push(row.join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `exported_leads_${fileName || "crm"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderBadge = (status: string | null) => {
    if (!status) return <span className="badge b-default">Unknown</span>;
    const meta = statusMap[status] || { label: status, cls: "b-default" };
    return <span className={`badge ${meta.cls}`}>{meta.label}</span>;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Requirement 10: Helper to extract lead name from raw skipped record object
  const getLeadNameFromRaw = (rawData: any) => {
    if (!rawData) return "—";
    const nameKeys = ["Customer Name", "Lead Name", "Full Name", "Client Name", "Person Name", "name", "Name"];
    for (const key of nameKeys) {
      if (rawData[key]) return rawData[key];
    }
    return "—";
  };

  return (
    <div className="animate-fade-in">
      <div
        className="head"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <span className="badge b-good" style={{ marginBottom: "6px" }}>
            Import Completed
          </span>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "var(--ink)" }}>
            Import Summary: {fileName}
          </h2>
          <p style={{ margin: "4px 0 0", color: "var(--ink-soft)", fontSize: "14px" }}>
            AI has parsed messy layouts, normalized phone/email properties, and mapped headers.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onReset}>
          Import Another File
        </button>
      </div>

      {/* Stats Cards Grid - Glassmorphism UI Style */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div className="card" style={{ borderLeft: "4px solid var(--accent)", marginBottom: 0, padding: "18px" }}>
          <span className="stat-val" style={{ color: "var(--foreground)" }}>
            {stats.totalUploaded}
          </span>
          <span className="stat-lbl">Total Uploaded</span>
        </div>
        <div className="card" style={{ borderLeft: "4px solid var(--good)", marginBottom: 0, padding: "18px" }}>
          <span className="stat-val" style={{ color: "var(--good)" }}>
            {stats.totalImported}
          </span>
          <span className="stat-lbl">Imported (Success)</span>
        </div>
        <div className="card" style={{ borderLeft: "4px solid var(--bad)", marginBottom: 0, padding: "18px" }}>
          <span className="stat-val" style={{ color: "var(--bad)" }}>
            {stats.totalSkipped}
          </span>
          <span className="stat-lbl">Skipped Records</span>
        </div>
        <div className="card" style={{ borderLeft: "4px solid var(--dnc)", marginBottom: 0, padding: "18px" }}>
          <span className="stat-val" style={{ color: "var(--dnc)" }}>
            {stats.duplicates}
          </span>
          <span className="stat-lbl">Duplicates</span>
        </div>
        <div className="card" style={{ borderLeft: "4px solid var(--line)", marginBottom: 0, padding: "18px" }}>
          <span className="stat-val" style={{ color: "var(--good)", fontSize: "20px", marginTop: "6px" }}>
            {stats.validEmails} <span style={{ fontSize: "12px", color: "var(--ink-soft)", fontWeight: "normal" }}>/ {stats.invalidEmails} invalid</span>
          </span>
          <span className="stat-lbl">Emails (Valid/Invalid)</span>
        </div>
        <div className="card" style={{ borderLeft: "4px solid var(--line)", marginBottom: 0, padding: "18px" }}>
          <span className="stat-val" style={{ color: "var(--good)", fontSize: "20px", marginTop: "6px" }}>
            {stats.validPhones} <span style={{ fontSize: "12px", color: "var(--ink-soft)", fontWeight: "normal" }}>/ {stats.invalidPhones} invalid</span>
          </span>
          <span className="stat-lbl">Phones (Valid/Invalid)</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginTop: "24px" }}>
        <button
          className={`tab ${activeTab === "success" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("success")}
        >
          Parsed Leads ({sortedLeads.length})
        </button>
        <button
          className={`tab ${activeTab === "skipped" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("skipped")}
        >
          Skipped Records ({skipped.length})
        </button>
      </div>

      {activeTab === "success" ? (
        <div>
          {/* Filters Control Bar */}
          <div
            className="card"
            style={{
              padding: "16px",
              marginBottom: "16px",
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", flex: 1, minWidth: "300px" }}>
              {/* Search Box */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "200px", flex: 1 }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase" }}>
                  Search Leads
                </span>
                <input
                  type="text"
                  className="input"
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: "8px 12px" }}
                />
              </div>

              {/* CRM Status Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "140px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase" }}>
                  CRM Status
                </span>
                <select
                  className="input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: "8px 12px", appearance: "auto" }}
                >
                  <option value="All">All Statuses</option>
                  <option value="GOOD_LEAD_FOLLOW_UP">GOOD_LEAD_FOLLOW_UP</option>
                  <option value="DID_NOT_CONNECT">DID_NOT_CONNECT</option>
                  <option value="BAD_LEAD">BAD_LEAD</option>
                  <option value="SALE_DONE">SALE_DONE</option>
                  <option value="Unknown">Unknown Status</option>
                </select>
              </div>

              {/* Lead Owner Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "140px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase" }}>
                  Lead Owner
                </span>
                <select
                  className="input"
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                  style={{ padding: "8px 12px", appearance: "auto" }}
                >
                  <option value="All">All Owners</option>
                  {uniqueOwners.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data Source Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "140px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase" }}>
                  Data Source
                </span>
                <select
                  className="input"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  style={{ padding: "8px 12px", appearance: "auto" }}
                >
                  <option value="All">All Sources</option>
                  {uniqueSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* CSV Export & Actions */}
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", height: "100%", alignSelf: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleExportCSV}
                title="Export Filtered Rows to CSV"
                style={{ padding: "8px 14px", height: "38px" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: "4px" }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* Parsed Leads Table */}
          <div className="table-card" style={{ display: "flex", flexDirection: "column" }}>
            <div
              className="table-scroll"
              ref={tableScrollRef}
              onScroll={handleScroll}
              style={{
                maxHeight: "440px",
                overflowY: "auto",
                position: "relative",
              }}
            >
              <table className="table" style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr style={{ height: "45px" }}>
                    <th style={{ width: "60px", textAlign: "center", position: "sticky", top: 0, zIndex: 20 }}>#</th>
                    <th
                      className="sticky-col"
                      onClick={() => handleSort("name")}
                      style={{ cursor: "pointer", position: "sticky", top: 0, zIndex: 21 }}
                    >
                      Name {renderSortIndicator("name")}
                    </th>
                    <th onClick={() => handleSort("email")} style={{ cursor: "pointer", position: "sticky", top: 0, zIndex: 20 }}>
                      Email {renderSortIndicator("email")}
                    </th>
                    <th style={{ position: "sticky", top: 0, zIndex: 20 }}>Validation Badges</th>
                    
                    {/* Requirement 2: Separate Country Code and Mobile columns */}
                    <th onClick={() => handleSort("country_code")} style={{ cursor: "pointer", position: "sticky", top: 0, zIndex: 20 }}>
                      Country Code {renderSortIndicator("country_code")}
                    </th>
                    <th onClick={() => handleSort("mobile_without_country_code")} style={{ cursor: "pointer", position: "sticky", top: 0, zIndex: 20 }}>
                      Mobile {renderSortIndicator("mobile_without_country_code")}
                    </th>
                    
                    <th onClick={() => handleSort("crm_status")} style={{ cursor: "pointer", position: "sticky", top: 0, zIndex: 20 }}>
                      CRM Status {renderSortIndicator("crm_status")}
                    </th>
                    <th onClick={() => handleSort("data_source")} style={{ cursor: "pointer", position: "sticky", top: 0, zIndex: 20 }}>
                      Source {renderSortIndicator("data_source")}
                    </th>
                    <th onClick={() => handleSort("company")} style={{ cursor: "pointer", position: "sticky", top: 0, zIndex: 20 }}>
                      Company {renderSortIndicator("company")}
                    </th>
                    <th onClick={() => handleSort("lead_owner")} style={{ cursor: "pointer", position: "sticky", top: 0, zIndex: 20 }}>
                      Owner {renderSortIndicator("lead_owner")}
                    </th>
                    <th style={{ position: "sticky", top: 0, zIndex: 20 }}>Note</th>
                    <th onClick={() => handleSort("city")} style={{ cursor: "pointer", position: "sticky", top: 0, zIndex: 20 }}>
                      City {renderSortIndicator("city")}
                    </th>
                    <th onClick={() => handleSort("state")} style={{ cursor: "pointer", position: "sticky", top: 0, zIndex: 20 }}>
                      State {renderSortIndicator("state")}
                    </th>
                    <th onClick={() => handleSort("country")} style={{ cursor: "pointer", position: "sticky", top: 0, zIndex: 20 }}>
                      Country {renderSortIndicator("country")}
                    </th>
                    <th style={{ position: "sticky", top: 0, zIndex: 20 }}>Possession Time</th>
                    <th style={{ position: "sticky", top: 0, zIndex: 20 }}>Description</th>
                    <th onClick={() => handleSort("created_at")} style={{ cursor: "pointer", position: "sticky", top: 0, zIndex: 20 }}>
                      Created At {renderSortIndicator("created_at")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Top Spacer for Virtualization */}
                  {topSpacerHeight > 0 && (
                    <tr style={{ height: `${topSpacerHeight}px` }}>
                      <td colSpan={17} style={{ padding: 0, border: "none" }} />
                    </tr>
                  )}

                  {visibleLeads.length === 0 ? (
                    <tr>
                      <td colSpan={17} style={{ padding: "40px", textAlign: "center", color: "var(--ink-soft)" }}>
                        No records match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    visibleLeads.map((lead, idx) => {
                      const actualIdx = startIndex + idx;
                      const hasDuplicate = lead.duplicate;

                      return (
                        <tr
                          key={lead.id || actualIdx}
                          style={{
                            height: `${ROW_HEIGHT}px`,
                            backgroundColor: hasDuplicate ? "rgba(245, 158, 11, 0.05)" : "transparent",
                          }}
                        >
                          <td style={{ textAlign: "center", color: "var(--ink-muted)", fontVariantNumeric: "tabular-nums" }}>
                            {actualIdx + 1 + (currentPage - 1) * pageSize}
                          </td>
                          <td className="sticky-col" style={{ fontWeight: 600 }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span>{lead.name || <span className="text-muted">—</span>}</span>
                            </div>
                          </td>
                          <td>{lead.email || <span className="text-muted">—</span>}</td>
                          <td>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              {lead.email && <span className="badge b-good">✅ Valid Email</span>}
                              {!lead.email && lead.crm_note?.includes("[Invalid Email:") && (
                                <span className="badge b-bad" title={lead.crm_note}>
                                  ❌ Invalid Email
                                </span>
                              )}
                              {lead.mobile_without_country_code && <span className="badge b-good">✅ Valid Phone</span>}
                              {!lead.mobile_without_country_code && lead.crm_note?.includes("[Invalid Phone:") && (
                                <span className="badge b-bad" title={lead.crm_note}>
                                  ❌ Invalid Phone
                                </span>
                              )}
                              {lead.duplicate && (
                                <span className="badge b-dnc" title={lead.duplicate_reason || "Duplicate check flagged"}>
                                  Duplicate
                                </span>
                              )}
                            </div>
                          </td>
                          
                          {/* Requirement 2: Separate Country Code and Mobile Columns */}
                          <td>{lead.country_code || <span className="text-muted">—</span>}</td>
                          <td>{lead.mobile_without_country_code || <span className="text-muted">—</span>}</td>
                          
                          <td>{renderBadge(lead.crm_status)}</td>
                          <td>
                            {lead.data_source ? (
                              <span className="badge b-default" style={{ textTransform: "none" }}>
                                {lead.data_source}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>{lead.company || <span className="text-muted">—</span>}</td>
                          <td>{lead.lead_owner || <span className="text-muted">—</span>}</td>
                          <td title={lead.crm_note || ""}>
                            <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
                              {lead.crm_note || <span className="text-muted">—</span>}
                            </span>
                          </td>
                          <td>{lead.city || <span className="text-muted">—</span>}</td>
                          <td>{lead.state || <span className="text-muted">—</span>}</td>
                          <td>{lead.country || <span className="text-muted">—</span>}</td>
                          <td>{lead.possession_time || <span className="text-muted">—</span>}</td>
                          <td title={lead.description || ""}>{lead.description || <span className="text-muted">—</span>}</td>
                          <td>{formatDate(lead.created_at)}</td>
                        </tr>
                      );
                    })
                  )}

                  {/* Bottom Spacer for Virtualization */}
                  {bottomSpacerHeight > 0 && (
                    <tr style={{ height: `${bottomSpacerHeight}px` }}>
                      <td colSpan={17} style={{ padding: 0, border: "none" }} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div
              className="footer-info"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                padding: "12px 16px",
              }}
            >
              <div>
                Showing {startIndexPaginated + 1} - {Math.min(startIndexPaginated + pageSize, sortedLeads.length)} of{" "}
                {sortedLeads.length} leads (filtered from {leads.length} total)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {/* Rows per page dropdown */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>Rows per page:</span>
                  <select
                    className="input"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    style={{ padding: "4px 8px", fontSize: "12px", minWidth: "70px", appearance: "auto" }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={-1}>All</option>
                  </select>
                </div>

                {/* Page Prev/Next navigation */}
                {pageSize !== -1 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      Prev
                    </button>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Requirement 10: Skipped Records Table Overhaul */
        <div className="table-card">
          {skipped.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-soft)" }}>
              No records were skipped in this import.
            </div>
          ) : (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "80px", textAlign: "center" }}>Row #</th>
                    <th style={{ minWidth: "150px" }}>Lead Name</th>
                    <th style={{ minWidth: "120px" }}>Status</th>
                    <th style={{ minWidth: "250px" }}>Skip Reason</th>
                    <th>Raw Record Content Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {skipped.map((record, idx) => (
                    <tr key={record.id || idx}>
                      <td style={{ textAlign: "center", fontWeight: 600, color: "var(--bad)" }}>
                        {record.rowNumber}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {getLeadNameFromRaw(record.rawData)}
                      </td>
                      <td>
                        <span className="badge b-bad">Skipped</span>
                      </td>
                      <td style={{ color: "var(--ink)", fontWeight: 500 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          {record.reason.split(",").map((r, i) => (
                            <span key={i}>{r.trim()}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--ink-soft)" }}>
                        {JSON.stringify(record.rawData)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="footer-info">
            Showing {skipped.length} of {skipped.length} skipped records.
          </div>
        </div>
      )}
    </div>
  );
}
