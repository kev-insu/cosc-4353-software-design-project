// src/App.jsx
import { useCallback, useMemo, useState, useEffect } from "react";

import AdminService from "./AdminService";
import "./App.css";
import { fetchServices, getDisplayError, isAbortError, joinQueue } from "./api";
import Login from "./Login";
import Register from "./Register";

// USER SCREENS
import UserDashboard from "./user/UserDashboard";
import JoinQueue from "./user/JoinQueue";
import QueueStatus from "./user/QueueStatus";
import History from "./user/History";

function App() {
  const [view, setView] = useState("user");
  const [screen, setScreen] = useState("login");
  const [userScreen, setUserScreen] = useState("dashboard");
  const [currentRole, setCurrentRole] = useState("user");

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [servicesLoadedOnce, setServicesLoadedOnce] = useState(false);
  const [joinQueuePending, setJoinQueuePending] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [inQueue, setInQueue] = useState(false);
  const [queueStatus, setQueueStatus] = useState({
    status: "not in queue",
    position: 0,
    waitTime: "0 min",
  });
  const [history, setHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const selectedService = useMemo(() => {
    return services.find((service) => String(service.id) === String(selectedServiceId)) || null;
  }, [services, selectedServiceId]);

  const isAdministrator = useMemo(() => {
    return ["admin", "administrator"].includes(String(currentRole || "").toLowerCase());
  }, [currentRole]);

  const addNotification = (message) => {
    setNotifications((prev) => [message, ...prev]);
  };

  const loadServices = useCallback(async ({ keepExisting = false, signal } = {}) => {
    setServicesLoading(true);
    setServicesError("");

    try {
      const nextServices = await fetchServices({ signal });
      setServices(nextServices);
      setServicesLoadedOnce(true);
      return nextServices;
    } catch (error) {
      if (isAbortError(error)) {
        return null;
      }

      console.error("Error fetching services:", error);

      if (!keepExisting) {
        setServices([]);
      }

      setServicesError(
        getDisplayError(error, "Unable to load services right now. Please try again.")
      );
      return null;
    } finally {
      setServicesLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadServices({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [loadServices]);

  const getServiceDuration = (service) =>
    Number(service?.expectedDuration ?? service?.duration ?? service?.minutes ?? 15) || 15;

  const getServiceQueueLen = (service) =>
    Number(service?.currentQueue ?? service?.queueLength ?? service?.queue ?? 0) || 0;

  const estimateWait = (service) => `${getServiceQueueLen(service) * getServiceDuration(service)} min`;

  const handleJoin = async () => {
    if (!selectedService) {
      addNotification("Please select a service before joining.");
      return;
    }

    if (!selectedService.open) {
      addNotification(`${selectedService.name} is currently unavailable.`);
      return;
    }

    setJoinQueuePending(true);

    try {
      const data = await joinQueue({
        serviceId: selectedService.id,
        guestName: "Guest User",
      });

      setInQueue(true);
      setQueueStatus({
        status: "waiting",
        position: data.position,
        waitTime: `${data.estimatedWaitMinutes} min`,
      });

      addNotification(`Joined ${selectedService.name}. Ticket: ${data.ticket}`);
      setUserScreen("status");
      await loadServices({ keepExisting: true });
    } catch (error) {
      console.error("Failed to join queue:", error);
      addNotification(getDisplayError(error, "Network error. Is the backend running?"));
    } finally {
      setJoinQueuePending(false);
    }
  };

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

      if (next === "served") {
        setHistory((entries) => [
          {
            date: new Date().toLocaleString(),
            serviceName: selectedService.name,
            outcome: "served",
          },
          ...entries,
        ]);
        setInQueue(false);
        return { status: "served", position: 0, waitTime: "0 min" };
      }

      return { ...prev, status: next };
    });
  };

  if (screen === "login") {
    return (
      <Login
        onLogin={(email, role) => {
          setCurrentRole(role);
          setView(["admin", "administrator"].includes(String(role || "").toLowerCase()) ? "admin" : "user");
          setScreen("app");
        }}
        goRegister={() => setScreen("register")}
      />
    );
  }

  if (screen === "register") {
    return <Register onRegister={() => setScreen("app")} goLogin={() => setScreen("login")} />;
  }

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
          {isAdministrator && (
            <button onClick={() => setView(view === "user" ? "admin" : "user")}>
              Switch to {view === "user" ? "Admin" : "User"} View
            </button>
          )}

          <button
            onClick={() => {
              setScreen("login");
              setView("user");
              setCurrentRole("user");
              setUserScreen("dashboard");
              setSelectedServiceId(null);
              setInQueue(false);
              setQueueStatus({ status: "not in queue", position: 0, waitTime: "0 min" });
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {view === "user" ? (
        <section style={{ marginTop: 16 }}>
          <nav style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button onClick={() => setUserScreen("dashboard")}>Dashboard</button>
            <button onClick={() => setUserScreen("join")}>Join Queue</button>
            <button onClick={() => setUserScreen("status")}>Queue Status</button>
            <button onClick={() => setUserScreen("history")}>History</button>
          </nav>

          {userScreen === "dashboard" && (
            <UserDashboard
              services={services}
              servicesLoading={servicesLoading}
              servicesError={servicesError}
              servicesLoadedOnce={servicesLoadedOnce}
              inQueue={inQueue}
              selectedService={selectedService}
              queueStatus={queueStatus}
              notifications={notifications}
              retryServices={() => loadServices({ keepExisting: services.length > 0 })}
              goJoin={() => setUserScreen("join")}
            />
          )}

          {userScreen === "join" && (
            <JoinQueue
              services={services}
              servicesLoading={servicesLoading}
              servicesError={servicesError}
              joinPending={joinQueuePending}
              retryServices={() => loadServices({ keepExisting: services.length > 0 })}
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
          {isAdministrator ? (
            <AdminService role={currentRole} />
          ) : (
            <div style={{ border: "1px solid #ef444466", padding: 20, borderRadius: 8 }}>
              Administrator access is required.
            </div>
          )}
          <h3 style={{ marginTop: 18 }}>Active Queues</h3>
          {services.map((service) => (
            <p key={service.id}>
              {service.name}: {service.currentQueue ?? 0} parties waiting
            </p>
          ))}
        </section>
      )}
    </div>
  );
}

export default App;
