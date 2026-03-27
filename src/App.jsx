// src/App.jsx
import { useMemo, useState, useEffect } from "react";

import AdminService from "./AdminService";
import "./App.css";
import Login from "./Login";
import Register from "./Register";

// USER SCREENS
import UserDashboard from "./user/UserDashboard";
import JoinQueue from "./user/JoinQueue";
import QueueStatus from "./user/QueueStatus";
import History from "./user/History";

function App() {
  const [view, setView] = useState("user"); // 'user' or 'admin'
  const [screen, setScreen] = useState("login"); // login | register | app

  // Mini navigation for user screens
  const [userScreen, setUserScreen] = useState("dashboard"); // dashboard | join | status | history

  const [services, setServices] = useState([]);

// This hooks up to your GET /api/services endpoint
useEffect(() => {
  fetch("http://localhost:3000/api/services")
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        setServices(data.data);
      }
    })
    .catch((err) => console.error("Error fetching services:", err));
}, []);

  // Shared user "mock backend" state
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [inQueue, setInQueue] = useState(false);
  const [queueStatus, setQueueStatus] = useState({
    status: "waiting",
    position: 0,
    waitTime: "0 min",
  });
  const [history, setHistory] = useState([]); // { date, serviceName, outcome }
  const [notifications, setNotifications] = useState([]); // strings

  const selectedService = useMemo(() => {
    return services.find((s) => String(s.id) === String(selectedServiceId)) || null;
  }, [services, selectedServiceId]);

  const addNotification = (msg) => setNotifications((prev) => [msg, ...prev]);

  // Try to compute wait time using whatever fields exist (fallbacks included)
  const getServiceDuration = (s) =>
    Number(s?.expectedDuration ?? s?.duration ?? s?.minutes ?? 15) || 15;

  const getServiceQueueLen = (s) =>
    Number(s?.currentQueue ?? s?.queueLength ?? s?.queue ?? 0) || 0;

  const estimateWait = (s) => `${getServiceQueueLen(s) * getServiceDuration(s)} min`;

  // JOIN queue (UI simulation)
const handleJoin = async () => {
  if (!selectedService) {
    addNotification("Please select a service before joining.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/queue/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: selectedService.id,
        guestName: "Guest User" // In a full app, this comes from the Login state
      }),
    });

    const data = await response.json();

    if (data.success) {
      setInQueue(true);
      // The backend now calculates the wait time and position!
      setQueueStatus({ 
        status: "waiting", 
        position: data.position, 
        waitTime: `${data.estimatedWaitMinutes} min` 
      });

      addNotification(`Joined ${selectedService.name}. Ticket: ${data.ticket}`);
      setUserScreen("status");
    } else {
      addNotification(`Error: ${data.error}`);
    }
  } catch (err) {
    console.error("Failed to join queue:", err);
    addNotification("Network error. Is the backend running?");
  }
};

  // LEAVE queue (UI simulation)
  const handleLeave = (outcome = "left") => {
    const serviceName = selectedService?.name ?? "Unknown Service";

    if (inQueue || outcome === "served" || outcome === "removed") {
      setHistory((prev) => [
        { date: new Date().toLocaleString(), serviceName, outcome },
        ...prev,
      ]);
    }

    setInQueue(false);
    setQueueStatus({ status: outcome, position: 0, waitTime: "0 min" });
    addNotification(
      outcome === "served"
        ? `Served for ${serviceName}.`
        : outcome === "removed"
        ? `Removed from ${serviceName} queue.`
        : `Left ${serviceName} queue.`
    );

    setUserScreen("dashboard");
  };

  // Advance status simulation: waiting -> almost ready -> served
  const handleAdvanceStatus = () => {
    if (!selectedService || !inQueue) {
      addNotification("You are not currently in a queue.");
      return;
    }

    setQueueStatus((prev) => {
      const current = String(prev.status || "").toLowerCase();
      let next = "waiting";
      if (current === "waiting") next = "almost ready";
      else if (current === "almost ready") next = "served";
      else next = "served";

      addNotification(`Status update (${selectedService.name}): ${next}`);

      // When served, record history + end queue session
      if (next === "served") {
        // End queue and record history
        setHistory((h) => [
          { date: new Date().toLocaleString(), serviceName: selectedService.name, outcome: "served" },
          ...h,
        ]);
        setInQueue(false);
        return { status: "served", position: 0, waitTime: "0 min" };
      }

      return { ...prev, status: next };
    });
  };

  // -----------------------
  // Auth screens
  // -----------------------
if (screen === "login") {
    return (
      <Login
        onLogin={(email, role) => {
          setView(role); // Sets view to 'admin' or 'user' based on backend response
          setScreen("app");
        }}
        goRegister={() => setScreen("register")}
      />
    );
  }

  if (screen === "register") {
    return (
      <Register
        onRegister={() => setScreen("app")}
        goLogin={() => setScreen("login")}
      />
    );
  }

  // -----------------------
  // Main app
  // -----------------------
  return (
    <div
      className="app-container"
      style={{ backgroundColor: "#000", minHeight: "100vh", color: "#fff", padding: "20px" }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #a855f7",
          paddingBottom: "10px",
        }}
      >
        <h1 style={{ color: "#a855f7", margin: 0 }}>TableLine</h1>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setView(view === "user" ? "admin" : "user")}>
            Switch to {view === "user" ? "Admin" : "User"} View
          </button>

          <button
            onClick={() => {
              setScreen("login");
              setView("user");
              setUserScreen("dashboard");
              setSelectedServiceId(null);
              setInQueue(false);
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {view === "user" ? (
        <section style={{ marginTop: 16 }}>
          {/* USER NAV */}
          <nav style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button onClick={() => setUserScreen("dashboard")}>Dashboard</button>
            <button onClick={() => setUserScreen("join")}>Join Queue</button>
            <button onClick={() => setUserScreen("status")}>Queue Status</button>
            <button onClick={() => setUserScreen("history")}>History</button>
          </nav>

          {/* USER SCREENS */}
          {userScreen === "dashboard" && (
            <UserDashboard
              services={services}
              inQueue={inQueue}
              selectedService={selectedService}
              queueStatus={queueStatus}
              notifications={notifications}
              goJoin={() => setUserScreen("join")}
            />
          )}

          {userScreen === "join" && (
            <JoinQueue
              services={services}
              selectedServiceId={selectedServiceId}
              setSelectedServiceId={setSelectedServiceId}
              selectedService={selectedService}
              inQueue={inQueue}
              estimatedWait={selectedService ? estimateWait(selectedService) : "0 min"}
              onJoin={handleJoin}
              onLeave={() => handleLeave("left")}
              goStatus={() => setUserScreen("status")}
            />
          )}

          {userScreen === "status" && (
            <QueueStatus
              inQueue={inQueue}
              selectedService={selectedService}
              queueStatus={queueStatus}
              onAdvanceStatus={handleAdvanceStatus}
              onLeave={() => handleLeave("left")}
              goJoin={() => setUserScreen("join")}
            />
          )}

          {userScreen === "history" && <History history={history} />}
        </section>
      ) : (
        <section className="admin-dashboard" style={{ marginTop: 16 }}>
          <AdminService />
          <h3 style={{ marginTop: 18 }}>Active Queues</h3>
          {services.map((s) => (
            <p key={s.id}>{s.name}: {s.currentQueue ?? 0} parties waiting</p>
          ))}
        </section>
      )}
    </div>
  );
}

export default App;