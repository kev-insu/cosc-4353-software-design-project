import { U, PURPLE } from "./tokens";
import { PriorityBadge, StatusPill } from "./UserChrome";

export default function UserDashboard({
  services,
  servicesLoading,
  servicesError,
  servicesLoadedOnce,
  inQueue,
  selectedService,
  queueStatus,
  notifications,
  retryServices,
  goJoin,
}) {
  const showInlineLoading = servicesLoading && services.length > 0;
  const showInlineError = !!servicesError && services.length > 0;
  const showPrimaryServiceState =
    (servicesLoading && services.length === 0) ||
    (!!servicesError && services.length === 0) ||
    (servicesLoadedOnce && !servicesLoading && !servicesError && services.length === 0);
  const serviceStateMessage =
    servicesError ||
    (servicesLoadedOnce && services.length === 0
      ? "No services are available right now."
      : "Loading available services...");

  const waitingTotal = services.reduce(
    (sum, s) => sum + (Number(s.currentQueue ?? s.queueLength ?? 0) || 0),
    0
  );
  const openCount = services.filter((s) => s.open !== false).length;

  return (
    <div>
      <h1 style={{ ...U.pageTitle, textAlign: "center", marginBottom: 20 }}>Dashboard</h1>

      <div style={U.statGrid}>
        {[
          { label: "Services", value: services.length, color: "#ffffff" },
          { label: "Open now", value: openCount, color: "#22c55e" },
          { label: "Parties waiting", value: waitingTotal, color: PURPLE },
        ].map((s) => (
          <div key={s.label} style={U.statCard}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ ...U.card, marginBottom: 16 }}>
        <h2 style={U.sectionTitle}>Your queue status</h2>
        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          }}
        >
          <div>
            <div style={U.muted}>Status</div>
            <div style={{ fontWeight: 700, color: "#e5e7eb", fontSize: 15 }}>
              {inQueue ? queueStatus.status : "Not in queue"}
            </div>
          </div>
          <div>
            <div style={U.muted}>Position</div>
            <div style={{ fontWeight: 700, color: "#e5e7eb", fontSize: 15 }}>
              {inQueue ? queueStatus.position : "—"}
            </div>
          </div>
          <div>
            <div style={U.muted}>Est. wait</div>
            <div style={{ fontWeight: 700, color: "#e5e7eb", fontSize: 15 }}>
              {inQueue ? queueStatus.waitTime : "—"}
            </div>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={U.muted}>Service</div>
            <div style={{ fontWeight: 700, color: "#e5e7eb", fontSize: 15 }}>
              {inQueue ? (selectedService?.name ?? "—") : "Join a queue to track status"}
            </div>
          </div>
        </div>
      </div>

      <h2 style={U.sectionTitle}>Available services</h2>
      {showInlineLoading && (
        <div style={{ ...U.cardMuted, marginBottom: 12 }}>
          <p style={{ margin: 0, ...U.muted }}>Refreshing available services…</p>
        </div>
      )}

      {showInlineError && (
        <div style={{ ...U.cardMuted, marginBottom: 12 }}>
          <p style={{ margin: "0 0 12px", color: "#e5e7eb" }}>{servicesError}</p>
          <button type="button" onClick={retryServices} style={U.btnGhost}>
            Retry
          </button>
        </div>
      )}

      {showPrimaryServiceState ? (
        <div style={{ ...U.cardMuted, marginBottom: 12 }}>
          <p style={{ margin: "0 0 12px", color: "#9ca3af" }}>{serviceStateMessage}</p>
          {servicesError && (
            <button type="button" onClick={retryServices} style={U.btnGhost}>
              Retry
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {services.map((s) => (
            <div key={s.id} style={U.card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>{s.name}</span>
                  <PriorityBadge level={s.priority} />
                </div>
                <StatusPill open={s.open !== false} />
              </div>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>
                {s.description}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                <span
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    background: "#111",
                    border: "1px solid #2a2a2a",
                    borderRadius: 6,
                    padding: "3px 10px",
                  }}
                >
                  ⏱ {s.duration ?? 15} min avg
                </span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>
                  {s.currentQueue ?? 0} waiting
                </span>
              </div>
              <button type="button" onClick={goJoin} style={U.btnPrimary}>
                Join this queue
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ ...U.sectionTitle, marginTop: 24 }}>Recent activity</h2>
      {notifications.length === 0 ? (
        <div style={{ ...U.cardMuted, textAlign: "center", padding: "28px 20px" }}>
          <p style={{ margin: 0, ...U.muted }}>No notifications yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notifications.slice(0, 5).map((n, i) => (
            <div
              key={i}
              style={{
                ...U.card,
                padding: "14px 18px",
                borderLeft: `4px solid ${PURPLE}`,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: PURPLE, marginBottom: 4 }}>
                UPDATE
              </div>
              <div style={{ fontSize: 14, color: "#e5e7eb" }}>{n}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
