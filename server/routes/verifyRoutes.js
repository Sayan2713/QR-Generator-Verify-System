const express = require('express');
const router = express.Router();
const Attendee = require('../models/Attendee');
const { updateRowStatus } = require('../utils/googleSheets');

router.post('/scan', async (req, res) => {
  try {
    const { qrCodeId, eventName, action } = req.body;

    const attendee = await Attendee.findOne({ qrCodeId }).populate('eventId');

    if (!attendee || attendee.eventId.name !== eventName) {
      return res.status(403).json({ message: "Scammer detected!", isScammer: true });
    }

    // Update MongoDB History
    attendee.statusHistory.push({ action, timestamp: new Date() });
    attendee.currentStatus = action;
    await attendee.save();

    // UPDATE EXCEL: This now creates Status, Status2, Status3 automatically
    await updateRowStatus(eventName, qrCodeId, action);

    res.status(200).json({
      message: "Status updated in Excel",
      userName: attendee.formData.Name || "User",
      currentAction: action
    });

  } catch (error) {
    res.status(500).json({ message: "Verification failed", error: error.message });
  }
});

module.exports = router;