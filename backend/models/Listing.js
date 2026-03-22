const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema(
    {
        // ── Core Info ─────────────────────────────────────────────────────
        name: { type: String, required: [true, 'Vehicle name is required'], trim: true },
        type: {
            type: String,
            enum: ['CAR', 'BIKE', 'SUV', 'TRUCK', 'VAN', 'SCOOTER'],
            required: true,
        },
        description: { type: String, trim: true, default: '' },

        // ── Pricing ───────────────────────────────────────────────────────
        pricePerDay: { type: Number, required: [true, 'Price per day is required'], min: 0 },

        // ── Vehicle Specs ─────────────────────────────────────────────────
        brand: { type: String, required: true, trim: true },
        model: { type: String, required: true, trim: true },
        year: { type: Number, required: true, min: 1990, max: new Date().getFullYear() + 1 },
        seats: { type: Number, default: 5, min: 1, max: 50 },
        fuelType: {
            type: String,
            enum: ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG'],
            default: 'PETROL',
        },
        transmission: { type: String, enum: ['MANUAL', 'AUTOMATIC'], default: 'MANUAL' },
        mileage: { type: Number, default: 0 }, // km (total odometer)

        // ── Owner & Availability ──────────────────────────────────────────
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        isAvailable: { type: Boolean, default: true },

        // ── Media ─────────────────────────────────────────────────────────
        imageUrl: { type: String },
        images: [{ type: String }],

        // ── Location ──────────────────────────────────────────────────────
        location: {
            address: { type: String },
            city: { type: String },
            country: { type: String },
            coordinates: {
                type: { type: String, enum: ['Point'], default: 'Point' },
                coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
            },
        },

        // ── Ratings ───────────────────────────────────────────────────────
        averageRating: { type: Number, default: 0, min: 0, max: 5 },
        numReviews: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Indexes
VehicleSchema.index({ 'location.coordinates': '2dsphere' });
VehicleSchema.index({ name: 'text', description: 'text', brand: 'text', model: 'text' });
VehicleSchema.index({ type: 1, isAvailable: 1 });
VehicleSchema.index({ owner: 1 });

module.exports = mongoose.model('Listing', VehicleSchema);
