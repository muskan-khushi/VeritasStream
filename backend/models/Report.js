const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  case_id: { type: String, required: true },
  file_name: { type: String, required: true },
  evidence_id: { type: String, required: true },
  uploaded_at: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], 
    default: 'PENDING' 
  },
  anomalies_found: { type: Number, default: 0 },
  risk_score: { type: Number, default: 0 },
  ai_summary: { type: String, default: "Analysis pending..." }
}, { collection: 'analysis_reports' }); // Force it to match your existing collection name

module.exports = mongoose.model('Report', ReportSchema);