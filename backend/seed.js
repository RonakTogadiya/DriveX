/**
 * DriveX Seed Script
 * Populates MongoDB with users, vehicle listings, and bookings (booked + available)
 * Run: node backend/seed.js
 */
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const Listing = require('./models/Listing');
const Booking = require('./models/Booking');

const MONGO_OPTIONS = {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    family: 4,
};

// ── Test Users ─────────────────────────────────────────────────────────
const USERS = [
    { username: 'rahulsharma', email: 'rahul@drivex.com', passwordHash: 'DriveX@123', role: 'owner', phone: '9876543210' },
    { username: 'priyajoshi', email: 'priya@drivex.com', passwordHash: 'DriveX@123', role: 'owner', phone: '9876543211' },
    { username: 'amitmehta', email: 'amit@drivex.com', passwordHash: 'DriveX@123', role: 'renter', phone: '9876543212' },
    { username: 'snehaverma', email: 'sneha@drivex.com', passwordHash: 'DriveX@123', role: 'renter', phone: '9876543213' },
    { username: 'vikramaditya', email: 'vikram@drivex.com', passwordHash: 'DriveX@123', role: 'renter', phone: '9876543214' },
];

// ── Vehicle Listings ───────────────────────────────────────────────────
const VEHICLES = [
    {
        name: 'Maruti Swift 2023',
        type: 'CAR', brand: 'Maruti Suzuki', model: 'Swift', year: 2023,
        seats: 5, fuelType: 'PETROL', transmission: 'MANUAL', mileage: 23,
        pricePerDay: 1200,
        description: 'Fuel-efficient city hatchback. Perfect for daily commutes and weekend getaways. AC, music system included.',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/54399/swift-exterior-right-front-three-quarter-3.jpeg',
        location: { city: 'Mumbai', state: 'Maharashtra', country: 'India', coordinates: { type: 'Point', coordinates: [72.8777, 19.0760] } },
        isAvailable: true,
    },
    {
        name: 'Hyundai Creta 2023',
        type: 'SUV', brand: 'Hyundai', model: 'Creta', year: 2023,
        seats: 5, fuelType: 'DIESEL', transmission: 'AUTOMATIC', mileage: 18,
        pricePerDay: 2500,
        description: 'Premium compact SUV with panoramic sunroof, ventilated seats, and ADAS safety suite.',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/106815/creta-exterior-right-front-three-quarter-7.jpeg',
        location: { city: 'Bengaluru', state: 'Karnataka', country: 'India', coordinates: { type: 'Point', coordinates: [77.5946, 12.9716] } },
        isAvailable: false, // BOOKED
    },
    {
        name: 'Royal Enfield Classic 350',
        type: 'BIKE', brand: 'Royal Enfield', model: 'Classic 350', year: 2022,
        seats: 2, fuelType: 'PETROL', transmission: 'MANUAL', mileage: 35,
        pricePerDay: 800,
        description: 'Iconic cruiser for highway rides. Comes with helmet, saddle bags. Ideal for Goa and hill station trips.',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/9180/royal-enfield-classic-350-right-side-view.jpeg',
        location: { city: 'Pune', state: 'Maharashtra', country: 'India', coordinates: { type: 'Point', coordinates: [73.8567, 18.5204] } },
        isAvailable: true,
    },
    {
        name: 'Toyota Fortuner 2022',
        type: 'SUV', brand: 'Toyota', model: 'Fortuner', year: 2022,
        seats: 7, fuelType: 'DIESEL', transmission: 'AUTOMATIC', mileage: 14,
        pricePerDay: 5000,
        description: 'Full-size 7-seater SUV. Ideal for family trips, corporate travel, and off-road adventures.',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/44709/fortuner-exterior-right-front-three-quarter-3.jpeg',
        location: { city: 'Delhi', state: 'Delhi', country: 'India', coordinates: { type: 'Point', coordinates: [77.1025, 28.7041] } },
        isAvailable: true,
    },
    {
        name: 'Honda City 2023',
        type: 'CAR', brand: 'Honda', model: 'City', year: 2023,
        seats: 5, fuelType: 'PETROL', transmission: 'AUTOMATIC', mileage: 18,
        pricePerDay: 1800,
        description: 'Sporty premium sedan with Honda Sensing safety, wireless Apple CarPlay/Android Auto.',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/134287/city-exterior-right-front-three-quarter-3.jpeg',
        location: { city: 'Hyderabad', state: 'Telangana', country: 'India', coordinates: { type: 'Point', coordinates: [78.4867, 17.3850] } },
        isAvailable: false, // BOOKED
    },
    {
        name: 'Tata Nexon EV 2023',
        type: 'SUV', brand: 'Tata', model: 'Nexon EV', year: 2023,
        seats: 5, fuelType: 'ELECTRIC', transmission: 'AUTOMATIC', mileage: 312,
        pricePerDay: 2200,
        description: "India's best-selling EV. 312km range, fast charging, panoramic roof. Zero emissions.",
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/99870/nexon-ev-max-exterior-right-front-two-quarter-left-2.jpeg',
        location: { city: 'Chennai', state: 'Tamil Nadu', country: 'India', coordinates: { type: 'Point', coordinates: [80.2707, 13.0827] } },
        isAvailable: true,
    },
    {
        name: 'Bajaj Pulsar NS200',
        type: 'BIKE', brand: 'Bajaj', model: 'Pulsar NS200', year: 2023,
        seats: 2, fuelType: 'PETROL', transmission: 'MANUAL', mileage: 40,
        pricePerDay: 600,
        description: 'Sporty naked street bike. Great for quick city rides and weekend highway trips.',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/43482/pulsar-ns200-right-side-view.jpeg',
        location: { city: 'Jaipur', state: 'Rajasthan', country: 'India', coordinates: { type: 'Point', coordinates: [75.7873, 26.9124] } },
        isAvailable: true,
    },
    {
        name: 'Kia Seltos 2023',
        type: 'SUV', brand: 'Kia', model: 'Seltos', year: 2023,
        seats: 5, fuelType: 'PETROL', transmission: 'AUTOMATIC', mileage: 16,
        pricePerDay: 2800,
        description: 'Feature-loaded SUV with 10.25" touchscreen, Bose audio, dual-tone exterior.',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/40087/seltos-exterior-right-front-three-quarter-40.jpeg',
        location: { city: 'Ahmedabad', state: 'Gujarat', country: 'India', coordinates: { type: 'Point', coordinates: [72.5714, 23.0225] } },
        isAvailable: false, // BOOKED
    },
    {
        name: 'Mahindra Thar 2022',
        type: 'SUV', brand: 'Mahindra', model: 'Thar', year: 2022,
        seats: 4, fuelType: 'DIESEL', transmission: 'MANUAL', mileage: 15,
        pricePerDay: 3500,
        description: 'Iconic off-road beast. Perfect for mountain treks, beach drives, and adventure trips.',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/26941/thar-exterior-right-front-three-quarter-10.jpeg',
        location: { city: 'Manali', state: 'Himachal Pradesh', country: 'India', coordinates: { type: 'Point', coordinates: [77.1892, 32.2396] } },
        isAvailable: true,
    },
    {
        name: 'Ola S1 Pro (Scooter)',
        type: 'SCOOTER', brand: 'Ola Electric', model: 'S1 Pro', year: 2023,
        seats: 2, fuelType: 'ELECTRIC', transmission: 'AUTOMATIC', mileage: 181,
        pricePerDay: 400,
        description: 'India\'s fastest electric scooter. 181km range, OTA updates, cruise control.',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/113597/s1-pro-right-side-view.jpeg',
        location: { city: 'Bengaluru', state: 'Karnataka', country: 'India', coordinates: { type: 'Point', coordinates: [77.5946, 12.9716] } },
        isAvailable: true,
    },
    {
        name: 'Ford Endeavour 2021',
        type: 'SUV', brand: 'Ford', model: 'Endeavour', year: 2021,
        seats: 7, fuelType: 'DIESEL', transmission: 'AUTOMATIC', mileage: 13,
        pricePerDay: 4500,
        description: 'Legendary 7-seater with Terrain Management System, perfect for any road condition.',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/1386/endeavour-exterior-right-front-three-quarter-2.jpeg',
        location: { city: 'Mumbai', state: 'Maharashtra', country: 'India', coordinates: { type: 'Point', coordinates: [72.8779, 19.0775] } },
        isAvailable: true,
    },
    {
        name: 'Hero Splendor Plus',
        type: 'BIKE', brand: 'Hero', model: 'Splendor Plus', year: 2023,
        seats: 2, fuelType: 'PETROL', transmission: 'MANUAL', mileage: 60,
        pricePerDay: 350,
        description: 'India\'s most fuel-efficient bike. Great for short daily commutes.',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/49450/splendor-plus-right-side-view.jpeg',
        location: { city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', coordinates: { type: 'Point', coordinates: [80.9462, 26.8467] } },
        isAvailable: true,
    },
];

// ── Helpers ────────────────────────────────────────────────────────────
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

async function seed() {
    console.log('\n🚀 DriveX Seed Script Starting...\n');

    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS);
        console.log('✅ Connected to MongoDB!\n');

        // ── Clear existing data ──────────────────────────────────────────
        await Promise.all([
            Booking.deleteMany({}),
            Listing.deleteMany({}),
            User.deleteMany({}),
        ]);
        console.log('🗑️  Cleared existing listings, bookings, and users\n');

        // ── Create users ─────────────────────────────────────────────────
        const createdUsers = [];
        for (const u of USERS) {
            const user = await User.create({ ...u, isVerified: true });
            console.log(`👤 Created ${u.role}: ${u.username} (${u.email}) | password: DriveX@123`);
            createdUsers.push(user);
        }

        const [owner1, owner2, renter1, renter2, renter3] = createdUsers;
        console.log('');

        // ── Create Vehicle Listings ──────────────────────────────────────
        const createdListings = [];
        for (let i = 0; i < VEHICLES.length; i++) {
            const owner = i % 2 === 0 ? owner1 : owner2;
            const listing = await Listing.create({ 
                ...VEHICLES[i], 
                owner: owner._id,
                verificationStatus: 'APPROVED' 
            });
            createdListings.push(listing);
            const tag = listing.isAvailable ? '🟢 Available' : '🔴 Booked';
            console.log(`🚗 ${tag} | ${listing.name} — ₹${listing.pricePerDay}/day (${listing.location.city})`);
        }
        console.log('');

        // ── Create Bookings ──────────────────────────────────────────────
        // Booked vehicles: Creta (idx1), Honda City (idx4), Kia Seltos (idx7)
        const bookings = [
            // 1. ACTIVE booking — Creta, currently being used by amit
            {
                listing: createdListings[1]._id,  // Hyundai Creta — marked isAvailable:false
                renter: renter1._id,
                owner: owner2._id,
                startDate: daysAgo(2),
                endDate: daysFromNow(3),
                totalDays: 5,
                pricePerDay: createdListings[1].pricePerDay,
                totalCost: createdListings[1].pricePerDay * 5,
                status: 'ACTIVE',
                pickupLocation: 'Bengaluru Airport, T1',
                notes: 'Please keep fuel tank full on return.',
            },
            // 2. CONFIRMED booking — Honda City, upcoming trip by sneha
            {
                listing: createdListings[4]._id,  // Honda City — marked isAvailable:false
                renter: renter2._id,
                owner: owner1._id,
                startDate: daysFromNow(2),
                endDate: daysFromNow(6),
                totalDays: 4,
                pricePerDay: createdListings[4].pricePerDay,
                totalCost: createdListings[4].pricePerDay * 4,
                status: 'CONFIRMED',
                pickupLocation: 'Hyderabad Jubilee Hills',
                notes: 'Airport drop on last day needed.',
            },
            // 3. ACTIVE booking — Kia Seltos, currently used by vikram
            {
                listing: createdListings[7]._id,  // Kia Seltos — marked isAvailable:false
                renter: renter3._id,
                owner: owner2._id,
                startDate: daysAgo(1),
                endDate: daysFromNow(4),
                totalDays: 5,
                pricePerDay: createdListings[7].pricePerDay,
                totalCost: createdListings[7].pricePerDay * 5,
                status: 'ACTIVE',
                pickupLocation: 'Ahmedabad SG Highway',
                notes: 'Child seat requested.',
            },
            // 4. COMPLETED booking — Swift, amit's past trip
            {
                listing: createdListings[0]._id,  // Maruti Swift (still available, was booked before)
                renter: renter1._id,
                owner: owner1._id,
                startDate: daysAgo(15),
                endDate: daysAgo(12),
                totalDays: 3,
                pricePerDay: createdListings[0].pricePerDay,
                totalCost: createdListings[0].pricePerDay * 3,
                status: 'COMPLETED',
                pickupLocation: 'Mumbai Bandra West',
                notes: '',
            },
            // 5. COMPLETED booking — Fortuner, sneha's past trip
            {
                listing: createdListings[3]._id,  // Toyota Fortuner (available, was booked before)
                renter: renter2._id,
                owner: owner1._id,
                startDate: daysAgo(20),
                endDate: daysAgo(17),
                totalDays: 3,
                pricePerDay: createdListings[3].pricePerDay,
                totalCost: createdListings[3].pricePerDay * 3,
                status: 'COMPLETED',
                pickupLocation: 'Delhi Connaught Place',
                notes: '',
            },
            // 6. CANCELLED booking — Thar, vikram cancelled
            {
                listing: createdListings[8]._id,  // Mahindra Thar (available, cancelled booking)
                renter: renter3._id,
                owner: owner2._id,
                startDate: daysAgo(5),
                endDate: daysAgo(2),
                totalDays: 3,
                pricePerDay: createdListings[8].pricePerDay,
                totalCost: createdListings[8].pricePerDay * 3,
                status: 'CANCELLED',
                pickupLocation: 'Manali Mall Road',
                notes: 'Trip postponed due to weather.',
            },
            // 7. PENDING booking — RE Classic, sneha waiting for confirmation
            {
                listing: createdListings[2]._id,  // Royal Enfield (available)
                renter: renter2._id,
                owner: owner1._id,
                startDate: daysFromNow(7),
                endDate: daysFromNow(10),
                totalDays: 3,
                pricePerDay: createdListings[2].pricePerDay,
                totalCost: createdListings[2].pricePerDay * 3,
                status: 'PENDING',
                pickupLocation: 'Pune Kothrud',
                notes: 'Planning Lonavala trip.',
            },
        ];

        for (const b of bookings) {
            await Booking.create(b);
            const listing = await Listing.findById(b.listing);
            const renterUser = await User.findById(b.renter);
            console.log(`📋 ${b.status.padEnd(10)} | ${listing?.name?.padEnd(28)} | ${renterUser?.username} | ₹${b.totalCost.toLocaleString()}`);
        }

        console.log('\n✅ Seed complete!\n');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📊 Summary:');
        console.log(`   🚗 ${VEHICLES.length} vehicles (${VEHICLES.filter(v => v.isAvailable).length} available, ${VEHICLES.filter(v => !v.isAvailable).length} booked)`);
        console.log(`   📋 ${bookings.length} bookings (2 ACTIVE, 1 CONFIRMED, 2 COMPLETED, 1 CANCELLED, 1 PENDING)`);
        console.log(`   👤 ${USERS.length} users (2 owners, 3 renters)\n`);
        console.log('🔑 Test Login Credentials:');
        console.log('   Owner:  rahul@drivex.com  / DriveX@123');
        console.log('   Owner:  priya@drivex.com  / DriveX@123');
        console.log('   Renter: amit@drivex.com   / DriveX@123');
        console.log('   Renter: sneha@drivex.com  / DriveX@123');
        console.log('═══════════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (err) {
        console.error('\n❌ Seed failed:', err.message);
        if (err.message.includes('ENOTFOUND') || err.message.includes('ENODATA')) {
            console.error('\n💡 Fix: Add your current IP to MongoDB Atlas Network Access:');
            console.error('   atlas.mongodb.com → Network Access → Add IP Address → Allow From Anywhere (0.0.0.0/0)');
        }
        process.exit(1);
    }
}

seed();
