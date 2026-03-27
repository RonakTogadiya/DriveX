# DriveX — Full Feature Implementation Guide

## Project Stack Context

- **Backend:** Node.js + Express.js, MongoDB (Mongoose), REST API
- **Frontend:** React.js (with React Router), CSS/plain styling
- **Auth:** JWT-based authentication stored in localStorage
- **Three user roles:** `renter` (default), `owner`, `admin`
- **Folder structure:** `/backend` (server, models, routes, controllers, middleware) and `/frontend` (src/pages, src/components, src/context or redux)

---

## ══════════════════════════════════════
## RENTER-SIDE FEATURES
## ══════════════════════════════════════

---

## FEATURE 1 — Cancel Booking

### Overview
Allow a renter to cancel their confirmed booking before the rental start date. Cancellation is only permitted a defined number of hours before the rental start (e.g., 24 hours). After cancellation, the booking status changes to `"cancelled"` and any applicable refund logic is triggered.

### Backend Changes

**Model — `Booking.js` (update existing schema)**
- Ensure the `status` field in the Booking schema supports the value `"cancelled"`. The enum should include: `["pending", "confirmed", "rejected", "cancelled", "completed"]`.
- Add a field `cancelledAt: { type: Date }` to record the timestamp of cancellation.
- Add a field `cancelReason: { type: String }` (optional, user can provide a reason).

**Route — Add to existing booking routes file (e.g., `routes/bookingRoutes.js`)**
- Add: `PUT /api/bookings/:id/cancel` — protected route (only accessible to authenticated renters).

**Controller — `bookingController.js`**
- Create a `cancelBooking` async function.
- Find the booking by `req.params.id`.
- Verify `booking.renterId.toString() === req.user._id.toString()` to ensure only the owner of the booking can cancel it.
- Check that `booking.status` is `"confirmed"` or `"pending"` — if it is already `"cancelled"` or `"completed"`, return a 400 error with message `"Booking cannot be cancelled"`.
- Check the rental start date: if `booking.startDate` is within 24 hours from `Date.now()`, return a 400 error with message `"Cannot cancel within 24 hours of rental start"`.
- Update: `booking.status = "cancelled"`, `booking.cancelledAt = new Date()`, `booking.cancelReason = req.body.reason || ""`.
- Save the booking and return the updated booking object with status 200.

**Middleware**
- Use the existing `protect` middleware (JWT verification) on this route.

### Frontend Changes

**Component — `BookingCard.js` or `MyBookings.js` (update existing renter booking list page)**
- For each booking card where `status === "confirmed"` or `status === "pending"` and `startDate > Date.now() + 24 hours`, show a red "Cancel Booking" button.
- On clicking "Cancel Booking", open a confirmation modal (inline component) with:
  - Text: "Are you sure you want to cancel this booking?"
  - An optional textarea for cancellation reason (placeholder: "Reason for cancellation (optional)").
  - Two buttons: "Yes, Cancel" (red) and "No, Go Back" (grey).
- On confirming, call `PUT /api/bookings/:id/cancel` with `{ reason: "..." }` in the body.
- On success, update the booking status in the UI to show a red "Cancelled" badge and remove the cancel button.
- On error, display the error message below the button.

---

## FEATURE 2 — QR Code Payment Option

### Overview
When a renter proceeds to pay for a booking, they can choose "Pay via QR Code" as an alternative to card payment. A QR code is displayed containing the payment details. The renter scans it with their UPI/banking app and manually confirms payment on the platform. An admin or owner then verifies the payment.

### Backend Changes

**Package — Install `qrcode` package**
- Run `npm install qrcode` in the backend folder.

**Model — `Payment.js` (create new or update existing)**
- Fields: `bookingId` (ref: Booking), `renterId` (ref: User), `amount` (Number), `method` (String, enum: `["card", "qr", "cash"]`), `status` (String, enum: `["pending", "completed", "failed"]`, default: `"pending"`), `qrData` (String — stores the encoded payment info), `transactionId` (String — entered by user after payment), `createdAt` (Date, default: Date.now).

**Route — Add to `routes/paymentRoutes.js`**
- `POST /api/payments/generate-qr` — protected, generates QR code data for a booking.
- `PUT /api/payments/:id/confirm-qr` — protected, renter submits their transaction ID after scanning.

