const express = require('express');
const router = express.Router();
const Minio = require('minio');

// Re-initialize MinIO (same config as upload.js)
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

// Route: /api/evidence/audio/filename.mp3
// The (*) captures the entire path (e.g., "audio/CS-1234_alert.mp3")
router.get('/*', async (req, res) => {
    try {
        const objectName = req.params[0]; // Gets the captured path
        const bucketName = 'forensics-evidence';

        console.log(`🎧 Streaming Audio: ${objectName}`);

        // Check if file exists
        try {
            await minioClient.statObject(bucketName, objectName);
        } catch (err) {
            console.error("File not found:", objectName);
            return res.status(404).send("Audio file not found");
        }

        // Stream it!
        const dataStream = await minioClient.getObject(bucketName, objectName);
        res.setHeader('Content-Type', 'audio/mpeg');
        dataStream.pipe(res);

    } catch (err) {
        console.error("Stream Error:", err);
        res.status(500).send("Error streaming evidence");
    }
});

module.exports = router;