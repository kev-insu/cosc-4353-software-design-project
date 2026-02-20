// src/AdminService.jsx
import { useState } from 'react';

export default function AdminService() {
  const [name, setName] = useState('');

  return (
    <div className="admin-card" style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', color: '#fff' }}>
      <h2 style={{ color: '#a855f7' }}>Create New Service</h2>
      <form className="admin-form">
        <label>Service Name (Required, Max 100 chars)</label>
        <input 
          type="text" 
          maxLength="100" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Standard Seating"
          required 
        />

        <label>Description (Required)</label>
        <textarea required placeholder="Describe the seating type..." />

        <label>Expected Duration (Minutes, Required)</label>
        <input type="number" required min="1" placeholder="e.g., 45" />

        <label>Priority Level</label>
        <select required>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <button type="submit" className="btn-primary" style={{ backgroundColor: '#a855f7', color: 'white', marginTop: '10px' }}>
          Save Service
        </button>
      </form>
    </div>
  );
}