**Controller — `paymentController.js`**
- `generateQR`: Accept `{ bookingId, amount }` in request body. Build a payment string like `"DriveX|BookingID:${bookingId}|Amount:${amount}|Pay to: drivex@upi"` (or any UPI VPA string). Use `qrcode.toDataURL(paymentString)` to generate a base64 PNG of the QR. Save a new Payment document with `method: "qr"`, `status: "pending"`, `qrData: paymentString`. Return `{ paymentId, qrImage }` where `qrImage` is the base64 string.
- `confirmQR`: Accept `{ transactionId }`. Find the payment by ID, set `transactionId = req.body.transactionId`, keep `status: "pending"` (admin must verify). Save and return updated payment.

### Frontend Changes

**Component — `PaymentPage.js` (update existing checkout/payment page)**
- Add a payment method selector: two cards/radio buttons — "Pay by Card" and "Pay via QR Code".
- When "Pay via QR Code" is selected:
  - Call `POST /api/payments/generate-qr` with `{ bookingId, amount }`.
  - Display the returned base64 QR image in an `<img>` tag (src = `data:image/png;base64,...`).
  - Below the QR image, show: "Scan this QR code with your UPI/banking app to complete payment of ₹[amount]."
  - Show a text input labeled "Enter Transaction/UTR ID after payment" with a "Confirm Payment" button.
  - On clicking "Confirm Payment", call `PUT /api/payments/:paymentId/confirm-qr` with `{ transactionId }`.
  - On success, show: "Payment submitted for verification. You will be notified once confirmed."

---

## FEATURE 3 — Wishlist / Save Vehicles

### Overview
A renter can save/bookmark vehicles they are interested in. Saved vehicles appear in a "My Wishlist" page. This is a toggle — clicking "Save" adds the vehicle, clicking again removes it.

### Backend Changes

**Model — `User.js` (update existing schema)**
- Add field: `wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" }]`

**Routes — Add to `routes/userRoutes.js`**
- `POST /api/users/wishlist/:vehicleId` — toggle wishlist (add if not present, remove if present).
- `GET /api/users/wishlist` — get all wishlisted vehicles (populated with vehicle details).

**Controller — `userController.js`**
- `toggleWishlist`: Find the user by `req.user._id`. Check if `vehicleId` is already in `user.wishlist`. If yes, remove it using `$pull`; if no, add it using `$addToSet`. Save and return `{ message: "Added to wishlist" or "Removed from wishlist", wishlist: user.wishlist }`.
- `getWishlist`: Find user, populate `wishlist` with full vehicle documents. Return the populated array.

### Frontend Changes

**Component — `VehicleCard.js` (update existing vehicle listing card)**
- Add a heart icon (❤ or use an SVG) in the top-right corner of each vehicle card.
- On mount, check if the vehicle ID is in the user's wishlist (fetch from context or local state initialized from `GET /api/users/wishlist`).
- Filled red heart = saved; outlined heart = not saved.
- On click, call `POST /api/users/wishlist/:vehicleId`. Toggle heart icon state optimistically.

**Page — Create new `WishlistPage.js`**
- Fetch `GET /api/users/wishlist` on mount.
- Render the same `VehicleCard` component for each saved vehicle.
- If wishlist is empty, show: "You haven't saved any vehicles yet. Browse vehicles to add them here."
- Add route in React Router: `/wishlist` — protected (only logged-in renters).
- Add "My Wishlist" link in the renter navigation bar/header.

---

## FEATURE 4 — Deposit + Rental Price + PDF Receipt + Mandatory Post-Deposit Review

### Overview
When a renter books a vehicle, a refundable deposit is added on top of the rental price. After the rental is completed and the deposit has been processed, the renter is required to leave a review before they can make another booking. A PDF receipt is generated containing both the deposit and rental charge breakdown.

### Backend Changes

**Package — Install `pdfkit` and `nodemailer` (if email needed)**
- Run `npm install pdfkit` in backend folder.

**Model — `Booking.js` (update existing)**
- Add fields:
  - `depositAmount: { type: Number, default: 0 }` — set at time of booking based on vehicle's deposit config.
  - `depositStatus: { type: String, enum: ["held", "refunded", "forfeited"], default: "held" }`.
  - `totalAmount: { type: Number }` — computed as `rentalPrice + depositAmount`.
  - `receiptUrl: { type: String }` — path or URL to generated PDF.
  - `reviewSubmitted: { type: Boolean, default: false }` — tracks if post-deposit review was given.

**Model — `Vehicle.js` (update existing)**
- Add field: `depositAmount: { type: Number, default: 500 }` — owner sets this per vehicle.

**Model — `Review.js` (create new or update existing)**
- Fields: `bookingId` (ref: Booking), `vehicleId` (ref: Vehicle), `renterId` (ref: User), `rating` (Number, 1–5), `comment` (String), `createdAt` (Date).

