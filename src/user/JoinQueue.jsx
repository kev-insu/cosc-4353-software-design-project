import { U, PURPLE } from "./tokens";
import { PriorityBadge, StatusPill } from "./UserChrome";

export default function JoinQueue({
  services,
  servicesLoading,
  servicesError,
  joinPending,
  retryServices,
  selectedServiceId,
  setSelectedServiceId,
  selectedService,
  inQueue,
  estimatedWait,
  onJoin,
  onLeave,
  goStatus,
}) {
  const noServicesAvailable = !servicesLoading && services.length === 0;
  const disableJoin =
    joinPending || servicesLoading || !!servicesError || !selectedService || !selectedService.open;

  return (
    <div>
      <h1 style={{ ...U.pageTitle, textAlign: "center", marginBottom: 20 }}>Join a queue</h1>

      <div style={U.card}>
        {servicesLoading && (
          <p style={{ marginTop: 0, ...U.muted }}>Loading services…</p>
        )}

        {servicesError && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ marginTop: 0, marginBottom: 12, color: "#fca5a5" }}>{servicesError}</p>
            <button type="button" onClick={retryServices} style={U.btnGhost}>
              Retry
            </button>
          </div>
        )}

        {noServicesAvailable && (
          <p style={{ marginTop: 0, ...U.muted }}>No services are available to join right now.</p>
        )}

        <label style={U.label}>Select service</label>
        <select
          value={selectedServiceId ?? ""}
          onChange={(e) => setSelectedServiceId(e.target.value || null)}
          style={U.select(servicesLoading || !!servicesError || noServicesAvailable)}
          disabled={servicesLoading || !!servicesError || noServicesAvailable}
        >
          <option value="">Choose a service…</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.open === false ? " (closed)" : ""}
            </option>
          ))}
        </select>

        {selectedService && (
          <div
            style={{
              marginTop: 20,
              padding: 16,
              background: "#111",
              borderRadius: 10,
              border: "1px solid #2a2a2a",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 17, color: "#fff" }}>{selectedService.name}</span>
              <PriorityBadge level={selectedService.priority} />
              <StatusPill open={selectedService.open !== false} />
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#9ca3af", lineHeight: 1.55 }}>
              {selectedService.description}
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#d1d5db" }}>
                <strong style={{ color: PURPLE }}>{estimatedWait}</strong>
                <span style={{ color: "#6b7280", marginLeft: 6 }}>estimated wait</span>
              </span>
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                {selectedService.currentQueue ?? 0} ahead in line
              </span>
            </div>
            {selectedService.open === false && (
              <p style={{ margin: "12px 0 0", fontSize: 13, color: "#f59e0b" }}>
                This service is closed for new queue entries.
              </p>
            )}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
          {!inQueue ? (
            <button
              type="button"
              onClick={onJoin}
              disabled={disableJoin}
              style={{ ...U.btnPrimary, ...(disableJoin ? U.btnPrimaryDisabled : {}) }}
            >
              {joinPending ? "Joining…" : "Join queue"}
            </button>
          ) : (
            <>
              <button type="button" onClick={goStatus} style={U.btnPrimary}>
                View queue status
              </button>
              <button type="button" onClick={onLeave} style={U.btnDanger}>
                Leave queue
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
