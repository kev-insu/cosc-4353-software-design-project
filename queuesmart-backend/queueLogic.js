// queueLogic.js

// The core algorithm: Wait Time = Position × Expected Duration
function estimateWaitTime(service, position) {
  if (!service || !service.duration) {
    return 0; // Fallback if data is missing
  }
  
  if (position <= 0) {
    return 0; // Can't have a negative or zero position
  }

  return position * service.duration;
}

module.exports = { estimateWaitTime };