**Route — Add to `routes/bookingRoutes.js`**
- `GET /api/bookings/:id/receipt` — generate and return PDF receipt.
- `POST /api/bookings/:id/review` — submit review after deposit processed (only allowed if `depositStatus` is `"refunded"` or `"forfeited"`).

**Controller — `bookingController.js`**
- When creating a booking (`createBooking`): fetch the vehicle's `depositAmount`, calculate `totalAmount = rentalPrice + depositAmount`, store both on the booking.
- `generateReceipt`: Use `pdfkit` to generate a PDF. The PDF should contain:
  - Header: "DriveX — Rental Receipt"
  - Section: Booking Details (Booking ID, Vehicle Name, Renter Name, Start Date, End Date, Number of Days)
  - Section: Payment Breakdown — "Rental Price: ₹X", "Security Deposit: ₹Y", "Total Charged: ₹Z"
  - Section: Deposit Policy — "The security deposit of ₹Y will be refunded within 3-5 business days after vehicle return, subject to inspection."
  - Footer: "Thank you for choosing DriveX"
  - Save PDF to `/uploads/receipts/booking-${bookingId}.pdf` on the server. Set `booking.receiptUrl` to this path. Stream the PDF as response with `Content-Type: application/pdf`.
- `submitReview`: Validate `bookingId`, ensure `booking.depositStatus !== "held"` (i.e., deposit has been processed). Check `booking.reviewSubmitted === false`. Create a new Review document. Set `booking.reviewSubmitted = true`. Save both.

**Middleware — Check review before new booking**
- In `createBooking` controller: before creating a new booking, check if the renter has any past completed bookings where `depositStatus !== "held"` AND `reviewSubmitted === false`. If yes, return a 403 error with message: `"Please submit a review for your last completed rental before making a new booking."`.

### Frontend Changes

**Component — `BookingConfirmation.js` (update existing)**
- Show a clear payment summary: "Rental Price: ₹X + Security Deposit: ₹Y = Total: ₹Z".
- Add a "Download Receipt (PDF)" button that calls `GET /api/bookings/:id/receipt` and triggers file download.

**Component — Create `ReviewModal.js`**
- A modal/popup that appears on the "My Bookings" page when a booking has `depositStatus !== "held"` and `reviewSubmitted === false`.
- Show: "Your deposit for [Vehicle Name] has been processed. Please leave a review to continue."
- Star rating selector (1–5 stars, click to set rating).
- Textarea for comment.
- "Submit Review" button calling `POST /api/bookings/:id/review`.
- The modal should block navigation (or at minimum show a persistent banner) until the review is submitted.

---

## ══════════════════════════════════════
## OWNER-SIDE FEATURES
## ══════════════════════════════════════

---

## FEATURE 5 — Owner Dashboard (Separate Page on Login)

### Overview
When a user logs in and their role is `"owner"`, they should be redirected to a dedicated Owner Dashboard instead of the regular renter home page. The Owner Dashboard is a separate page with a different navigation menu.

### Backend Changes

- No backend changes required. The JWT token already contains the user's `role`. The frontend reads this and routes accordingly.

### Frontend Changes

**File — `App.js` or main router file**
- After login, read the `role` from the JWT payload or from the user object returned by the login API.
- If `role === "owner"`, redirect to `/owner/dashboard`.
- If `role === "renter"`, redirect to `/home` or `/`.
- If `role === "admin"`, redirect to `/admin/dashboard`.

**Create new page — `OwnerDashboard.js`**
- Located at route `/owner/dashboard`.
- Protected route — only accessible if `role === "owner"`.
- Render a sidebar or top navigation specific to the owner containing links to: "My Vehicles", "Booking Requests", "Availability Calendar", "Earnings / Stats", "Document Verification Status".
- Show summary cards at the top: Total Vehicles Listed, Pending Booking Requests, Total Earnings This Month, Average Rating.

**Update — `ProtectedRoute.js` (create if not exists)**
- Create a `<RoleProtectedRoute role="owner">` wrapper component that checks `currentUser.role === "owner"`. If not, redirect to `/unauthorized` or `/home`.
- Wrap all `/owner/*` routes with this component.
- Similarly create `<RoleProtectedRoute role="admin">` for admin routes.

---

## FEATURE 6 — Set Vehicle Availability (Dates)

### Overview
Vehicle owners can set which dates their vehicle is available or blocked/unavailable. This is displayed as a calendar on the vehicle detail page for renters. Renters cannot book on blocked dates.

### Backend Changes

