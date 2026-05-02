import { U } from "./tokens";

function outcomeStyle(outcome) {
  const o = String(outcome || "").toLowerCase();
  if (o === "served") return { bg: "#22c55e18", border: "#22c55e44", color: "#22c55e" };
  if (o === "left") return { bg: "#f59e0b18", border: "#f59e0b44", color: "#f59e0b" };
  if (o === "removed") return { bg: "#ef444418", border: "#ef444444", color: "#ef4444" };
  return { bg: "#6b728018", border: "#6b728044", color: "#9ca3af" };
}

export default function History({ history }) {
  return (
    <div>
      <h1 style={{ ...U.pageTitle, textAlign: "center", marginBottom: 20 }}>Your history</h1>

      {history.length === 0 ? (
        <div style={{ ...U.card, textAlign: "center", padding: "36px 24px" }}>
          <p style={{ margin: 0, ...U.muted }}>No past queue visits yet.</p>
        </div>
      ) : (
        <div style={U.card}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 320 }}>
              <thead>
                <tr>
                  {["Date", "Service", "Outcome"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "12px 10px",
                        borderBottom: "1px solid #2a2a2a",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#9ca3af",
                        textTransform: "uppercase",
                        letterSpacing: ".5px",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => {
                  const os = outcomeStyle(item.outcome);
                  return (
                    <tr key={idx}>
                      <td style={{ padding: "14px 10px", borderBottom: "1px solid #1f1f1f", color: "#d1d5db" }}>
                        {item.date}
                      </td>
                      <td
                        style={{
                          padding: "14px 10px",
                          borderBottom: "1px solid #1f1f1f",
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {item.serviceName}
                      </td>
                      <td style={{ padding: "14px 10px", borderBottom: "1px solid #1f1f1f" }}>
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: ".4px",
                            padding: "4px 10px",
                            borderRadius: 20,
                            background: os.bg,
                            border: `1px solid ${os.border}`,
                            color: os.color,
                          }}
                        >
                          {item.outcome}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
