const mongoose = require('mongoose');

const ChainOfCustodySchema = new mongoose.Schema({
  case_id: { type: String, required: true, index: true },
  evidence_id: { type: String, required: true },
  user: { type: String, required: true }, // The investigator's username
  action: { 
    type: String, 
    required: true, 
    enum: ['UPLOAD', 'ACCESS', 'ANALYSIS', 'DELETE'] 
  },
  hash: { type: String, required: true }, // SHA-256 Checksum
  timestamp: { type: Date, default: Date.now },
  details: { type: String }
});

// Create a compound index for faster searching by case and time
ChainOfCustodySchema.index({ case_id: 1, timestamp: -1 });

module.exports = mongoose.model('ChainOfCustody', ChainOfCustodySchema);