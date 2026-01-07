const express = require('express');
const router = express.Router();
const Minio = require('minio');

// Re-initialize MinIO
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

const BUCKET_NAME = 'forensics-evidence';

// Route: /api/evidence/*
router.get('/*', async (req, res) => {
    try {
        // 1. Capture the full path (e.g. "audio/CS-1234_alert.mp3")
        const objectName = req.params[0]; 

        console.log(`🎧 Streaming Request: ${objectName}`);

        // 2. Get File Stats FIRST (Critical for Audio Player!)
        let stat;
        try {
            stat = await minioClient.statObject(BUCKET_NAME, objectName);
        } catch (err) {
            console.error(`❌ File not found in MinIO: ${objectName}`);
            return res.status(404).send("Audio file not found");
        }

        // 3. Set Headers (This fixes the 0:00 bug)
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', stat.size); // <--- The Missing Key!
        res.setHeader('Accept-Ranges', 'bytes');    // Allows seeking/scrubbing

        // 4. Stream the file
        const dataStream = await minioClient.getObject(BUCKET_NAME, objectName);
        dataStream.pipe(res);

    } catch (err) {
        console.error("❌ Stream Error:", err);
        // Only send error if headers haven't been sent yet
        if (!res.headersSent) {
            res.status(500).send("Error streaming evidence");
        }
    }
});

module.exports = router;