**Model — `Vehicle.js` (update existing)**
- Add field: `blockedDates: [{ type: Date }]` — array of specific dates that are unavailable.
- Alternatively: `availability: [{ startDate: Date, endDate: Date, available: Boolean }]` — for range-based blocking. Use the simpler `blockedDates` array for implementation clarity.

**Routes — Add to `routes/vehicleRoutes.js`**
- `PUT /api/vehicles/:id/availability` — owner sets blocked/available dates.
- `GET /api/vehicles/:id/availability` — public, returns the blocked dates for a vehicle.

**Controller — `vehicleController.js`**
- `setAvailability`: Verify `vehicle.ownerId.toString() === req.user._id.toString()`. Accept `{ blockedDates: ["2025-07-01", "2025-07-02", ...] }` in body. Replace or merge with existing `blockedDates`. Save and return updated vehicle.
- `getAvailability`: Return `vehicle.blockedDates` as an array of ISO date strings.

**Booking validation**
- In `createBooking` controller: before confirming a booking, check that none of the dates between `startDate` and `endDate` are in `vehicle.blockedDates`. If conflict found, return 400: `"Vehicle is not available on selected dates."`.

### Frontend Changes

**Component — Create `AvailabilityCalendar.js`**
- Use the `react-calendar` or `react-datepicker` npm package (install: `npm install react-calendar`).
- Display a monthly calendar.
- Highlight blocked dates in red/grey.
- In the owner view: allow clicking dates to toggle them between blocked/available. Show a "Save Availability" button that calls `PUT /api/vehicles/:id/availability` with the updated `blockedDates` array.
- In the renter view: show the calendar as read-only with blocked dates visually marked. When the renter picks start/end dates for booking, validate against blocked dates and show an error if any date in range is blocked.

**Page — `OwnerVehicleDetail.js` or `EditVehicle.js`**
- Embed the `AvailabilityCalendar` component with owner edit mode enabled.

---

## FEATURE 7 — Accept / Reject Booking Requests (Owner)

### Overview
When a renter makes a booking, it starts with `status: "pending"`. The vehicle owner receives the booking request and can either accept or reject it, with an optional reason for rejection.

### Backend Changes

**Routes — Add to `routes/bookingRoutes.js`**
- `PUT /api/bookings/:id/accept` — owner accepts a pending booking.
- `PUT /api/bookings/:id/reject` — owner rejects a pending booking.

**Controller — `bookingController.js`**
- `acceptBooking`: Find booking by ID. Verify `booking.vehicleOwnerId.toString() === req.user._id.toString()`. Check `booking.status === "pending"`. Set `booking.status = "confirmed"`. Save and return. Also trigger notification (optional — can store a notification object in a Notification collection or send email).
- `rejectBooking`: Same owner verification. Accept optional `{ reason }` in body. Set `booking.status = "rejected"`, `booking.rejectionReason = req.body.reason || ""`. Save and return.

**Model — Booking.js (update)**
- Add: `rejectionReason: { type: String }`.
- Ensure `vehicleOwnerId` field exists on the Booking document (should be populated from Vehicle when booking is created).

### Frontend Changes

**Page — `OwnerBookingRequests.js` (create new in owner dashboard)**
- Route: `/owner/bookings`.
- Fetch `GET /api/bookings?ownerId=currentUserId&status=pending` on mount.
- Display each pending booking as a card showing: Renter Name, Vehicle Name, Start Date, End Date, Total Amount, Deposit Amount.
- Two buttons per card: green "Accept" and red "Reject".
- On "Accept": call `PUT /api/bookings/:id/accept`. On success, move card to an "Accepted" section or remove from pending list.
- On "Reject": show a small inline textarea for rejection reason, then call `PUT /api/bookings/:id/reject`. On success, remove from pending list.
- Show tabs or filter buttons: "Pending", "Accepted", "Rejected" to view all booking history.

---

## FEATURE 8 — Document Verification (Owner Upload, Admin Verify)

### Overview
Vehicle owners must upload documents for their vehicles (e.g., RC Book, Insurance, PUC certificate) before a listing can go live. Admins review and approve or reject the documents. Until documents are verified, the vehicle listing is not publicly visible.

### Backend Changes

**Package — Install `multer`**
- Run `npm install multer` in backend if not already installed.

**Model — `Vehicle.js` (update existing)**
- Add fields:
  - `documents: [{ docType: String, fileUrl: String, uploadedAt: Date, verifiedAt: Date, status: String (enum: ["pending", "verified", "rejected"]), rejectionNote: String }]`
  - `documentsVerified: { type: Boolean, default: false }` — true only when admin approves all required documents.

