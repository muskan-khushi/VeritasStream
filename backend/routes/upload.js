const express = require('express');
const router = express.Router();
const Busboy = require('busboy');
const minioService = require('../services/minioService');
const queueService = require('../services/queueService');
const ChainOfCustody = require('../middleware/custody');
const { HashPassThrough } = require('../utils/hash');
const auth = require('../middleware/auth');

// Initialize Custody Logger
const custody = new ChainOfCustody(process.env.MONGO_URI);

router.post('/', auth, async (req, res) => {
  const busboy = Busboy({ 
    headers: req.headers,
    limits: { fileSize: 20 * 1024 * 1024 * 1024 } // 20GB max
  });

  let caseId = 'default-case';
  const uploadedFiles = [];

  busboy.on('field', (name, value) => {
    if (name === 'case_id') caseId = value;
  });

  busboy.on('file', async (fieldname, fileStream, fileInfo) => {
    const { filename, mimeType } = fileInfo;
    console.log(`Receiving file: ${filename}`);

    try {
      // 1. Create Hash Stream
      const hashStream = new HashPassThrough();
      fileStream.pipe(hashStream);

      // 2. Upload to MinIO
      const timestamp = Date.now();
      const objectName = `evidence/${caseId}/${timestamp}_${filename}`;
      
      const uploadResult = await minioService.uploadStream(
        'evidence-bucket',
        objectName,
        hashStream,
        {
          'Content-Type': mimeType,
          'X-Uploaded-By': req.user.email,
          'X-Case-ID': caseId
        }
      );

      const fileHash = hashStream.getHash();

      // 3. Record in Chain of Custody
      await custody.recordAccess(objectName, 'UPLOADED', req.user.id, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        hashAfter: fileHash
      });

      // 4. Determine Log Type
      const logType = filename.endsWith('.evtx') ? 'windows' : 
                      filename.includes('logcat') ? 'android' : 'unknown';

      // 5. Queue for AI Processing
      await queueService.publish('log_processing_task', {
        type: logType,
        bucket: 'evidence-bucket',
        objectName: objectName,
        originalName: filename,
        caseId: caseId,
        fileHash: fileHash,
        uploadedBy: req.user.id,
        uploadedAt: new Date().toISOString()
      });

      uploadedFiles.push({ filename, objectName, hash: fileHash, status: 'queued' });
      console.log(`✅ File queued: ${filename}`);

    } catch (error) {
      console.error(`Upload error for ${filename}:`, error);
      fileStream.resume(); // Drain stream
    }
  });

  busboy.on('finish', () => {
    res.status(202).json({
      message: 'Files accepted for processing',
      caseId: caseId,
      files: uploadedFiles
    });
  });

  req.pipe(busboy);
});

module.exports = router;