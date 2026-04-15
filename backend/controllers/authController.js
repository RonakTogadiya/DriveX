const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
    try {
        const { username, email, password, role, phone, initialVehicle } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide username, email, and password' });
        }

        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: existing.email === email ? 'Email already registered' : 'Username already taken',
            });
        }

        // Owner registration requires admin approval
        const isOwner = role === 'owner';
        const approvalStatus = isOwner ? 'PENDING' : 'APPROVED';

        // Validate owner must provide initial vehicle
        if (isOwner) {
            if (!initialVehicle || !initialVehicle.name || !initialVehicle.brand || !initialVehicle.model || !initialVehicle.pricePerDay) {
                return res.status(400).json({ success: false, message: 'Owner registration requires vehicle details (name, brand, model, pricePerDay)' });
            }
        }

        const user = await User.create({
            username,
            email,
            passwordHash: password,
            role: role || 'renter',
            phone: phone || '',
            approvalStatus,
            initialVehicle: isOwner ? initialVehicle : undefined,
        });

        // If owner, don't return token — they must wait for admin approval
        if (isOwner) {
            return res.status(201).json({
                success: true,
                pendingApproval: true,
                message: 'Registration submitted successfully! Your account is pending admin approval. You will be notified once approved.',
            });
        }

        // Renter — auto-approved, return token
        const token = generateToken(user._id);
        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                totalRentals: user.totalRentals,
                token,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Login
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).select('+passwordHash');
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Check approval status for owners
        if (user.approvalStatus === 'PENDING') {
            return res.status(403).json({ success: false, message: 'Your account is pending admin approval. Please wait for the admin to verify your registration.' });
        }
        if (user.approvalStatus === 'REJECTED') {
            return res.status(403).json({ success: false, message: 'Your registration has been rejected by the admin. Please contact support for more information.' });
        }

        // Check if user is blocked
        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: 'Your account has been blocked. Please contact support.' });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                totalRentals: user.totalRentals,
                token,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
    res.json({ success: true, data: req.user });
};

module.exports = { registerUser, loginUser, getMe };