**Multer config — `middleware/upload.js`**
- Configure multer with `diskStorage`, saving files to `/uploads/documents/`. Accept PDF, JPG, PNG. Max file size 5MB.

**Routes — Add to `routes/vehicleRoutes.js`**
- `POST /api/vehicles/:id/documents` — owner uploads a document. Use multer middleware.
- `GET /api/vehicles/:id/documents` — admin views a vehicle's documents.
- `PUT /api/vehicles/:id/documents/:docId/verify` — admin approves a document.
- `PUT /api/vehicles/:id/documents/:docId/reject` — admin rejects a document with a note.

**Controller**
- `uploadDocument`: Get file path from `req.file.path`. Push new document object into `vehicle.documents`. Set status `"pending"`. Save and return.
- `verifyDocument`: Find the specific doc by `docId` in `vehicle.documents` array. Set `status = "verified"`, `verifiedAt = new Date()`. If all required docs are verified, set `vehicle.documentsVerified = true`. Save.
- `rejectDocument`: Set specific doc's `status = "rejected"`, `rejectionNote = req.body.note`. Save.

**Vehicle listing visibility**
- In `GET /api/vehicles` (public listing), add filter: `{ documentsVerified: true }` to only show verified vehicles.

### Frontend Changes

**Component — `DocumentUpload.js` (owner side, inside vehicle edit page)**
- Show a list of required document types: "RC Book", "Insurance Certificate", "PUC Certificate", "Owner Photo ID".
- For each, show current upload status (Pending / Verified / Rejected with rejection note).
- File input with a "Upload" button for each document type.
- On upload, show success/failure and update status badge.

**Component — `AdminDocumentReview.js` (admin side)**
- Show a list of vehicles with pending documents.
- Clicking a vehicle opens a panel showing each uploaded document as a clickable link/preview.
- "Verify" and "Reject" buttons per document. Rejection triggers a text input for the rejection note.

---

## FEATURE 9 — Dynamic Pricing (Weekend Price Change)

### Overview
Vehicle owners can set a different daily rental price for weekends (Saturday and Sunday) compared to weekdays. When a renter selects booking dates, the total price is automatically calculated using the correct daily rate for each day in the range.

### Backend Changes

**Model — `Vehicle.js` (update existing)**
- Add fields:
  - `weekdayPrice: { type: Number }` — existing `price` field can be renamed to this or kept as default.
  - `weekendPrice: { type: Number }` — higher price for Sat/Sun. If not set, defaults to `weekdayPrice`.

**Utility function — `utils/pricingUtils.js` (create new)**
```
Function calculateTotalPrice(startDate, endDate, weekdayPrice, weekendPrice):
  total = 0
  current = new Date(startDate)
  while current < endDate:
    dayOfWeek = current.getDay()  // 0 = Sunday, 6 = Saturday
    if dayOfWeek === 0 or dayOfWeek === 6:
      total += weekendPrice (or weekdayPrice if weekendPrice not set)
    else:
      total += weekdayPrice
    current += 1 day
  return total
```

**Controller — `bookingController.js`**
- In `createBooking`: Use `calculateTotalPrice(startDate, endDate, vehicle.weekdayPrice, vehicle.weekendPrice)` to compute `rentalPrice` instead of a simple `days * price` calculation.

**Route — Add to `routes/vehicleRoutes.js`**
- `POST /api/vehicles/:id/calculate-price` — accepts `{ startDate, endDate }`, returns `{ breakdown: [{date, dayType, price}], totalPrice, depositAmount }`.

**Controller — `vehicleController.js`**
- `calculatePrice`: Run the pricing utility and return a detailed daily breakdown.

### Frontend Changes

**Component — `BookingForm.js` or `VehicleDetailPage.js` (update existing)**
- After the renter selects `startDate` and `endDate`, call `POST /api/vehicles/:id/calculate-price`.
- Display the price breakdown: a small table or list showing each date, whether it's a weekday or weekend, and the daily price.
- Show the total at the bottom: "Total Rental Price: ₹X + Security Deposit: ₹Y = ₹Z".
- Refresh this calculation every time dates change.

**Component — `EditVehicle.js` or `AddVehicle.js` (owner side)**
- Add two price fields: "Weekday Price (₹/day)" and "Weekend Price (₹/day, leave blank to use weekday price)".

---

## FEATURE 10 — Vehicle Performance Stats (Most Booked Vehicle)

### Overview
The owner can view analytics for their listed vehicles — which vehicle has been booked the most, total earnings per vehicle, average rating per vehicle, and booking trend over time.

### Backend Changes

