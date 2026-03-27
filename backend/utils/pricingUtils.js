/**
 * Calculate total cost of a booking taking weekend prices into account.
 * Weekends are generally considered Friday night to Sunday night, 
 * but for daily rentals we often consider Saturday and Sunday as weekend days.
 * 
 * @param {Date|string} startDate 
 * @param {Date|string} endDate 
 * @param {number} basePrice 
 * @param {number} weekendPrice (Optional) overrides basePrice for weekends
 * @returns {number} totalCost
 */
const calculateTotalCost = (startDate, endDate, basePrice, weekendPrice) => {
    let cost = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    // Normalize times to compare just the dates safely
    current.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    const wp = weekendPrice > 0 ? weekendPrice : basePrice;

    // Loop through each day from start (inclusive) to end (exclusive, 
    // unless someone rents for 0 days, which we handle by enforcing min 1 day elsewhere)
    // If start == end, totalDays = 0 normally. We use diff logic in availabilityUtils for days.
    // To match how the frontend calculates "differenceInCalendarDays", we do i < totalDays
    
    // Safe duration calculation
    const diffTime = Math.abs(end - current);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (totalDays === 0) return 0;

    for (let i = 0; i < totalDays; i++) {
        const dayOfWeek = current.getDay(); // 0 is Sunday, 6 is Saturday
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            cost += wp;
        } else {
            cost += basePrice;
        }
        current.setDate(current.getDate() + 1);
    }

    return cost;
};

module.exports = { calculateTotalCost };
