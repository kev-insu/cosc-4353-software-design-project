import { mockServices } from './mockData';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <h2>User Dashboard</h2>
      <div className="services-grid">
        {mockServices.map(service => (
          <div key={service.id} className="service-card">
            <h3>{service.name}</h3>
            <p>{service.description}</p>
            <p><strong>Wait Time:</strong> ~{service.duration} mins</p>
            <button className="btn-primary">Join Queue</button>
          </div>
        ))}
      </div>
    </div>
  );
}