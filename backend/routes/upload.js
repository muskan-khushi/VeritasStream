const express = require('express');
const router = express.Router();
const multer = require('multer'); // <--- Restored
const crypto = require('crypto');
const Minio = require('minio');
const QueueService = require('../services/queueService');
const ChainOfCustody = require('../models/ChainOfCustody');
const verifyUser = require('../middleware/auth'); // <--- Your Security Guard

// --- 1. Restore Multer Configuration ---
// We use memory storage to stream directly to MinIO (no temp files on disk)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- 2. MinIO Setup ---
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

// Ensure Bucket Exists
const BUCKET_NAME = 'forensics-evidence';
minioClient.bucketExists(BUCKET_NAME, function(err, exists) {
    if (err) return console.log('MinIO Error:', err);
    if (!exists) {
        minioClient.makeBucket(BUCKET_NAME, 'us-east-1', function(err) {
            if (err) return console.log('Error creating bucket:', err);
            console.log('Bucket created successfully in "us-east-1".');
        });
    }
});

// --- 3. The Secure Route ---
// Added 'verifyUser' back to the chain
router.post('/', verifyUser, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No files were uploaded.');
        }

        const file = req.file;
        const caseId = req.body.case_id || 'DEFAULT-CASE';
        
        // Generate Unique Filename
        const objectName = `${caseId}/${Date.now()}-${file.originalname}`;

        // Calculate Hash (SHA-256) for Integrity
        const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

        // Stream to MinIO
        await minioClient.putObject(BUCKET_NAME, objectName, file.buffer);

        // Create Chain of Custody Record
        const custodyRecord = new ChainOfCustody({
            case_id: caseId,
            evidence_id: objectName,
            user: req.user.username, // From JWT Token
            action: 'UPLOAD',
            hash: fileHash,
            details: `File uploaded: ${file.originalname}`
        });
        await custodyRecord.save();

        // Send to RabbitMQ for AI Processing
        const taskPayload = {
            caseId: caseId,
            objectName: objectName,
            originalName: file.originalname,
            bucket: BUCKET_NAME,
            hash: fileHash,
            type: 'log',
            uploadedAt: new Date(),
            user: req.user.username
        };
        await QueueService.publish(taskPayload);

        // Notify Real-Time Clients (WebSockets)
        if (req.app.get('io')) {
             req.app.get('io').emit('status_update', { 
                 message: `New Evidence Received: ${file.originalname}`, 
                 type: 'info' 
             });
        }

        res.status(202).json({
            message: 'Files accepted for processing',
            caseId: caseId,
            file: objectName,
            hash: fileHash
        });

    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).send(error.message);
    }
});

module.exports = router;