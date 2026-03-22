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
        passwordHash: { type: String, required: true, select: false },

        role: { type: String, enum: ['renter', 'owner', 'admin'], default: 'renter' },

        // Driver details
        phone: { type: String, trim: true },
        licenseNumber: { type: String, trim: true },
        licenseType: { type: String, enum: ['STANDARD', 'COMMERCIAL'], default: 'STANDARD' },

        // Profile
        profilePicture: { type: String },
        bio: { type: String },
        isVerified: { type: Boolean, default: false },

        // Stats
        totalRentals: { type: Number, default: 0 },
        totalDaysRented: { type: Number, default: 0 },
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
