  import { useState, useEffect, useCallback } from "react";


  /* ══════════════════════════════════════════════════════════
    SEED DATA
  ══════════════════════════════════════════════════════════ */
  const SEED_SERVICES = [
    { id: 1, name: "Standard Seating",  description: "Regular indoor table seating.", duration: 15, priority: "medium", open: true  },
    { id: 2, name: "Outdoor Patio",     description: "Al fresco dining on the patio deck.", duration: 20, priority: "low",    open: true  },
    { id: 3, name: "Private Dining",    description: "Exclusive private room for special occasions.", duration: 45, priority: "high",   open: false },
  ];

  const SEED_QUEUES = {
    1: [
      { id: 101, name: "Maria Santos",     ticket: "A-001", joined: "6:02 PM", status: "Waiting" },
      { id: 102, name: "James Okoye",      ticket: "A-002", joined: "6:15 PM", status: "Waiting" },
      { id: 103, name: "Lin Wei",          ticket: "A-003", joined: "6:28 PM", status: "Waiting" },
      { id: 104, name: "Fatima Al-Rashid", ticket: "A-004", joined: "6:41 PM", status: "Waiting" },
    ],
    2: [
      { id: 201, name: "Carlos Mendez", ticket: "B-001", joined: "6:05 PM", status: "Waiting" },
      { id: 202, name: "Priya Sharma",  ticket: "B-002", joined: "6:18 PM", status: "Waiting" },
    ],
    3: [],
  };

  /* ══════════════════════════════════════════════════════════
    NOTIFICATION HOOK
    — extract this + ToastContainer into shared files to reuse on user side
  ══════════════════════════════════════════════════════════ */
  function useNotifications() {
    const [toasts, setToasts] = useState([]);
    const [log, setLog] = useState([]); // persistent in-app log

    const push = useCallback((message, type = "info") => {
      const id = Date.now() + Math.random();
      const entry = {
        id, message, type,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        alive: true,
      };
      setToasts(t => [...t, entry]);
      setLog(l => [entry, ...l].slice(0, 30));
      setTimeout(() => {
        setToasts(t => t.map(x => x.id === id ? { ...x, alive: false } : x));
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 400);
      }, 4500);
    }, []);

    const dismiss = useCallback((id) => {
      setToasts(t => t.map(x => x.id === id ? { ...x, alive: false } : x));
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 400);
    }, []);

    const clearLog = useCallback(() => setLog([]), []);

    return { toasts, log, push, dismiss, clearLog };
  }

  /* ══════════════════════════════════════════════════════════
    TOAST CONTAINER
  ══════════════════════════════════════════════════════════ */
  const TOAST_META = {
    success: { accent: "#a855f7", icon: "✓", label: "Queue Update"   },
    warn:    { accent: "#f59e0b", icon: "!", label: "Status Change"   },
    error:   { accent: "#ef4444", icon: "✕", label: "Error"          },
    info:    { accent: "#a855f7", icon: "i", label: "Queue Update"    },
  };

  function ToastContainer({ toasts, dismiss }) {
    return (
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999,
        display: "flex", flexDirection: "column", gap: 10, width: 320, pointerEvents: "none" }}>
        {toasts.map(t => {
          const m = TOAST_META[t.type] || TOAST_META.info;
          return (
            <div key={t.id} style={{
              pointerEvents: "all",
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderLeft: `4px solid ${m.accent}`,
              borderRadius: 12,
              padding: "13px 14px",
              display: "flex", alignItems: "flex-start", gap: 11,
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              opacity: t.alive ? 1 : 0,
              transform: t.alive ? "translateX(0)" : "translateX(28px)",
              transition: "opacity .35s ease, transform .35s ease",
              fontFamily: "inherit",
            }}>
              <span style={{
                width: 24, height: 24, borderRadius: "50%",
                background: `${m.accent}22`, border: `1.5px solid ${m.accent}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, color: m.accent, flexShrink: 0,
              }}>{m.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: m.accent,
                  textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 2 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.4 }}>{t.message}</div>
              </div>
              <button onClick={() => dismiss(t.id)} style={{ background: "none", border: "none",
                color: "#4b5563", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>
                ×
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
    NOTIFICATIONS PANEL SCREEN
    Mirrors the "Notifications Summary" section from the user side
  ══════════════════════════════════════════════════════════ */
  function NotificationsScreen({ log, clearLog }) {
    const accentFor = { success: "#a855f7", warn: "#f59e0b", error: "#ef4444", info: "#a855f7" };
    const labelFor  = { success: "Queue Update", warn: "Status Change", error: "Error", info: "Queue Update" };

    return (
      <div>
        <h1 style={S.pageTitle}>Notifications</h1>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
            In-app activity log for queue and status changes.
          </p>
          {log.length > 0 && (
            <button onClick={clearLog} style={{ ...S.btnGhost, fontSize: 12, padding: "6px 12px" }}>
              Clear All
            </button>
          )}
        </div>

        {log.length === 0 ? (
          <div style={{ ...S.card, textAlign: "center", padding: "32px 20px" }}>
            <p style={{ color: "#6b7280", margin: 0, fontSize: 14 }}>No notifications yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {log.map(n => (
              <div key={n.id} style={{
                ...S.card, padding: "14px 18px",
                borderLeft: `4px solid ${accentFor[n.type] || "#a855f7"}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: accentFor[n.type] || "#a855f7",
                      textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>
                      {labelFor[n.type] || "Update"}
                    </div>
                    <div style={{ fontSize: 14, color: "#e5e7eb" }}>{n.message}</div>
                  </div>
                  <span style={{ fontSize: 11, color: "#4b5563", flexShrink: 0, paddingTop: 2 }}>{n.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
    SHARED STYLE TOKENS  — TableLine palette
  ══════════════════════════════════════════════════════════ */
  const PURPLE = "#a855f7";
  const S = {
    card:       { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20 },
    pageTitle:  { fontSize: 22, fontWeight: 700, color: "#ffffff", textAlign: "center", marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 700, color: "#ffffff", marginBottom: 16 },
    label:      { display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af",
                  textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 },
    inp:  (e) => ({ width: "100%", boxSizing: "border-box", background: "#0d0d0d",
                    border: `1px solid ${e ? "#ef444466" : "#2a2a2a"}`, borderRadius: 8,
                    padding: "10px 13px", color: "#e5e7eb", fontFamily: "inherit", fontSize: 14, outline: "none" }),
    btnPrimary: { background: PURPLE, color: "#fff", border: "none", borderRadius: 8,
                  padding: "10px 20px", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" },
    btnGhost:   { background: "transparent", color: "#9ca3af", border: "1px solid #2a2a2a", borderRadius: 8,
                  padding: "10px 18px", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" },
    btnDanger:  { background: "transparent", color: "#ef4444", border: "1px solid #ef444433", borderRadius: 8,
                  padding: "7px 14px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" },
    btnSuccess: { background: "transparent", color: "#22c55e", border: "1px solid #22c55e33", borderRadius: 8,
                  padding: "7px 14px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" },
    errText:    { margin: "5px 0 0", fontSize: 12, color: "#ef4444" },
  };

  /* ══════════════════════════════════════════════════════════
    SMALL REUSABLES
  ══════════════════════════════════════════════════════════ */
  const priorityColor = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

  function PriorityBadge({ level }) {
    const c = priorityColor[level] || "#9ca3af";
    return (
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px",
        padding: "3px 9px", borderRadius: 20, color: c, background: `${c}18`, border: `1px solid ${c}44` }}>
        {level}
      </span>
    );
  }

  function StatusPill({ open }) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700,
        color: open ? "#22c55e" : "#6b7280" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: open ? "#22c55e" : "#374151",
          boxShadow: open ? "0 0 6px #22c55e88" : "none", flexShrink: 0 }} />
        {open ? "Open" : "Closed"}
      </span>
    );
  }

  /* ══════════════════════════════════════════════════════════
    VALIDATION
  ══════════════════════════════════════════════════════════ */
  function validateService(f) {
    const e = {};
    if (!f.name.trim()) e.name = "Service name is required.";
    else if (f.name.trim().length > 100) e.name = "Max 100 characters.";
    if (!f.description.trim()) e.description = "Description is required.";
    const d = Number(f.duration);
    if (f.duration === "") e.duration = "Expected duration is required.";
    else if (isNaN(d) || d <= 0) e.duration = "Must be a positive number.";
    else if (!Number.isInteger(d)) e.duration = "Whole minutes only.";
    else if (d > 480) e.duration = "Max 480 minutes.";
    return e;
  }

  /* ══════════════════════════════════════════════════════════
    SERVICE MODAL
  ══════════════════════════════════════════════════════════ */
  function ServiceModal({ initial, onSave, onClose }) {
    const blank = { name: "", description: "", duration: "", priority: "medium" };
    const [form, setForm] = useState(initial ? { ...initial, duration: String(initial.duration) } : blank);
    const [errors, setErrors] = useState({});

    function set(k, v) {
      setForm(f => ({ ...f, [k]: v }));
      if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
    }

    function submit() {
      const e = validateService(form);
      if (Object.keys(e).length) { setErrors(e); return; }
      onSave({ ...form, duration: Number(form.duration) });
    }

    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 16,
          padding: 28, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,0.8)" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
              {initial ? "Edit Service" : "New Service"}
            </h2>
            <button onClick={onClose} style={{ background: "none", border: "none",
              color: "#6b7280", fontSize: 22, cursor: "pointer" }}>×</button>
          </div>

          {/* Name */}
          <div style={{ marginBottom: 18 }}>
            <label style={S.label}>Service Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="text" value={form.name} maxLength={105} placeholder="e.g. Standard Seating"
              onChange={e => set("name", e.target.value)} style={S.inp(errors.name)} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              {errors.name ? <span style={S.errText}>{errors.name}</span> : <span />}
              <span style={{ fontSize: 11, color: form.name.length > 100 ? "#ef4444" : "#374151" }}>
                {form.name.length}/100
              </span>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 18 }}>
            <label style={S.label}>Description <span style={{ color: "#ef4444" }}>*</span></label>
            <textarea value={form.description} rows={3} placeholder="Describe this seating option..."
              onChange={e => set("description", e.target.value)}
              style={{ ...S.inp(errors.description), resize: "vertical", minHeight: 80 }} />
            {errors.description && <p style={S.errText}>{errors.description}</p>}
          </div>

          {/* Duration */}
          <div style={{ marginBottom: 18 }}>
            <label style={S.label}>Expected Duration (minutes) <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="number" min="1" max="480" value={form.duration} placeholder="e.g. 15"
              onChange={e => set("duration", e.target.value)} style={S.inp(errors.duration)} />
            {errors.duration
              ? <p style={S.errText}>{errors.duration}</p>
              : <p style={{ margin: "4px 0 0", fontSize: 11, color: "#374151" }}>Whole minutes, max 480</p>}
          </div>

          {/* Priority */}
          <div style={{ marginBottom: 22 }}>
            <label style={S.label}>Priority Level</label>
            <select value={form.priority} onChange={e => set("priority", e.target.value)}
              style={{ ...S.inp(false), appearance: "none" }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={S.btnGhost}>Cancel</button>
            <button onClick={submit} style={S.btnPrimary}>
              {initial ? "Save Changes" : "Create Service"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
    SCREEN: DASHBOARD
  ══════════════════════════════════════════════════════════ */
  function Dashboard({ services, queues, setServices, notify }) {
    const totalWaiting = Object.values(queues).flat().length;
    const openCount    = services.filter(s => s.open).length;

    function toggle(svc) {
      setServices(p => p.map(s => s.id === svc.id ? { ...s, open: !s.open } : s));
      notify(`"${svc.name}" is now ${svc.open ? "closed" : "open"} for seating.`, svc.open ? "warn" : "success");
    }

    return (
      <div>
        <h1 style={S.pageTitle}>Admin Dashboard</h1>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total Services", value: services.length, color: "#ffffff" },
            { label: "Open Services",  value: openCount,       color: "#22c55e" },
            { label: "Guests Waiting", value: totalWaiting,    color: PURPLE    },
          ].map(s => (
            <div key={s.label} style={{ ...S.card, textAlign: "center", padding: "16px 10px" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Services list */}
        <div style={S.card}>
          <h2 style={S.sectionTitle}>Active Services</h2>
          {services.map((svc, i) => (
            <div key={svc.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexWrap: "wrap", gap: 10, padding: "14px 0",
              borderTop: i === 0 ? "none" : "1px solid #2a2a2a",
            }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                  <span style={{ fontWeight: 700, color: "#e5e7eb", fontSize: 15 }}>{svc.name}</span>
                  <PriorityBadge level={svc.priority} />
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "#6b7280" }}>
                  <StatusPill open={svc.open} />
                  <span>·</span>
                  <span>{(queues[svc.id] || []).length} waiting</span>
                  <span>·</span>
                  <span>{svc.duration} min avg</span>
                </div>
              </div>
              <button onClick={() => toggle(svc)} style={svc.open ? S.btnDanger : S.btnSuccess}>
                {svc.open ? "Close Queue" : "Open Queue"}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
    SCREEN: SERVICE MANAGEMENT
  ══════════════════════════════════════════════════════════ */
  function ServicesScreen({ services, setServices, notify }) {
    const [modal, setModal] = useState(null);

    function handleSave(data) {
      if (modal === "new") {
        setServices(p => [...p, { ...data, id: Date.now(), open: true }]);
        notify(`"${data.name}" added to services.`, "success");
      } else {
        setServices(p => p.map(s => s.id === modal.id ? { ...s, ...data } : s));
        notify(`"${data.name}" updated.`, "info");
      }
      setModal(null);
    }

    function handleDelete(svc) {
      if (!window.confirm(`Remove "${svc.name}"?`)) return;
      setServices(p => p.filter(s => s.id !== svc.id));
      notify(`"${svc.name}" removed.`, "warn");
    }

    return (
      <div>
        <h1 style={S.pageTitle}>Service Management</h1>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <button onClick={() => setModal("new")} style={S.btnPrimary}>+ Add New Service</button>
        </div>

        {services.length === 0 && (
          <div style={{ ...S.card, textAlign: "center" }}>
            <p style={{ color: "#6b7280", margin: 0 }}>No services yet. Add one above.</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {services.map(svc => (
            <div key={svc.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>{svc.name}</span>
                    <PriorityBadge level={svc.priority} />
                    <StatusPill open={svc.open} />
                  </div>
                  <p style={{ margin: "0 0 10px", fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>
                    {svc.description}
                  </p>
                  <span style={{ fontSize: 12, color: "#6b7280", background: "#111",
                    border: "1px solid #2a2a2a", borderRadius: 6, padding: "3px 10px" }}>
                    ⏱ {svc.duration} min / table
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setModal(svc)} style={S.btnGhost}>Edit</button>
                  <button onClick={() => handleDelete(svc)} style={S.btnDanger}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {modal && (
          <ServiceModal
            initial={modal === "new" ? null : modal}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
    SCREEN: QUEUE MANAGEMENT
  ══════════════════════════════════════════════════════════ */
  function QueueScreen({ services, queues, setQueues, notify }) {
    const [selectedId, setSelectedId] = useState(services[0]?.id || null);
    const [dragIdx, setDragIdx] = useState(null);
    const [overIdx, setOverIdx] = useState(null);

    const svc   = services.find(s => s.id === selectedId);
    const queue = queues[selectedId] || [];

    function serveNext() {
      if (!queue.length) { notify("No guests in this queue.", "warn"); return; }
      const guest = queue[0];
      setQueues(q => ({ ...q, [selectedId]: q[selectedId].slice(1) }));
      notify(`Now seating: ${guest.name} (${guest.ticket})`, "success");
    }

    function remove(uid) {
      const guest = queue.find(x => x.id === uid);
      setQueues(q => ({ ...q, [selectedId]: q[selectedId].filter(x => x.id !== uid) }));
      notify(`${guest?.name || "Guest"} removed from queue.`, "warn");
    }

    function move(idx, dir) {
      const arr = [...queue];
      const t = idx + dir;
      if (t < 0 || t >= arr.length) return;
      [arr[idx], arr[t]] = [arr[t], arr[idx]];
      setQueues(q => ({ ...q, [selectedId]: arr }));
      notify("Queue order updated.", "info");
    }

    function onDrop(toIdx) {
      if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setOverIdx(null); return; }
      const arr = [...queue];
      const [moved] = arr.splice(dragIdx, 1);
      arr.splice(toIdx, 0, moved);
      setQueues(q => ({ ...q, [selectedId]: arr }));
      notify("Queue reordered.", "info");
      setDragIdx(null); setOverIdx(null);
    }

    return (
      <div>
        <h1 style={S.pageTitle}>Queue Management</h1>

        {/* Service selector */}
        <div style={{ ...S.card, marginBottom: 16 }}>
          <h2 style={{ ...S.sectionTitle, fontSize: 15, marginBottom: 12 }}>Select Service</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {services.map(s => {
              const active = selectedId === s.id;
              return (
                <button key={s.id} onClick={() => setSelectedId(s.id)} style={{
                  padding: "9px 16px", borderRadius: 8, fontFamily: "inherit", fontSize: 13,
                  fontWeight: 700, cursor: "pointer", transition: "all .15s",
                  background: active ? PURPLE : "transparent",
                  color: active ? "#fff" : "#9ca3af",
                  border: `1px solid ${active ? PURPLE : "#2a2a2a"}`,
                }}>
                  {s.name}
                  <span style={{ marginLeft: 6, fontSize: 11, opacity: .75 }}>
                    ({(queues[s.id] || []).length})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {svc && (
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
              <div>
                <h2 style={{ ...S.sectionTitle, marginBottom: 6 }}>{svc.name}</h2>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <StatusPill open={svc.open} />
                  <PriorityBadge level={svc.priority} />
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{svc.duration} min avg</span>
                </div>
              </div>
              <button onClick={serveNext}
                style={{ ...S.btnPrimary, opacity: queue.length ? 1 : 0.45 }}>
                ▶ Serve Next Guest
              </button>
            </div>

            {queue.length === 0 ? (
              <p style={{ textAlign: "center", color: "#4b5563", fontSize: 14, padding: "20px 0", margin: 0 }}>
                No guests currently in this queue.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {queue.map((guest, i) => (
                  <div key={guest.id}
                    draggable
                    onDragStart={() => setDragIdx(i)}
                    onDragOver={e => { e.preventDefault(); setOverIdx(i); }}
                    onDrop={() => onDrop(i)}
                    onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                      background: overIdx === i ? "#252525" : i === 0 ? "#1e1427" : "#111",
                      border: `1px solid ${overIdx === i ? PURPLE : i === 0 ? "#a855f733" : "#2a2a2a"}`,
                      borderRadius: 10, padding: "12px 14px", cursor: "grab", transition: "all .15s",
                    }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: i === 0 ? PURPLE : "#374151",
                      width: 26, textAlign: "center", flexShrink: 0 }}>{i + 1}</span>

                    <span style={{ fontFamily: "monospace", fontSize: 12, color: PURPLE,
                      background: "#a855f711", borderRadius: 6, padding: "3px 8px", flexShrink: 0 }}>
                      {guest.ticket}
                    </span>

                    <div style={{ flex: 1, minWidth: 100 }}>
                      <div style={{ fontWeight: 700, color: "#e5e7eb", fontSize: 14 }}>
                        {i === 0 && (
                          <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 800,
                            textTransform: "uppercase", marginRight: 6, letterSpacing: ".5px" }}>
                            ● Next
                          </span>
                        )}
                        {guest.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#4b5563" }}>Joined: {guest.joined}</div>
                    </div>

                    <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b",
                      background: "#f59e0b11", borderRadius: 20, padding: "3px 10px",
                      border: "1px solid #f59e0b33", flexShrink: 0 }}>
                      {guest.status}
                    </span>

                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button onClick={() => move(i, -1)} title="Move up"
                        style={{ ...S.btnGhost, padding: "5px 10px", fontSize: 12 }}>↑</button>
                      <button onClick={() => move(i, 1)} title="Move down"
                        style={{ ...S.btnGhost, padding: "5px 10px", fontSize: 12 }}>↓</button>
                      <button onClick={() => remove(guest.id)} style={S.btnDanger}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p style={{ margin: "12px 0 0", fontSize: 11, color: "#374151", textAlign: "center" }}>
              Drag rows to reorder · Use ↑↓ buttons · "Serve Next" seats the first guest
            </p>
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
    NAV TABS
  ══════════════════════════════════════════════════════════ */
  const TABS = [
    { id: "dashboard",     label: "Dashboard"      },
    { id: "services",      label: "Services"        },
    { id: "queue",         label: "Queue"           },
    { id: "notifications", label: "Notifications"   },
  ];

  /* ══════════════════════════════════════════════════════════
    ROOT
  ══════════════════════════════════════════════════════════ */
  export default function App() {
    const [screen, setScreen] = useState("dashboard");
    const [services, setServices] = useState(SEED_SERVICES);
    const [queues, setQueues]     = useState(SEED_QUEUES);
    const { toasts, log, push: notify, dismiss, clearLog } = useNotifications();

    // keep queue map in sync when services are added
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/services');
        const result = await response.json();
        if (result.success) {
          setServices(result.data); // This fills the dropdown!
        }
      } catch (error) {
        console.error("Error connecting to backend:", error);
      }
    };
    fetchServices();
  }, []);

    const props = { services, setServices, queues, setQueues, notify };

    return (
      <>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #000000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif; }
          input:focus, textarea:focus, select:focus { border-color: #a855f7 !important; outline: none; box-shadow: 0 0 0 3px rgba(168,85,247,0.15); }
          input[type=number]::-webkit-inner-spin-button { opacity: .5; }
          select option { background: #1a1a1a; }
          ::-webkit-scrollbar { width: 5px; }
          ::-webkit-scrollbar-track { background: #000; }
          ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
        `}</style>

        <ToastContainer toasts={toasts} dismiss={dismiss} />

        <div style={{ minHeight: "100vh", background: "#000", maxWidth: 720, margin: "0 auto", paddingBottom: 40 }}>


          {/* ── NAV TABS — matches user side tabs ── */}
          <div style={{ display: "flex", gap: 8, padding: "12px 20px",
            borderBottom: "1px solid #1a1a1a", overflowX: "auto" }}>
            {TABS.map(tab => {
              const active = screen === tab.id;
              return (
                <button key={tab.id} onClick={() => setScreen(tab.id)} style={{
                  padding: "9px 18px", borderRadius: 8, border: "1px solid #2a2a2a",
                  background: active ? "#ffffff" : "#1a1a1a",
                  color: active ? "#000000" : "#9ca3af",
                  fontFamily: "inherit", fontSize: 14, fontWeight: active ? 700 : 500,
                  cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s", flexShrink: 0,
                }}>
                  {tab.label}
                  {tab.id === "notifications" && log.length > 0 && (
                    <span style={{ marginLeft: 6, background: PURPLE, color: "#fff",
                      borderRadius: 10, fontSize: 11, fontWeight: 800, padding: "1px 7px" }}>
                      {log.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── PAGE CONTENT ── */}
          <div style={{ padding: "24px 20px" }}>
            {screen === "dashboard"     && <Dashboard      {...props} />}
            {screen === "services"      && <ServicesScreen  {...props} />}
            {screen === "queue"         && <QueueScreen     {...props} />}
            {screen === "notifications" && <NotificationsScreen log={log} clearLog={clearLog} />}
          </div>
        </div>
      </>
    );
  }