**Route — Add to `routes/vehicleRoutes.js` or new `routes/statsRoutes.js`**
- `GET /api/owners/:ownerId/stats` — returns aggregated statistics for all vehicles of a given owner.

**Controller — `statsController.js` (create new or add to vehicleController)**
- `getOwnerVehicleStats`:
  - Use MongoDB aggregation pipeline on the Bookings collection:
    - Match: `{ vehicleOwnerId: ownerId, status: { $in: ["confirmed", "completed"] } }`
    - Group by `vehicleId`: count bookings, sum `totalAmount`, compute average rating by joining with Reviews.
  - Sort by booking count descending.
  - Return array: `[{ vehicleId, vehicleName, totalBookings, totalRevenue, averageRating }]`.
  - Also return `mostBookedVehicle` = first element of the sorted array.

### Frontend Changes

**Page — `OwnerStats.js` (create new, add to owner dashboard nav)**
- Route: `/owner/stats`.
- On mount, fetch `GET /api/owners/:ownerId/stats`.
- Show a highlighted card at the top: "🏆 Most Booked Vehicle: [vehicleName] — [N] bookings".
- Below, show a table or list of all vehicles with columns: Vehicle Name, Total Bookings, Total Revenue (₹), Average Rating (⭐).
- Sort toggle: allow sorting by bookings or revenue.

---

## ══════════════════════════════════════
## ADMIN-SIDE FEATURES
## ══════════════════════════════════════

---

## FEATURE 11 — Manage Users (Block / Unblock)

### Overview
Admin can view all registered users, see their details, and block or unblock them. A blocked user cannot log in.

### Backend Changes

**Model — `User.js` (update existing)**
- Add field: `isBlocked: { type: Boolean, default: false }`.

**Auth middleware (update existing `protect` middleware)**
- After verifying JWT and finding the user, add: `if (user.isBlocked) return res.status(403).json({ message: "Your account has been blocked. Contact support." })`.

**Routes — Add to `routes/adminRoutes.js`**
- `GET /api/admin/users` — get all users with pagination (query params: `page`, `limit`, `search`).
- `PUT /api/admin/users/:id/block` — block a user.
- `PUT /api/admin/users/:id/unblock` — unblock a user.

**Controller — `adminController.js`**
- `getAllUsers`: Query `User.find({})` with optional search on `name` or `email`. Use `.skip()` and `.limit()` for pagination. Return users without password field (use `.select("-password")`).
- `blockUser`: Find user, set `isBlocked = true`, save. Return success.
- `unblockUser`: Find user, set `isBlocked = false`, save. Return success.

### Frontend Changes

**Page — `AdminUserManagement.js` (create new)**
- Route: `/admin/users`.
- Fetch `GET /api/admin/users` on mount.
- Show a searchable table with columns: Name, Email, Role, Status (Blocked/Active), Joined Date, Actions.
- Search bar at top filters by name or email.
- In the "Actions" column: show "Block" button (red) if user is active, show "Unblock" button (green) if user is blocked.
- Blocked users should have their row highlighted with a light red background.
- On block/unblock, immediately update the UI without full refresh.
- Add this page to the admin sidebar navigation.

---

## FEATURE 12 — Manage Vehicles (Approve / Reject Listings)

### Overview
When an owner submits a vehicle listing, it remains in `"pending"` state until an admin approves it. Admin can also reject a listing with a reason. Only approved vehicles are visible to renters.

### Backend Changes

**Model — `Vehicle.js` (update existing)**
- Add fields:
  - `approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }`.
  - `rejectionReason: { type: String }`.
  - `approvedAt: { type: Date }`.

**Routes — Add to `routes/adminRoutes.js`**
- `GET /api/admin/vehicles` — get all vehicle listings with their approval status (paginated).
- `PUT /api/admin/vehicles/:id/approve` — approve a listing.
- `PUT /api/admin/vehicles/:id/reject` — reject a listing with reason.

**Controller — `adminController.js`**
- `approveVehicle`: Set `vehicle.approvalStatus = "approved"`, `vehicle.approvedAt = new Date()`. Save.
- `rejectVehicle`: Set `vehicle.approvalStatus = "rejected"`, `vehicle.rejectionReason = req.body.reason`. Save.

**Public vehicle listing route (update)**
- In `GET /api/vehicles`, add filter: `{ approvalStatus: "approved" }` in addition to `documentsVerified: true`.

### Frontend Changes

**Page — `AdminVehicleManagement.js` (create new)**
- Route: `/admin/vehicles`.
- Fetch `GET /api/admin/vehicles` on mount.
- Show a table with tabs: "All", "Pending", "Approved", "Rejected".
- Columns: Vehicle Name, Owner Name, Type, Daily Price, Submission Date, Status, Documents (link), Actions.
- For pending vehicles: show "Approve" (green) and "Reject" (red) buttons.
- "Reject" triggers an inline textarea for reason.
- For approved vehicles: show "Revoke Approval" button.

