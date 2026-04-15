/**
 * DriveLink Seed Script
 * Populates MongoDB with users, vehicle listings, and bookings (booked + available)
 * Run: node backend/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Listing = require('./models/Listing');
const Booking = require('./models/Booking');
const Notification = require('./models/Notification');
const Message = require('./models/Message');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/drivelink';

// ── Test Users ─────────────────────────────────────────────────────────
const USERS = [
    { username: 'adminuser', email: 'admin@drivelink.com', passwordHash: 'DriveLink@123', password: 'DriveLink@123', role: 'admin', phone: '0000000000' },
    { username: 'rahulsharma', email: 'rahul@drivelink.com', passwordHash: 'DriveLink@123', password: 'DriveLink@123', role: 'owner', phone: '9876543210' },
    { username: 'priyajoshi', email: 'priya@drivelink.com', passwordHash: 'DriveLink@123', password: 'DriveLink@123', role: 'owner', phone: '9876543211' },
    { username: 'amitmehta', email: 'amit@drivelink.com', passwordHash: 'DriveLink@123', password: 'DriveLink@123', role: 'renter', phone: '9876543212' },
    { username: 'snehaverma', email: 'sneha@drivelink.com', passwordHash: 'DriveLink@123', password: 'DriveLink@123', role: 'renter', phone: '9876543213' },
    { username: 'vikramaditya', email: 'vikram@drivelink.com', passwordHash: 'DriveLink@123', password: 'DriveLink@123', role: 'renter', phone: '9876543214' },
];

// ── Vehicle Listings ───────────────────────────────────────────────────
const VEHICLES = [
    // Owner 1: rahulsharma (index 1)
    {
        ownerIdx: 1, name: 'Maruti Swift 2023', type: 'CAR', brand: 'Maruti Suzuki', model: 'Swift',
        year: 2023, seats: 5, fuelType: 'PETROL', transmission: 'MANUAL', pricePerDay: 1200, weekendPrice: 1500,
        mileage: 15000, description: 'Well-maintained Maruti Swift, perfect for city commuting.',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/159099/swift-exterior-right-front-three-quarter.jpeg',
        location: { address: 'Andheri West', city: 'Mumbai', country: 'India', coordinates: { type: 'Point', coordinates: [72.8362, 19.1364] } },
    },
    {
        ownerIdx: 1, name: 'Honda City 2022', type: 'CAR', brand: 'Honda', model: 'City',
        year: 2022, seats: 5, fuelType: 'PETROL', transmission: 'AUTOMATIC', pricePerDay: 1800, weekendPrice: 2200,
        mileage: 20000, description: 'Premium sedan with excellent mileage and comfort.',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/134287/city-exterior-right-front-three-quarter-2.jpeg',
        location: { address: 'Bandra East', city: 'Mumbai', country: 'India', coordinates: { type: 'Point', coordinates: [72.8520, 19.0596] } },
    },
    {
        ownerIdx: 1, name: 'Bajaj Pulsar NS200', type: 'BIKE', brand: 'Bajaj', model: 'Pulsar NS200',
        year: 2023, seats: 2, fuelType: 'PETROL', transmission: 'MANUAL', pricePerDay: 600, weekendPrice: 750,
        mileage: 8000, description: 'Sporty bike, great for weekend rides.',
        imageUrl: 'https://imgd.aeplcdn.com/1056x594/n/cw/ec/174943/pulsar-ns200-right-side-view.jpeg',
        location: { address: 'MG Road', city: 'Jaipur', country: 'India', coordinates: { type: 'Point', coordinates: [75.7873, 26.9124] } },
    },
    {
        ownerIdx: 1, name: 'Royal Enfield Classic 350', type: 'BIKE', brand: 'Royal Enfield', model: 'Classic 350',
        year: 2022, seats: 2, fuelType: 'PETROL', transmission: 'MANUAL', pricePerDay: 800, weekendPrice: 1000,
        mileage: 12000, description: 'Iconic cruiser bike for long highway trips.',
        imageUrl: 'https://imgd.aeplcdn.com/1056x594/n/cw/ec/161917/classic-350-right-side-view-2.jpeg',
        location: { address: 'Koregaon Park', city: 'Pune', country: 'India', coordinates: { type: 'Point', coordinates: [73.8930, 18.5367] } },
    },
    {
        ownerIdx: 1, name: 'Mahindra Thar 2023', type: 'SUV', brand: 'Mahindra', model: 'Thar',
        year: 2023, seats: 4, fuelType: 'DIESEL', transmission: 'MANUAL', pricePerDay: 3500, weekendPrice: 4500,
        mileage: 5000, description: 'Off-road beast, perfect for adventure trips.',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/40087/thar-exterior-right-front-three-quarter-49.jpeg',
        location: { address: 'Sector 17', city: 'Chandigarh', country: 'India', coordinates: { type: 'Point', coordinates: [76.7794, 30.7415] } },
    },
    {
        ownerIdx: 1, name: 'Tata Nexon EV 2023', type: 'SUV', brand: 'Tata', model: 'Nexon EV',
        year: 2023, seats: 5, fuelType: 'ELECTRIC', transmission: 'AUTOMATIC', pricePerDay: 2000, weekendPrice: 2500,
        mileage: 10000, description: 'Electric SUV with 300km range. Eco-friendly choice!',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/141867/nexon-ev-exterior-right-front-three-quarter-3.jpeg',
        location: { address: 'T. Nagar', city: 'Chennai', country: 'India', coordinates: { type: 'Point', coordinates: [80.2340, 13.0409] } },
    },

    // Owner 2: priyajoshi (index 2)
    {
        ownerIdx: 2, name: 'Hero Splendor Plus', type: 'BIKE', brand: 'Hero', model: 'Splendor Plus',
        year: 2023, seats: 2, fuelType: 'PETROL', transmission: 'MANUAL', pricePerDay: 350, weekendPrice: 450,
        mileage: 5000, description: 'India\'s most trusted commuter bike. Excellent mileage.',
        imageUrl: 'https://imgd.aeplcdn.com/1056x594/n/cw/ec/124399/splendor-plus-right-side-view.jpeg',
        location: { address: 'Hazratganj', city: 'Lucknow', country: 'India', coordinates: { type: 'Point', coordinates: [80.9500, 26.8554] } },
    },
    {
        ownerIdx: 2, name: 'Ola S1 Pro (Scooter)', type: 'SCOOTER', brand: 'Ola Electric', model: 'S1 Pro',
        year: 2023, seats: 2, fuelType: 'ELECTRIC', transmission: 'AUTOMATIC', pricePerDay: 400, weekendPrice: 550,
        mileage: 3000, description: 'Premium electric scooter with 170km range.',
        imageUrl: 'https://imgd.aeplcdn.com/1056x594/n/cw/ec/121591/s1-pro-right-side-view.jpeg',
        location: { address: 'Indiranagar', city: 'Bengaluru', country: 'India', coordinates: { type: 'Point', coordinates: [77.6408, 12.9784] } },
    },
    {
        ownerIdx: 2, name: 'Kia Seltos 2023', type: 'SUV', brand: 'Kia', model: 'Seltos',
        year: 2023, seats: 5, fuelType: 'PETROL', transmission: 'AUTOMATIC', pricePerDay: 2800, weekendPrice: 3500,
        mileage: 8000, description: 'Feature-rich compact SUV with an advanced infotainment system.',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/174323/seltos-exterior-right-front-three-quarter.jpeg',
        location: { address: 'SG Highway', city: 'Ahmedabad', country: 'India', coordinates: { type: 'Point', coordinates: [72.5008, 23.0700] } },
    },
    {
        ownerIdx: 2, name: 'Tata Nexon EV 2023', type: 'SUV', brand: 'Tata', model: 'Nexon EV',
        year: 2023, seats: 5, fuelType: 'ELECTRIC', transmission: 'AUTOMATIC', pricePerDay: 2200, weekendPrice: 2800,
        mileage: 6000, description: 'Electric SUV with great range and futuristic design.',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/141867/nexon-ev-exterior-right-front-three-quarter-3.jpeg',
        location: { address: 'Anna Nagar', city: 'Chennai', country: 'India', coordinates: { type: 'Point', coordinates: [80.2090, 13.0857] } },
    },
    {
        ownerIdx: 2, name: 'Toyota Fortuner 2022', type: 'SUV', brand: 'Toyota', model: 'Fortuner',
        year: 2022, seats: 7, fuelType: 'DIESEL', transmission: 'AUTOMATIC', pricePerDay: 5000, weekendPrice: 6500,
        mileage: 25000, description: 'Premium 7-seater SUV. Dominant presence and powerful engine.',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/44709/fortuner-exterior-right-front-three-quarter-20.jpeg',
        location: { address: 'Connaught Place', city: 'Delhi', country: 'India', coordinates: { type: 'Point', coordinates: [77.2167, 28.6328] } },
    },
    {
        ownerIdx: 2, name: 'Hyundai Creta 2023', type: 'SUV', brand: 'Hyundai', model: 'Creta',
        year: 2023, seats: 5, fuelType: 'DIESEL', transmission: 'AUTOMATIC', pricePerDay: 2500, weekendPrice: 3200,
        mileage: 10000, description: 'Feature-packed SUV with panoramic sunroof and ADAS.',
        imageUrl: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/106815/creta-exterior-right-front-three-quarter-5.jpeg',
        location: { address: 'Whitefield', city: 'Bengaluru', country: 'India', coordinates: { type: 'Point', coordinates: [77.7500, 12.9698] } },
    },
];

// ── Booking Templates ──────────────────────────────────────────────────
// Each template references vehicle index, renter index, and defines the booking shape.
const BOOKING_TEMPLATES = [
    // ACTIVE bookings — happening right now
    { vehicleIdx: 8, renterIdx: 3, startDaysFromNow: -2, endDaysFromNow: 5, status: 'ACTIVE', depositPaid: true, rentalPaid: true },
    { vehicleIdx: 11, renterIdx: 3, startDaysFromNow: -1, endDaysFromNow: 5, status: 'ACTIVE', depositPaid: true, rentalPaid: true },

    // CONFIRMED booking — upcoming
    { vehicleIdx: 4, renterIdx: 4, startDaysFromNow: 3, endDaysFromNow: 7, status: 'CONFIRMED', depositPaid: true, rentalPaid: false },

    // COMPLETED bookings — past
    { vehicleIdx: 10, renterIdx: 4, startDaysFromNow: -10, endDaysFromNow: -7, status: 'COMPLETED', depositPaid: true, rentalPaid: true },
    { vehicleIdx: 0, renterIdx: 5, startDaysFromNow: -15, endDaysFromNow: -12, status: 'COMPLETED', depositPaid: true, rentalPaid: true },

    // CANCELLED booking
    { vehicleIdx: 1, renterIdx: 3, startDaysFromNow: -5, endDaysFromNow: -2, status: 'CANCELLED', depositPaid: true, rentalPaid: false },

    // PENDING booking — awaiting owner approval
    { vehicleIdx: 6, renterIdx: 3, startDaysFromNow: 2, endDaysFromNow: 22, status: 'PENDING', depositPaid: false, rentalPaid: false },
];

// ── Helpers ─────────────────────────────────────────────────────────────
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

const generateBlockedDates = (startDaysFromNow, endDaysFromNow) => {
    const dates = [];
    const current = daysFromNow(startDaysFromNow);
    const end = daysFromNow(endDaysFromNow);
    while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
};

async function seed() {
    console.log('\n🚀 DriveLink Seed Script Starting...\n');

    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000, family: 4 });
        console.log('✅ Connected!\n');

        // ── Cleanup ──────────────────────────────────────────────────────
        console.log('🗑  Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Listing.deleteMany({}),
            Booking.deleteMany({}),
            Notification.deleteMany({}),
            Message.deleteMany({}),
        ]);
        console.log('✅ Collections cleared\n');

        // ── Users ────────────────────────────────────────────────────────
        console.log('👤 Creating users...');
        const createdUsers = [];
        for (const u of USERS) {
            const user = await User.create({ ...u, isVerified: true });
            console.log(`   👤 Created ${u.role}: ${u.username} (${u.email}) | password: DriveLink@123`);
            createdUsers.push(user);
        }
        console.log('');

        // ── Listings ─────────────────────────────────────────────────────
        console.log('🚗 Creating vehicle listings...');
        const createdListings = [];
        for (const v of VEHICLES) {
            const { ownerIdx, ...vehicleData } = v;
            const listing = await Listing.create({
                ...vehicleData,
                owner: createdUsers[ownerIdx]._id,
                isAvailable: true,
                status: 'ACTIVE',
                verificationStatus: 'APPROVED',
                blockedDates: [],
            });
            console.log(`   🚗 ${listing.name} (${listing.type}) → owner: ${USERS[ownerIdx].username} | ₹${listing.pricePerDay}/day`);
            createdListings.push(listing);
        }
        console.log('');

        // ── Bookings ─────────────────────────────────────────────────────
        console.log('📅 Creating bookings...');
        const bookings = [];
        for (const tmpl of BOOKING_TEMPLATES) {
            const listing = createdListings[tmpl.vehicleIdx];
            const renter = createdUsers[tmpl.renterIdx];
            const startDate = daysFromNow(tmpl.startDaysFromNow);
            const endDate = daysFromNow(tmpl.endDaysFromNow);
            const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            const totalCost = totalDays * listing.pricePerDay;

            const bookingData = {
                listing: listing._id,
                renter: renter._id,
                startDate,
                endDate,
                pricePerDay: listing.pricePerDay,
                totalDays,
                totalCost,
                status: tmpl.status,
                depositPaid: tmpl.depositPaid,
                rentalPaid: tmpl.rentalPaid,
                pickupLocation: listing.location?.address || '',
            };

            if (tmpl.status === 'CANCELLED') {
                bookingData.cancelledAt = new Date();
                bookingData.cancelReason = 'Cancelled by renter for testing';
            }

            const booking = await Booking.create(bookingData);
            bookings.push(booking);

            // Sync blockedDates for CONFIRMED and ACTIVE bookings
            if (['CONFIRMED', 'ACTIVE'].includes(tmpl.status)) {
                const blocked = generateBlockedDates(tmpl.startDaysFromNow, tmpl.endDaysFromNow);
                await Listing.findByIdAndUpdate(listing._id, {
                    $addToSet: { blockedDates: { $each: blocked } },
                });
            }

            // Mark listing unavailable if booking is currently ACTIVE
            if (tmpl.status === 'ACTIVE') {
                await Listing.findByIdAndUpdate(listing._id, { isAvailable: false });
            }

            console.log(`   📅 ${listing.name} → ${USERS[tmpl.renterIdx].username} | ${tmpl.status} | ${totalDays} days | ₹${totalCost}`);
        }

        // ── Summary ──────────────────────────────────────────────────────
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('✅ SEED COMPLETE');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`   🚗 ${createdListings.length} vehicle listings (all APPROVED + ACTIVE)`);
        console.log(`   📅 ${bookings.length} bookings (2 ACTIVE, 1 CONFIRMED, 2 COMPLETED, 1 CANCELLED, 1 PENDING)`);
        console.log(`   👤 ${USERS.length} users (1 admin, 2 owners, 3 renters)\n`);
        console.log('🔑 Test Login Credentials:');
        console.log('   Admin:  admin@drivelink.com  / DriveLink@123');
        console.log('   Owner:  rahul@drivelink.com  / DriveLink@123');
        console.log('   Owner:  priya@drivelink.com  / DriveLink@123');
        console.log('   Renter: amit@drivelink.com   / DriveLink@123');
        console.log('   Renter: sneha@drivelink.com  / DriveLink@123');
        console.log('═══════════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (err) {
        console.error('\n❌ Seed failed:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

seed();
