import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { updateListingAvailability } from '../services/api';
import toast from 'react-hot-toast';

// Basic custom styles to override react-calendar defaults
const customStyles = `
  .react-calendar { border: none; font-family: inherit; width: 100%; border-radius: 0.5rem; }
  .react-calendar__tile--active { background: #3b82f6 !important; color: white !important; }
  .react-calendar__tile--now { background: #eff6ff; }
  .calendar-blocked { background: #fee2e2 !important; color: #ef4444 !important; text-decoration: line-through; }
  .calendar-booked { background: #000000 !important; color: white !important; cursor: not-allowed; }
`;

const AvailabilityCalendar = ({ listingId, isOwner, initialBookedStatus = [] }) => {
    // blockedDates is an array of date strings from the owner
    const [blockedDates, setBlockedDates] = useState([]);
    // activeBookings is an array of dates blocked by renter bookings (CONFIRMED/ACTIVE/PENDING)
    const [activeBookings, setActiveBookings] = useState([]);
    
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Parse the initialBookedStatus from getListingAvailability
        const ownerBlocked = [];
        const renterBooked = [];

        initialBookedStatus.forEach(b => {
            if (b.status === 'BLOCKED') {
                ownerBlocked.push(new Date(b.startDate).toDateString());
            } else {
                // expanding date ranges for bookings
                let curr = new Date(b.startDate);
                const end = new Date(b.endDate);
                while (curr <= end) {
                    renterBooked.push(curr.toDateString());
                    curr.setDate(curr.getDate() + 1);
                }
            }
        });

        setBlockedDates(ownerBlocked);
        setActiveBookings(renterBooked);
    }, [initialBookedStatus]);

    const handleDateClick = (value) => {
        if (!isOwner) return; // Renters cannot edit
        
        const dateStr = value.toDateString();
        
        // Cannot toggle dates that are actively booked by renters
        if (activeBookings.includes(dateStr)) {
            toast.error("You cannot block a date that is already booked or pending.");
            return;
        }

        setBlockedDates(prev => {
            if (prev.includes(dateStr)) {
                return prev.filter(d => d !== dateStr);
            } else {
                return [...prev, dateStr];
            }
        });
    };

    const handleSave = async () => {
        if (!isOwner) return;
        setLoading(true);
        try {
            await updateListingAvailability(listingId, blockedDates);
            toast.success("Availability updated successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update availability");
        } finally {
            setLoading(false);
        }
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = date.toDateString();
            if (activeBookings.includes(dateStr)) return 'calendar-booked';
            if (blockedDates.includes(dateStr)) return 'calendar-blocked';
        }
        return null;
    };

    const tileDisabled = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = date.toDateString();
            // In read-only (renter view) or owner view, don't rigidly disable, just use styling
            // unless we want to physically prevent clicks. 
            // For owner, we prevent clicks on activeBookings in handleDateClick.
            // For renter, we just disable past dates.
            return date < new Date(new Date().setHours(0,0,0,0));
        }
        return false;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <style>{customStyles}</style>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-800 text-sm">Vehicle Availability</h3>
                {isOwner && (
                    <button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Dates'}
                    </button>
                )}
            </div>
            <div className="p-4">
                <Calendar 
                    onClickDay={handleDateClick}
                    tileClassName={tileClassName}
                    tileDisabled={tileDisabled}
                    minDetail="month"
                    prev2Label={null}
                    next2Label={null}
                />
                
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-black"></span> Booked
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></span> Holiday {isOwner ? '(Click to toggle)' : ''}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-white border border-gray-200"></span> Available
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AvailabilityCalendar;
