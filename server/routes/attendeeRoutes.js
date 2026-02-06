const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const Attendee = require('../models/Attendee');
const Event = require('../models/Event');
const { addRowToSheet } = require('../utils/googleSheets');

// @route   POST /api/attendees/register
// @desc    Register a user, add to Excel with Green color, and generate QR
router.post('/register', async (req, res) => {
  try {
    const { eventId, formData } = req.body;

    // 1. Find the event to get the name (needed to find the correct Google Sheet tab)
    const event = await Event.findById(eventId); // Fixed: Use capital 'Event'
    if (!event) return res.status(404).json({ message: "Event not found" });

    // 2. Generate a Unique ID for this specific ticket
    const qrCodeId = `QR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 3. Create Attendee record in MongoDB
    const newAttendee = new Attendee({
      eventId,
      formData,
      qrCodeId,
      status: 'Registered'
    });
    await newAttendee.save();

    // 4. Add to Google Sheets (Real-time)
    // The addRowToSheet function will automatically color this row Green
    await addRowToSheet(event.name, {
      ...formData,
      QR_ID: qrCodeId, // Added so Excel knows which QR belongs to this user
      Status: 'Registered',
      Timestamp: new Date().toLocaleString()
    });

    // 5. Generate the QR Code Image as a Data URL
    const qrDataUrl = await QRCode.toDataURL(qrCodeId);

    res.status(201).json({
      message: "Registration Successful!",
      qrCode: qrDataUrl,
      attendee: newAttendee
    });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
});

module.exports = router;