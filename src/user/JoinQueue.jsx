export default function JoinQueue({
  services,
  selectedServiceId,
  setSelectedServiceId,
  selectedService,
  inQueue,
  estimatedWait,
  onJoin,
  onLeave,
  goStatus,
}) {
  return (
    <div>
      <h2>Join Queue</h2>

      <div style={{ border: "1px solid #333", padding: 14, borderRadius: 8 }}>
        <label>
          Select a service:
          <select
            value={selectedServiceId ?? ""}
            onChange={(e) => setSelectedServiceId(e.target.value || null)}
            style={{ marginLeft: 10 }}
          >
            <option value="">-- Choose --</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <div style={{ marginTop: 12 }}>
          <p>
            Selected: <strong>{selectedService?.name ?? "None"}</strong>
          </p>
          <p>
            Estimated wait time: <strong>{selectedService ? estimatedWait : "0 min"}</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          {!inQueue ? (
            <button onClick={onJoin}>Join Queue</button>
          ) : (
            <>
              <button onClick={goStatus}>View Queue Status</button>
              <button onClick={onLeave}>Leave Queue</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}