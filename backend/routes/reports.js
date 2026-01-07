const express = require('express');
const router = express.Router();
const Report = require('../models/Report'); // Use the Model

// GET /api/reports
router.get('/', async (req, res) => {
    try {
        // Fetch reports using Mongoose
        // Sort by uploaded_at so the newest file is always top
        const reports = await Report.find()
            .sort({ uploaded_at: -1 })
            .limit(20);
            
        res.json(reports);
    } catch (err) {
        console.error('Error fetching reports:', err);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// NUKE PROTOCOL: Delete all reports (For Demo Reset)
router.delete('/', async (req, res) => {
    try {
        await Report.deleteMany({});
        res.json({ message: 'SYSTEM PURGED. ALL EVIDENCE DESTROYED.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;