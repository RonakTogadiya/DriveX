const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String, required: [true, 'Username is required'],
            unique: true, trim: true, minlength: 3, maxlength: 30,
        },
        email: {
            type: String, required: [true, 'Email is required'],
            unique: true, lowercase: true, trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        // ── Auth & Role ───────────────────────────────────────────────────
        passwordHash: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
            select: false,
        },
        role: {
            type: String,
            enum: ['renter', 'owner', 'admin'],
            default: 'renter',
        },
        approvalStatus: {
            type: String,
            enum: ['APPROVED', 'PENDING', 'REJECTED'],
            default: 'APPROVED',
        },
        isBlocked: { type: Boolean, default: false },

        // ── Profile details ───────────────────────────────────────────────
        phone: { type: String, trim: true },
        address: { type: String, trim: true },
        avatar: { type: String },
        bio: { type: String },

        // ── Verification ──────────────────────────────────────────────────
        isVerified: { type: Boolean, default: false },
        // Stats
        totalRentals: { type: Number, default: 0 },
        totalDaysRented: { type: Number, default: 0 },

        // Wishlist
        wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],

        // Initial vehicle for owner registration (admin review)
        initialVehicle: {
            name: { type: String },
            brand: { type: String },
            model: { type: String },
            year: { type: Number },
            type: { type: String },
            fuelType: { type: String },
            pricePerDay: { type: Number },
        },
    },
    { timestamps: true }
);

// ── Password hashing ──────────────────────────────────────────────────
UserSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);
