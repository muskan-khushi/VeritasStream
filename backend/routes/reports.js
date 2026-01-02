const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Connect to the specific collection
const Report = mongoose.connection.collection('analysis_reports');

// GET /api/reports - Fetch all forensic reports
router.get('/', async (req, res) => {
    try {
        // Fetch last 20 reports, sorted by newest first
        const reports = await Report.find({})
            .sort({ analyzed_at: -1 })
            .limit(20)
            .toArray();
            
        res.json(reports);
    } catch (err) {
        console.error('Error fetching reports:', err);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// GET /api/reports/:id - Fetch single detailed report
router.get('/:id', async (req, res) => {
    try {
        const report = await Report.findOne({ 
            _id: new mongoose.Types.ObjectId(req.params.id) 
        });
        if (!report) return res.status(404).json({ error: 'Report not found' });
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: 'Invalid ID format' });
    }
});

module.exports = router;