// queueLogic.test.js
const { estimateWaitTime } = require('./queueLogic');

describe('Wait-Time Estimation Logic', () => {
  
  test('accurately calculates wait time for standard position', () => {
    const mockService = { id: 1, name: "Standard Seating", duration: 15 };
    const position = 3;
    // 3rd in line * 15 minutes = 45 minutes
    expect(estimateWaitTime(mockService, position)).toBe(45);
  });

  test('returns 0 if service object is invalid or missing', () => {
    expect(estimateWaitTime(null, 3)).toBe(0);
    expect(estimateWaitTime({ name: "Broken Service" }, 3)).toBe(0);
  });

  test('returns 0 if position is zero or negative', () => {
    const mockService = { id: 2, duration: 45 };
    expect(estimateWaitTime(mockService, 0)).toBe(0);
    expect(estimateWaitTime(mockService, -2)).toBe(0);
  });

});