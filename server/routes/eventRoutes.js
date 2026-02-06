const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { setupSheet } = require('../utils/googleSheets'); // Import the Google Sheets helper

/**
 * @route   POST /api/events/create
 * @desc    Create a new event template and an automatic Google Sheet tab
 */
router.post('/create', async (req, res) => {
  try {
    const { name, fields } = req.body;

    // 1. Validation: Check if event name already exists in MongoDB
    const existingEvent = await Event.findOne({ name });
    if (existingEvent) {
      return res.status(400).json({ message: "This event name already exists!" });
    }

    // 2. Excel Automation: Create the new tab in your Google Sheet
    try {
      await setupSheet(name, fields);
    } catch (sheetError) {
      return res.status(500).json({ 
        message: "Failed to create Google Sheet tab. Check your credentials.", 
        error: sheetError.message 
      });
    }

    // 3. Database: Save the event structure to MongoDB
    const newEvent = new Event({ 
      name, 
      fields 
    });
    
    await newEvent.save();

    res.status(201).json({ 
      message: "Success! Event saved and Google Sheet tab created.", 
      event: newEvent 
    });

  } catch (error) {
    console.error("Event Creation Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   GET /api/events/list
 * @desc    Get all events for the "OLD Record" list page
 */
router.get('/list', async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route    DELETE /api/events/:id
 * @desc     Delete an event from MongoDB
 */
router.delete('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Find and delete the event
    const deletedEvent = await Event.findByIdAndDelete(eventId);
    
    if (!deletedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Note: This only removes the record from MongoDB. 
    // The Google Sheet tab remains intact for data safety.
    res.json({ message: "Event deleted successfully from database" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;