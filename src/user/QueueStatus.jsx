import { U, PURPLE } from "./tokens";
import { PriorityBadge, StatusPill } from "./UserChrome";

export default function QueueStatus({
  inQueue,
  selectedService,
  queueStatus,
  onAdvanceStatus,
  onLeave,
  goJoin,
}) {
  const statusLower = String(queueStatus.status || "").toLowerCase();
  const highlight =
    statusLower === "almost ready"
      ? "#f59e0b"
      : statusLower === "waiting"
        ? PURPLE
        : statusLower === "served"
          ? "#22c55e"
          : "#9ca3af";

  return (
    <div>
      <h1 style={{ ...U.pageTitle, textAlign: "center", marginBottom: 20 }}>Queue status</h1>

      <div style={U.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <h2 style={{ ...U.sectionTitle, margin: 0 }}>Current visit</h2>
          {selectedService && (
            <>
              <PriorityBadge level={selectedService.priority} />
              <StatusPill open={selectedService.open !== false} />
            </>
          )}
        </div>

        <p style={{ margin: "0 0 20px", fontSize: 15, color: "#e5e7eb" }}>
          Service:{" "}
          <strong style={{ color: "#fff" }}>{selectedService?.name ?? "None selected"}</strong>
        </p>

        {!selectedService ? (
          <>
            <p style={{ ...U.muted, marginBottom: 16 }}>Select a service from Join queue first.</p>
            <button type="button" onClick={goJoin} style={U.btnPrimary}>
              Go to join queue
            </button>
          </>
        ) : !inQueue && queueStatus.status !== "served" ? (
          <>
            <p style={{ ...U.muted, marginBottom: 16 }}>You are not currently in a queue.</p>
            <button type="button" onClick={goJoin} style={U.btnPrimary}>
              Join a queue
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                gap: 14,
                marginBottom: 20,
              }}
            >
              <div style={{ ...U.cardMuted, padding: 14 }}>
                <div style={{ ...U.muted, marginBottom: 4 }}>Status</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: highlight, textTransform: "capitalize" }}>
                  {queueStatus.status}
                </div>
              </div>
              <div style={{ ...U.cardMuted, padding: 14 }}>
                <div style={{ ...U.muted, marginBottom: 4 }}>Position</div>
                <div style={{ fontWeight: 800, fontSize: 22, color: "#fff" }}>{queueStatus.position}</div>
              </div>
              <div style={{ ...U.cardMuted, padding: 14, gridColumn: "span 1" }}>
                <div style={{ ...U.muted, marginBottom: 4 }}>Est. wait</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#e5e7eb" }}>{queueStatus.waitTime}</div>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <button type="button" onClick={onAdvanceStatus} style={U.btnGhost}>
                Advance status (demo)
              </button>
              {inQueue && (
                <button type="button" onClick={onLeave} style={U.btnDanger}>
                  Leave queue
                </button>
              )}
            </div>

            <p style={{ margin: "16px 0 0", fontSize: 12, color: "#4b5563", lineHeight: 1.5 }}>
              Demo: Advance status cycles waiting → almost ready → served. Real seating updates come from
              staff.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
