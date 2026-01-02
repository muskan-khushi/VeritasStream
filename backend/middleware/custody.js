const crypto = require('crypto');
const { MongoClient } = require('mongodb');

class ChainOfCustody {
  constructor(mongoUri) {
    this.client = new MongoClient(mongoUri);
    this.db = null;
    this.collection = null;
    this.init();
  }

  async init() {
    try {
      // Connect specifically to the 'forensics' database
      await this.client.connect();
      this.db = this.client.db('forensics');
      this.collection = this.db.collection('custody_log');
      console.log('🔗 Chain of Custody connected');
    } catch (err) {
      console.error('Custody DB Error:', err);
    }
  }

  recordAccess = async (evidenceId, action, userId, metadata = {}) => {
    if (!this.collection) await this.init();

    const record = {
      evidence_id: evidenceId,
      action: action, // 'UPLOADED', 'ACCESSED', 'ANALYZED'
      user_id: userId,
      timestamp: new Date(),
      ip_address: metadata.ip,
      user_agent: metadata.userAgent,
      hash_before: metadata.hashBefore,
      hash_after: metadata.hashAfter,
      signature: null
    };

    // Digital signature for tamper-proof logging
    record.signature = this.signRecord(record);
    
    await this.collection.insertOne(record);
    return record;
  }

  signRecord(record) {
    const data = JSON.stringify({
      evidence_id: record.evidence_id,
      action: record.action,
      timestamp: record.timestamp.toISOString()
    });
    return crypto
      .createHmac('sha256', process.env.CUSTODY_SECRET)
      .update(data)
      .digest('hex');
  }
}

module.exports = ChainOfCustody;