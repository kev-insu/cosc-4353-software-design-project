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
import { PURPLE, U } from "./user/tokens";
import { UserTabBar } from "./user/UserChrome";

const USER_TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "join", label: "Join Queue" },
  { id: "status", label: "Queue Status" },
  { id: "history", label: "History" },
];

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
    <div style={U.shell}>
      <style>{`
        .app-header-btn {
          background: transparent;
          color: #9ca3af;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 8px 16px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .app-header-btn:hover { border-color: ${PURPLE}; color: #e5e7eb; }
        .app-header-btn--primary {
          background: ${PURPLE};
          color: #fff;
          border: none;
        }
        .app-header-btn--primary:hover { opacity: 0.92; color: #fff; }
      `}</style>
      <header
        style={{
          borderBottom: "1px solid #1a1a1a",
          padding: "14px 20px",
          position: "sticky",
          top: 0,
          background: "#000000ee",
          backdropFilter: "blur(8px)",
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              color: PURPLE,
              letterSpacing: "-0.02em",
            }}
          >
            TableLine
          </h1>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {isAdministrator && (
              <button
                type="button"
                className="app-header-btn app-header-btn--primary"
                onClick={() => setView(view === "user" ? "admin" : "user")}
              >
                {view === "user" ? "Admin view" : "User view"}
              </button>
            )}

            <button
              type="button"
              className="app-header-btn"
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
        </div>
      </header>

      {view === "user" ? (
        <section style={U.inner}>
          <UserTabBar tabs={USER_TABS} activeId={userScreen} onSelect={setUserScreen} />

          <div style={{ paddingTop: 20 }}>
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
          </div>
        </section>
      ) : (
        <section className="admin-dashboard" style={{ ...U.inner, paddingTop: 16 }}>
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
