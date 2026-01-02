const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
});

const ensureBucket = async (bucketName) => {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName, 'us-east-1');
  }
};

module.exports = {
  client: minioClient,
  uploadStream: async (bucket, objectName, stream, meta) => {
    await ensureBucket(bucket);
    return minioClient.putObject(bucket, objectName, stream, null, meta);
  }
};