const crypto = require('crypto');
const stream = require('stream');

function computeFileHash(readableStream) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    readableStream.on('data', chunk => hash.update(chunk));
    readableStream.on('end', () => resolve(hash.digest('hex')));
    readableStream.on('error', reject);
  });
}

// Compute hash while streaming to MinIO
class HashPassThrough extends stream.PassThrough {
  constructor(options) {
    super(options);
    this.hash = crypto.createHash('sha256');
  }

  _transform(chunk, encoding, callback) {
    this.hash.update(chunk);
    callback(null, chunk);
  }

  getHash() {
    return this.hash.digest('hex');
  }
}

module.exports = { computeFileHash, HashPassThrough };