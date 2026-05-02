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

  return (
    <div>
      <h2>User Dashboard</h2>

      <div style={{ border: "1px solid #333", padding: 14, marginBottom: 16, borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Current Queue Status</h3>
        <p>Status: <strong>{inQueue ? queueStatus.status : "Not in queue"}</strong></p>
        <p>Position: <strong>{inQueue ? queueStatus.position : "-"}</strong></p>
        <p>Est. Wait: <strong>{inQueue ? queueStatus.waitTime : "-"}</strong></p>
        <p>
          Current Service:{" "}
          <strong>{inQueue ? (selectedService?.name ?? "Selected") : "Not in queue"}</strong>
        </p>
      </div>

      <h3>Active Services Available</h3>
      {showInlineLoading && (
        <div style={{ border: "1px solid #333", padding: 14, marginBottom: 12, borderRadius: 8 }}>
          <p style={{ margin: 0 }}>Refreshing available services...</p>
        </div>
      )}

      {showInlineError && (
        <div style={{ border: "1px solid #333", padding: 14, marginBottom: 12, borderRadius: 8 }}>
          <p style={{ margin: 0, marginBottom: 10 }}>{servicesError}</p>
          <button onClick={retryServices}>Retry</button>
        </div>
      )}

      {showPrimaryServiceState ? (
        <div style={{ border: "1px solid #333", padding: 14, marginBottom: 12, borderRadius: 8 }}>
          <p style={{ margin: 0, marginBottom: servicesError ? 10 : 0 }}>{serviceStateMessage}</p>
          {servicesError && (
            <button onClick={retryServices}>Retry</button>
          )}
        </div>
      ) : (
        services.map((s) => (
          <div key={s.id} style={{ border: "1px solid #333", padding: 14, marginBottom: 12, borderRadius: 8 }}>
            <h4 style={{ marginTop: 0 }}>{s.name}</h4>
            <p style={{ marginBottom: 6 }}>{s.description}</p>
            <p style={{ marginTop: 0, marginBottom: 10, opacity: 0.8 }}>
              {s.currentQueue ?? 0} waiting · {s.duration ?? 15} min average
            </p>
            <button onClick={goJoin}>Go to Join Queue</button>
          </div>
        ))
      )}

      <h3 style={{ marginTop: 18 }}>Notifications Summary</h3>
      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <ul>
          {notifications.slice(0, 3).map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
