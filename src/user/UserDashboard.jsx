export default function UserDashboard({
  services,
  inQueue,
  selectedService,
  queueStatus,
  notifications,
  goJoin,
}) {
  return (
    <div>
      <h2>User Dashboard</h2>

      <div style={{ border: "1px solid #333", padding: 14, marginBottom: 16, borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Current Queue Status</h3>
        <p>Status: <strong>{queueStatus.status}</strong></p>
        <p>Position: <strong>{queueStatus.position}</strong></p>
        <p>Est. Wait: <strong>{queueStatus.waitTime}</strong></p>
        <p>
          Current Service:{" "}
          <strong>{inQueue ? (selectedService?.name ?? "Selected") : "Not in queue"}</strong>
        </p>
      </div>

      <h3>Active Services Available</h3>
      {services.map((s) => (
        <div key={s.id} style={{ border: "1px solid #333", padding: 14, marginBottom: 12, borderRadius: 8 }}>
          <h4 style={{ marginTop: 0 }}>{s.name}</h4>
          <p style={{ marginBottom: 10 }}>{s.description}</p>
          <button onClick={goJoin}>Go to Join Queue</button>
        </div>
      ))}

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