---

## FEATURE 13 — View All Bookings (Admin)

### Overview
Admin can view all bookings across the platform — from all renters and all owners — with full details and filtering options.

### Backend Changes

**Route — Add to `routes/adminRoutes.js`**
- `GET /api/admin/bookings` — returns all bookings with pagination, search, and filter by status/date range.

**Controller — `adminController.js`**
- `getAllBookings`: Accept query params: `status`, `startDate`, `endDate`, `page`, `limit`, `search` (by renter name or vehicle name).
- Use Mongoose `.populate("renterId", "name email")` and `.populate("vehicleId", "name type")` to enrich results.
- Apply filters dynamically. Return paginated results with total count.

### Frontend Changes

**Page — `AdminBookings.js` (create new)**
- Route: `/admin/bookings`.
- Fetch with filter params on mount and on filter change.
- Filters at top: Status dropdown (All / Pending / Confirmed / Cancelled / Completed), Date Range pickers (Start Date - End Date), Search bar (by renter name or vehicle).
- Table columns: Booking ID (first 8 chars), Renter, Vehicle, Start Date, End Date, Rental Price, Deposit, Total, Status, Booked On.
- Status column shows colored badges.
- Clicking a row opens a detailed modal or expands to show all booking info including deposit status and review status.
- Pagination controls at bottom.

---

## FEATURE 14 — Payment Management (Admin)

### Overview
Admin can view all payment records, see which are pending QR verification, and manually mark payments as completed or failed.

### Backend Changes

**Route — Add to `routes/adminRoutes.js`**
- `GET /api/admin/payments` — all payments, filterable by method/status.
- `PUT /api/admin/payments/:id/verify` — mark a QR payment as completed.
- `PUT /api/admin/payments/:id/fail` — mark a payment as failed.

**Controller — `adminController.js`**
- `getAllPayments`: Return all Payment documents, populated with booking and renter info.
- `verifyPayment`: Set `payment.status = "completed"`. Also update the linked booking: `booking.paymentStatus = "paid"`. Save both.
- `failPayment`: Set `payment.status = "failed"`. Save.

### Frontend Changes

**Page — `AdminPaymentManagement.js` (create new)**
- Route: `/admin/payments`.
- Show filter tabs: "All", "Pending QR Verification", "Completed", "Failed".
- Table columns: Payment ID, Renter Name, Booking ID, Amount, Method (Card/QR/Cash), Transaction ID (for QR), Status, Date.
- For pending QR payments: show "Verify" (green) and "Reject" (red) buttons.
- On verify: call `PUT /api/admin/payments/:id/verify`. Update row status to green "Completed".
- Show total amounts at the top: "Total Collected: ₹X | Pending Verification: ₹Y".

---

## FEATURE 15 — Revenue Reports (Daily / Monthly)

### Overview
Admin can view revenue summaries — total bookings, total rental revenue, and total deposit amounts — broken down by day or month. Reports can be downloaded as CSV.

### Backend Changes

**Route — Add to `routes/adminRoutes.js`**
- `GET /api/admin/reports/revenue?type=daily&year=2025&month=7` — daily breakdown for a given month.
- `GET /api/admin/reports/revenue?type=monthly&year=2025` — monthly breakdown for a year.

**Controller — `adminController.js`**
- `getRevenueReport`: Use MongoDB aggregation.
  - For `daily`: group completed/confirmed bookings by `{ $dayOfMonth: "$createdAt" }` for a given year-month. Sum `totalAmount`, count bookings.
  - For `monthly`: group by `{ $month: "$createdAt" }` for a given year. Sum `totalAmount`, count bookings.
  - Return array: `[{ period, bookingCount, rentalRevenue, depositRevenue, totalRevenue }]`.

**CSV export utility — `utils/exportCSV.js`**
- Simple function: accept array of objects and field headers, convert to CSV string using `Array.join()`. No extra package needed.
- Alternatively: `npm install json2csv`.

**Route for CSV download**
- `GET /api/admin/reports/revenue/download?type=monthly&year=2025` — returns CSV file with `Content-Type: text/csv` and `Content-Disposition: attachment; filename="revenue-report.csv"`.

### Frontend Changes

