export default function QueueStatus({
  inQueue,
  selectedService,
  queueStatus,
  onAdvanceStatus,
  onLeave,
  goJoin,
}) {
  return (
    <div>
      <h2>Queue Status</h2>

      <div style={{ border: "1px solid #333", padding: 14, borderRadius: 8 }}>
        <p>
          Service: <strong>{selectedService?.name ?? "No service selected"}</strong>
        </p>

        {!selectedService ? (
          <>
            <p>Please select a service first.</p>
            <button onClick={goJoin}>Go to Join Queue</button>
          </>
        ) : !inQueue && queueStatus.status !== "served" ? (
          <>
            <p>You are not currently in a queue.</p>
            <button onClick={goJoin}>Go to Join Queue</button>
          </>
        ) : (
          <>
            <p>Status: <strong>{queueStatus.status}</strong></p>
            <p>Position: <strong>{queueStatus.position}</strong></p>
            <p>Estimated Wait: <strong>{queueStatus.waitTime}</strong></p>

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button onClick={onAdvanceStatus}>Advance Status</button>
              {inQueue && <button onClick={onLeave}>Leave Queue</button>}
            </div>

            <p style={{ marginTop: 12, opacity: 0.8 }}>
              (Simulation: Advance Status cycles waiting → almost ready → served)
            </p>
          </>
        )}
      </div>
    </div>
  );
}