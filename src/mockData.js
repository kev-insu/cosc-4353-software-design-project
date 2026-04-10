// src/mockData.js

// This export matches your App.jsx import
export const mockServices = [
  {
    id: 1,
    name: "Standard Seating",
    description: "Regular indoor table seating.",
    duration: 45,
    priority: "Medium",
    currentQueue: 5
  }
];

// ADD THIS EXPORT - this is what's causing the white screen!
export const mockUserStatus = {
  position: 3,
  waitTime: "15 mins",
  status: "Waiting"
};