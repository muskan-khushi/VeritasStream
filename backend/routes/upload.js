const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const Minio = require('minio');
const QueueService = require('../services/queueService');
const ChainOfCustody = require('../models/ChainOfCustody');
const Report = require('../models/Report'); // <--- NEW IMPORT
const verifyUser = require('../middleware/auth'); 

// --- 1. Multer Configuration ---
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
        });
    }
});

// --- 3. The Secure Route ---
router.post('/', verifyUser, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No files were uploaded.');

        const file = req.file;
        const caseId = req.body.case_id || 'DEFAULT-CASE';
        const objectName = `${caseId}/${Date.now()}-${file.originalname}`;
        const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

        // 1. Upload to MinIO
        await minioClient.putObject(BUCKET_NAME, objectName, file.buffer);

        // 2. Chain of Custody Record
        const custodyRecord = new ChainOfCustody({
            case_id: caseId,
            evidence_id: objectName,
            user: req.user.username,
            action: 'UPLOAD',
            hash: fileHash,
            details: `File uploaded: ${file.originalname}`
        });
        await custodyRecord.save();

        // 3. (NEW) Create Initial Report Record
        // This makes it show up as "Pending" immediately!
        const newReport = new Report({
            case_id: caseId,
            file_name: file.originalname,
            evidence_id: objectName,
            status: 'PROCESSING',
            anomalies_found: 0 
        });
        await newReport.save();

        // 4. Send to RabbitMQ
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

        // 5. Notify Socket.io
        const io = req.app.get('io');
        if (io) {
            io.emit('report_update', { 
                type: 'UPLOAD', 
                message: `Processing started: ${file.originalname}`,
                timestamp: new Date()
            });
        }

        res.status(202).json({
            message: 'Files accepted for processing',
            caseId: caseId,
            file: objectName
        });

    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).send(error.message);
    }
});

module.exports = router;