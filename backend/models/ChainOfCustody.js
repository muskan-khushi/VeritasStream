const mongoose = require('mongoose');

const ChainOfCustodySchema = new mongoose.Schema({
  case_id: { type: String, required: true, index: true },
  evidence_id: { type: String, required: true },
  file_name: { type: String, required: true },
  
  // The "Fingerprint" - This proves the file hasn't changed
  file_hash: { type: String, required: true }, 
  
  // Who did it? (Defaulting to Admin for the demo)
  user: { type: String, default: 'Admin_Investigator' }, 
  
  // What happened?
  action: { 
    type: String, 
    required: true, 
    default: 'EVIDENCE_ACQUISITION'
  },
  
  // "Blockchain" Simulation
  digital_signature: { type: String }, 
  
  timestamp: { type: Date, default: Date.now },
  details: { type: String }
});

// Index for fast timeline generation
ChainOfCustodySchema.index({ case_id: 1, timestamp: -1 });

module.exports = mongoose.model('ChainOfCustody', ChainOfCustodySchema);