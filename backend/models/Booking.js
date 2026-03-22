const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
    {
        // ── References ────────────────────────────────────────────────────
        listing: {
            type: mongoose.Schema.Types.ObjectId, ref: 'Listing',
            required: [true, 'Listing is required'],
        },
        renter: {
            type: mongoose.Schema.Types.ObjectId, ref: 'User',
            required: [true, 'Renter is required'],
        },

        // ── Dates ─────────────────────────────────────────────────────────
        startDate: { type: Date, required: [true, 'Start date is required'] },
        endDate: { type: Date, required: [true, 'End date is required'] },

        // ── Pricing snapshot ──────────────────────────────────────────────
        pricePerDay: { type: Number, required: true },
        totalDays: { type: Number, required: true },
        totalCost: { type: Number, required: true },

        // ── Status ────────────────────────────────────────────────────────
        status: {
            type: String,
            enum: ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
            default: 'PENDING',
        },

        // ── Cancellation ──────────────────────────────────────────────────
        cancelledAt: { type: Date },
        cancelReason: { type: String },

        // ── Pickup/Return details ─────────────────────────────────────────
        pickupLocation: { type: String },
        notes: { type: String },
    },
    { timestamps: true }
);

// ── Validation: endDate must be after startDate ─────────────────────
BookingSchema.pre('save', function (next) {
    if (this.endDate <= this.startDate) {
        return next(new Error('End date must be after start date'));
    }
    next();
});

// ── Index for availability overlap queries (O(log n)) ────────────────
BookingSchema.index({ listing: 1, startDate: 1, endDate: 1 });
BookingSchema.index({ renter: 1, status: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
