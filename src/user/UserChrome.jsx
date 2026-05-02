import { PURPLE } from "./tokens";

const priorityColor = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

export function PriorityBadge({ level }) {
  const key = String(level || "medium").toLowerCase();
  const c = priorityColor[key] || priorityColor.medium;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: ".4px",
        padding: "3px 9px",
        borderRadius: 20,
        color: c,
        background: `${c}18`,
        border: `1px solid ${c}44`,
      }}
    >
      {key}
    </span>
  );
}

export function StatusPill({ open }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 13,
        fontWeight: 700,
        color: open ? "#22c55e" : "#6b7280",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: open ? "#22c55e" : "#374151",
          boxShadow: open ? "0 0 6px #22c55e88" : "none",
          flexShrink: 0,
        }}
      />
      {open ? "Open" : "Closed"}
    </span>
  );
}

export function UserTabBar({ tabs, activeId, onSelect }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "12px 0",
        borderBottom: "1px solid #1a1a1a",
        overflowX: "auto",
      }}
    >
      {tabs.map((tab) => {
        const active = activeId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: `1px solid ${active ? PURPLE : "#2a2a2a"}`,
              background: active ? "#ffffff" : "#1a1a1a",
              color: active ? "#000000" : "#9ca3af",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: active ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all .15s",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
