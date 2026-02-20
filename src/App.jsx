// src/App.jsx
import { useState } from 'react';
import { mockServices, mockUserStatus } from './mockData';
import AdminService from './AdminService';
import './App.css';
import Login from "./Login";
import Register from "./Register";


function App() {
  const [view, setView] = useState('user'); // Toggle between 'user' and 'admin'
  const [screen, setScreen] = useState("login"); // login | register | app

  if (screen === "login") {
  return (
    <Login
      onLogin={() => setScreen("app")}
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

  return (
    <div className="app-container" style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #a855f7', paddingBottom: '10px' }}>
        <h1 style={{ color: '#a855f7' }}>TableLine</h1>
        <button onClick={() => setView(view === 'user' ? 'admin' : 'user')}>
          Switch to {view === 'user' ? 'Admin' : 'User'} View
        </button
          
        <button onClick={() => setScreen("login")}>
          Logout
        </button>
      </header>

      {view === 'user' ? (
        <section className="user-dashboard">
          <h2>Your Status: {mockUserStatus.status}</h2>
          <p>Position in Queue: <strong>{mockUserStatus.position}</strong></p>
          <p>Est. Wait: {mockUserStatus.waitTime}</p>
          
          <h3>Available Seating</h3>
          <div className="grid">
            {mockServices.map(s => (
              <div key={s.id} className="card" style={{ border: '1px solid #333', padding: '10px', margin: '10px 0' }}>
                <h4>{s.name}</h4>
                <p>{s.description}</p>
                <button className="btn-join">Join Waitlist</button>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="admin-dashboard">
          <AdminService />
          <h3>Active Queues</h3>
          {mockServices.map(s => (
            <p key={s.id}>{s.name}: {s.currentQueue} parties waiting</p>
          ))}
        </section>
      )}
    </div>
  );
}

export default App;
