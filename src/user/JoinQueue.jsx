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
  const disableJoin = joinPending || servicesLoading || !!servicesError || !selectedService || !selectedService.open;

  return (
    <div>
      <h2>Join Queue</h2>

      <div style={{ border: "1px solid #333", padding: 14, borderRadius: 8 }}>
        {servicesLoading && (
          <p style={{ marginTop: 0 }}>Loading services...</p>
        )}

        {servicesError && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ marginTop: 0, marginBottom: 10 }}>{servicesError}</p>
            <button onClick={retryServices}>Retry</button>
          </div>
        )}

        {noServicesAvailable && (
          <p style={{ marginTop: 0 }}>No services are available to join right now.</p>
        )}

        <label>
          Select a service:
          <select
            value={selectedServiceId ?? ""}
            onChange={(e) => setSelectedServiceId(e.target.value || null)}
            style={{ marginLeft: 10 }}
            disabled={servicesLoading || !!servicesError || noServicesAvailable}
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
          {selectedService && !selectedService.open && (
            <p style={{ marginBottom: 0 }}>This service is currently closed for new queue entries.</p>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          {!inQueue ? (
            <button onClick={onJoin} disabled={disableJoin}>
              {joinPending ? "Joining..." : "Join Queue"}
            </button>
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
