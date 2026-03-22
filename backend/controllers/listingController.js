const Listing = require('../models/Listing');

/**
 * @desc    Get all listings with filters, search, sorting, pagination
 * @route   GET /api/listings
 * @access  Public
 */
const getListings = async (req, res, next) => {
    try {
        const {
            search, type, fuelType, transmission,
            minPrice, maxPrice, seats,
            sort = 'pricePerDay', order = 'asc',
            page = 1, limit = 10, city,
        } = req.query;

        const query = {};

        if (search) {
            query.$text = { $search: search };
        }
        if (type) query.type = type;
        if (fuelType) query.fuelType = fuelType;
        if (transmission) query.transmission = transmission;
        if (city) query['location.city'] = { $regex: city, $options: 'i' };
        if (seats) query.seats = { $gte: Number(seats) };

        if (minPrice || maxPrice) {
            query.pricePerDay = {};
            if (minPrice) query.pricePerDay.$gte = Number(minPrice);
            if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
        }

        const sortOrder = order === 'desc' ? -1 : 1;
        const sortOptions = { [sort]: sortOrder };

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Listing.countDocuments(query);

        const listings = await Listing.find(query)
            .populate('owner', 'username email licenseType')
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit));

        res.json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            data: listings,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single listing by ID
 * @route   GET /api/listings/:id
 * @access  Public
 */
const getListingById = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id).populate('owner', 'username email licenseType');
        if (!listing) return res.status(404).json({ success: false, message: 'Vehicle not found' });
        res.json({ success: true, data: listing });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a new vehicle listing
 * @route   POST /api/listings
 * @access  Private (owner/admin)
 */
const createListing = async (req, res, next) => {
    try {
        const {
            name, type, description, pricePerDay,
            brand, model, year, seats, fuelType, transmission, mileage,
            imageUrl, images, location,
        } = req.body;

        const listing = await Listing.create({
            name, type, description, pricePerDay,
            brand, model, year,
            seats: seats || 5,
            fuelType: fuelType || 'PETROL',
            transmission: transmission || 'MANUAL',
            mileage: mileage || 0,
            imageUrl, images,
            location,
            owner: req.user._id,
        });

        res.status(201).json({ success: true, data: listing });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a listing
 * @route   PUT /api/listings/:id
 * @access  Private (owner/admin)
 */
const updateListing = async (req, res, next) => {
    try {
        let listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ success: false, message: 'Vehicle not found' });

        const isOwner = listing.owner.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to update this listing' });
        }

        listing = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json({ success: true, data: listing });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a listing
 * @route   DELETE /api/listings/:id
 * @access  Private (owner/admin)
 */
const deleteListing = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ success: false, message: 'Vehicle not found' });

        const isOwner = listing.owner.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await listing.deleteOne();
        res.json({ success: true, message: 'Vehicle listing removed' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Search vehicles nearby (geospatial)
 * @route   GET /api/listings/nearby
 * @access  Public
 */
const getNearbyListings = async (req, res, next) => {
    try {
        const { lng, lat, radius = 50 } = req.query;
        if (!lng || !lat) return res.status(400).json({ success: false, message: 'Please provide lng and lat' });

        const listings = await Listing.find({
            'location.coordinates': {
                $near: {
                    $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
                    $maxDistance: parseFloat(radius) * 1000,
                },
            },
        }).populate('owner', 'username').limit(30);

        res.json({ success: true, count: listings.length, data: listings });
    } catch (error) {
        next(error);
    }
};

module.exports = { getListings, getListingById, createListing, updateListing, deleteListing, getNearbyListings };
