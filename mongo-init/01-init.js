db = db.getSiblingDB('forensics');

// Create Time Series Collection for logs
db.createCollection('logs', {
  timeseries: {
    timeField: 'timestamp',
    metaField: 'metadata',
    granularity: 'seconds'
  },
  expireAfterSeconds: 31536000 // 1 year retention
});

// Create indexes
db.logs.createIndex({ 'metadata.case_id': 1, 'timestamp': -1 });
db.logs.createIndex({ 'ai_tags.is_anomaly': 1 });

// Custody log for evidence integrity
db.createCollection('custody_log');
db.custody_log.createIndex({ evidence_id: 1, timestamp: -1 });

print('Database initialized successfully');