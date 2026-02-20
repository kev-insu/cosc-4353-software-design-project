export default function History({ history }) {
  return (
    <div>
      <h2>History</h2>

      {history.length === 0 ? (
        <p>No past queues yet.</p>
      ) : (
        <div style={{ border: "1px solid #333", padding: 14, borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #333" }}>Date</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #333" }}>Service</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #333" }}>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ padding: 8, borderBottom: "1px solid #222" }}>{item.date}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #222" }}>{item.serviceName}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #222" }}>{item.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
