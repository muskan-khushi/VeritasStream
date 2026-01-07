const express = require('express');
const router = express.Router();
const Minio = require('minio');
const path = require('path');

// Re-initialize MinIO
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

const BUCKET_NAME = 'forensics-evidence';

router.get('/*', async (req, res) => {
    const rawPath = req.params[0];
    const cleanFilename = path.basename(rawPath);
    const correctPath = `audio/${cleanFilename}`;

    try {
        // 1. Check File Stats
        const stat = await minioClient.statObject(BUCKET_NAME, correctPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        // 2. Handle "Range Requests" (Critical for Audio)
        if (range) {
            // Parse "bytes=0-1024"
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;

            console.log(`✂️ Serving Chunk: ${start}-${end} (${chunksize} bytes)`);

            // Send 206 Partial Content Header
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'no-cache' // Development mode
            });

            // Stream ONLY the requested chunk
            const stream = await minioClient.getPartialObject(BUCKET_NAME, correctPath, start, chunksize);
            stream.pipe(res);

        } else {
            // 3. Fallback: No Range (Send Whole File)
            console.log(`📦 Serving Whole File: ${fileSize} bytes`);
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'audio/mpeg',
                'Accept-Ranges': 'bytes' // Tell browser we support ranges next time
            });
            
            const stream = await minioClient.getObject(BUCKET_NAME, correctPath);
            stream.pipe(res);
        }

    } catch (err) {
        console.error(`❌ Stream Error for '${correctPath}':`, err.message);
        if (!res.headersSent) res.status(404).send("Audio stream failed");
    }
});

module.exports = router;