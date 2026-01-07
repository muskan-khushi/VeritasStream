const express = require('express');
const router = express.Router();
const multer = require('multer');
const Minio = require('minio');
const QueueService = require('../services/queueService'); // Ensure this path is correct for your project
const Report = require('../models/Report');

// Multer Setup (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// MinIO Client Setup (Re-initializing here to be safe, or import from a config file)
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

const BUCKET_NAME = 'forensics-evidence';

router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No files were uploaded.');

        const file = req.file;
        // Generate a Case ID if one wasn't provided
        const caseId = req.body.case_id || `CS-${Math.floor(Math.random() * 10000)}`;
        
        // 1. Construct the Unique Object Name (Key)
        // Format: CS-XXXX/TIMESTAMP-filename.ext
        const objectName = `${caseId}/${Date.now()}-${file.originalname}`;

        console.log(`Creating Record for: ${objectName}`);

        // 2. Upload to MinIO
        await minioClient.putObject(BUCKET_NAME, objectName, file.buffer);

        // 3. Save to MongoDB (The "Place Card")
        const newReport = new Report({
            case_id: caseId,
            file_name: file.originalname,
            evidence_id: objectName, // <--- This MUST match what we send to RabbitMQ
            status: 'PROCESSING',
            risk_score: 0
        });
        await newReport.save();
        console.log("✅ MongoDB Record Created");

        // 4. Send to RabbitMQ
        const taskPayload = {
            bucket: BUCKET_NAME,
            objectName: objectName // <--- The Key passed to Worker
        };
        await QueueService.publish(taskPayload);

        // 5. Notify Frontend via Socket
        const io = req.app.get('io');
        if (io) {
            io.emit('report_update', { message: 'New file processing' });
        }

        res.status(200).json({ 
            message: 'Upload successful', 
            case_id: caseId,
            file: objectName 
        });

    } catch (error) {
        console.error("❌ Upload Error:", error);
        res.status(500).json({ error: 'Upload failed', details: error.message });
    }
});

module.exports = router;