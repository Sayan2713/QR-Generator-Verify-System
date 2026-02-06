const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  fields: [String], // Array of strings for dynamic input boxes like ["Name", "Phone"]
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);