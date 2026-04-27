import { useEffect, useMemo, useState } from "react";
import {
  exportReportCsv,
  fetchReport,
  fetchReportOptions,
  getDisplayError,
  isAbortError,
} from "./api";

const REPORT_TYPES = [
  { value: "participation", label: "User/Customer Queue Participation History" },
  { value: "serviceActivity", label: "Service Details and Queue Activity" },
  { value: "queueStats", label: "Queue Usage Statistics" },
];

const S = {
  card: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 18 },
  title: { fontSize: 22, fontWeight: 700, color: "#ffffff", textAlign: "center", marginBottom: 20 },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: ".5px",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    background: "#0d0d0d",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    color: "#e5e7eb",
    fontFamily: "inherit",
    fontSize: 14,
    padding: "10px 12px",
  },
  btnPrimary: {
    background: "#a855f7",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 18px",
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnGhost: {
    background: "transparent",
    color: "#9ca3af",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    padding: "10px 18px",
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};

function formatCell(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value).toLocaleString();
  }
  return String(value);
}

function columnLabel(column) {
  return column
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}

export default function AdminReports({ role }) {
  const [reportType, setReportType] = useState("participation");
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    serviceId: "",
    queueId: "",
    user: "",
    status: "",
  });
  const [options, setOptions] = useState({ services: [], queues: [], statuses: [] });
  const [report, setReport] = useState({ columns: [], rows: [], summary: null });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const visibleQueues = useMemo(() => {
    if (!filters.serviceId) return options.queues;
    return options.queues.filter((queue) => String(queue.serviceId) === String(filters.serviceId));
  }, [filters.serviceId, options.queues]);

  useEffect(() => {
    const controller = new AbortController();

    fetchReportOptions({ role, signal: controller.signal })
      .then(setOptions)
      .catch((err) => {
        if (!isAbortError(err)) {
          setError(getDisplayError(err, "Unable to load report filters."));
        }
      });

    return () => controller.abort();
  }, [role]);

  function setFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === "serviceId" ? { queueId: "" } : {}),
    }));
  }

  async function generate() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchReport({ reportType, filters, role });
      setReport(data);
    } catch (err) {
      setReport({ columns: [], rows: [], summary: null });
      setError(getDisplayError(err, "Unable to generate report."));
    } finally {
      setLoading(false);
    }
  }

  async function exportCsv() {
    setExporting(true);
    setError("");

    try {
      await exportReportCsv({ reportType, filters, role });
    } catch (err) {
      setError(getDisplayError(err, "Unable to export report."));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <h1 style={S.title}>Reporting</h1>

      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <label>
            <span style={S.label}>Report Type</span>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} style={S.input}>
              {REPORT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span style={S.label}>Start Date</span>
            <input type="date" value={filters.startDate} onChange={(e) => setFilter("startDate", e.target.value)} style={S.input} />
          </label>

          <label>
            <span style={S.label}>End Date</span>
            <input type="date" value={filters.endDate} onChange={(e) => setFilter("endDate", e.target.value)} style={S.input} />
          </label>

          <label>
            <span style={S.label}>Service</span>
            <select value={filters.serviceId} onChange={(e) => setFilter("serviceId", e.target.value)} style={S.input}>
              <option value="">All services</option>
              {options.services.map((service) => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span style={S.label}>Queue</span>
            <select value={filters.queueId} onChange={(e) => setFilter("queueId", e.target.value)} style={S.input}>
              <option value="">All queues</option>
              {visibleQueues.map((queue) => (
                <option key={queue.id} value={queue.id}>
                  {queue.serviceName} - {queue.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={S.label}>User/Customer</span>
            <input value={filters.user} onChange={(e) => setFilter("user", e.target.value)} placeholder="Name contains..." style={S.input} />
          </label>

          <label>
            <span style={S.label}>Status</span>
            <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)} style={S.input}>
              <option value="">All statuses</option>
              {options.statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <button onClick={generate} disabled={loading} style={{ ...S.btnPrimary, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Generating..." : "Generate Report"}
          </button>
          <button onClick={exportCsv} disabled={exporting} style={{ ...S.btnGhost, opacity: exporting ? 0.6 : 1 }}>
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ ...S.card, borderColor: "#ef444466", color: "#fecaca", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {report.summary && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
            <div>Total served: {formatCell(report.summary.totalUsersServed)}</div>
            <div>Total entries: {formatCell(report.summary.totalQueueEntries)}</div>
            <div>Avg wait: {formatCell(report.summary.averageWaitTimeMinutes)}</div>
          </div>
        </div>
      )}

      <div style={S.card}>
        {report.rows.length === 0 ? (
          <p style={{ color: "#6b7280", margin: 0, textAlign: "center", padding: "18px 0" }}>
            No report results yet. Select filters and generate a report.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr>
                  {report.columns.map((column) => (
                    <th key={column} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #2a2a2a", color: "#9ca3af", fontSize: 12 }}>
                      {columnLabel(column)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row, index) => (
                  <tr key={`${reportType}-${index}`}>
                    {report.columns.map((column) => (
                      <td key={column} style={{ padding: 10, borderBottom: "1px solid #222", color: "#e5e7eb", fontSize: 13 }}>
                        {formatCell(row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
