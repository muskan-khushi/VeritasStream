const express = require('express');
const router = express.Router();
const Minio = require('minio');
const path = require('path');

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

const BUCKET_NAME = 'forensics-evidence';

router.get('/*', async (req, res) => {
    // 1. Clean the path (force audio/ folder)
    const rawPath = req.params[0];
    const cleanFilename = path.basename(rawPath);
    const correctPath = `audio/${cleanFilename}`;
    
    console.log(`📥 Fetching: ${correctPath}`);

    try {
        // 2. CHECK if file exists
        await minioClient.statObject(BUCKET_NAME, correctPath);

        // 3. NUCLEAR OPTION: Download entire file to RAM (Buffer)
        // This bypasses all "streaming" and "range" issues.
        const dataStream = await minioClient.getObject(BUCKET_NAME, correctPath);
        
        const chunks = [];
        dataStream.on('data', (chunk) => chunks.push(chunk));
        dataStream.on('end', () => {
            const fileBuffer = Buffer.concat(chunks);
            console.log(`✅ File Buffered: ${fileBuffer.length} bytes. Sending...`);

            res.writeHead(200, {
                'Content-Type': 'audio/mpeg',
                'Content-Length': fileBuffer.length,
                'Cache-Control': 'no-store' // Never cache
            });
            res.end(fileBuffer);
        });
        dataStream.on('error', (err) => {
            console.error("Stream Read Error:", err);
            res.status(500).send("Read Error");
        });

    } catch (err) {
        console.error(`❌ File Not Found: ${correctPath}`);
        res.status(404).send("File not found");
    }
});

module.exports = router;