**Page — `AdminReports.js` (create new)**
- Route: `/admin/reports`.
- Two tabs: "Daily Report" and "Monthly Report".
- Daily tab: Month/Year selector. Fetch and show a table with columns: Date, Total Bookings, Rental Revenue, Deposit Collected, Total Revenue.
- Monthly tab: Year selector. Fetch and show table with columns: Month, Total Bookings, Rental Revenue, Deposit Collected, Total Revenue. Also show a total row at the bottom.
- "Download CSV" button in top-right corner of each tab. Calls the download route and triggers file download using `window.location.href = url` or a hidden `<a>` tag.

---

## FEATURE 16 — Analytics Dashboard (Graphs)

### Overview
Admin has a visual dashboard showing key platform metrics using charts/graphs — total revenue trend, bookings over time, top vehicles, user growth, vehicle type distribution.

### Backend Changes

**Route — Add to `routes/adminRoutes.js`**
- `GET /api/admin/analytics/overview` — returns aggregate numbers: total users, total owners, total vehicles, total bookings, total revenue, total pending requests.
- `GET /api/admin/analytics/bookings-trend?period=last30days` — returns daily booking counts for the last 30 days.
- `GET /api/admin/analytics/revenue-trend?period=last12months` — returns monthly revenue for the last 12 months.
- `GET /api/admin/analytics/top-vehicles` — returns top 5 most booked vehicles.
- `GET /api/admin/analytics/vehicle-types` — returns distribution of vehicle types (Car, Bike, SUV etc.).

**Controller — `adminController.js`**
- Use MongoDB aggregation for all analytics queries. For trends, use `$match` with date ranges and `$group` with date operators.

### Frontend Changes

**Package — Install `recharts`**
- Run `npm install recharts` in the frontend folder.

**Page — `AdminDashboard.js` (update or create)**
- Route: `/admin/dashboard` — this is the default page after admin login.
- Section 1 — Summary Cards (top row): "Total Users", "Total Owners", "Total Vehicles", "Total Bookings", "Total Revenue", "Pending Approvals". Each card shows the number and a small icon.
- Section 2 — Bookings Trend (Line Chart): X-axis = last 30 days (dates), Y-axis = number of bookings. Use `recharts` `<LineChart>` component. Title: "Bookings — Last 30 Days".
- Section 3 — Revenue Trend (Bar Chart): X-axis = last 12 months, Y-axis = revenue in ₹. Use `recharts` `<BarChart>`. Title: "Monthly Revenue".
- Section 4 — Two side-by-side components:
  - Left: Top 5 Vehicles table (Rank, Vehicle Name, Owner, Total Bookings).
  - Right: Vehicle Type Distribution (Pie Chart using `recharts` `<PieChart>`).
- All charts should have loading states (spinner) while data is fetching and error states if fetch fails.
- Add auto-refresh: call the overview endpoint every 60 seconds.

---

## ══════════════════════════════════════
## IMPLEMENTATION NOTES FOR ALL FEATURES
## ══════════════════════════════════════

### Authentication Middleware
All routes marked as "protected" must use the existing `protect` middleware that verifies the JWT from the `Authorization: Bearer <token>` header. Admin-only routes must additionally use an `isAdmin` middleware that checks `req.user.role === "admin"`. Owner-only routes must use an `isOwner` middleware checking `req.user.role === "owner"`.

### Error Handling
All controllers must wrap logic in `try/catch`. On error, return: `res.status(500).json({ message: error.message })`. Use specific status codes: 400 for validation errors, 401 for unauthenticated, 403 for unauthorized, 404 for not found.

### Frontend API Calls
All API calls should use `axios` (or existing fetch utility already in the project). Include the JWT token in the Authorization header: `headers: { Authorization: "Bearer " + localStorage.getItem("token") }`. Create a central `axiosInstance.js` in `/frontend/src/utils/` with the base URL and interceptor for auth headers if one doesn't exist.

### Navigation Updates
- Renter navbar: add links for "My Wishlist", "My Bookings" (with cancel option).
- Owner navbar (separate): Dashboard, My Vehicles, Booking Requests, Availability, Earnings/Stats.
- Admin navbar (separate): Dashboard (Analytics), Users, Vehicles, Bookings, Payments, Reports.

### React Router
Add all new routes to `App.js` within a `<Routes>` block. Wrap role-specific routes with the role-checking `<ProtectedRoute>` component to prevent unauthorized access.

### MongoDB Indexes
For performance on new query patterns, add indexes in the respective Mongoose models:
- `Booking`: index on `renterId`, `vehicleOwnerId`, `status`, `startDate`.
- `Payment`: index on `bookingId`, `status`.
- `Vehicle`: index on `ownerId`, `approvalStatus`, `documentsVerified`.
