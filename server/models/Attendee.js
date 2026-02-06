const mongoose = require('mongoose');

const attendeeSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  formData: Object, 
  qrCodeId: { type: String, unique: true },
  // Changed from String to Array to store history
  statusHistory: [{
    action: String,
    timestamp: { type: Date, default: Date.now }
  }],
  // Keep this for quick reference of the LATEST status
  currentStatus: { type: String, default: 'Registered' }
});

module.exports = mongoose.model('Attendee', attendeeSchema);