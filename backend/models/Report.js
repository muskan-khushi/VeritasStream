const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  case_id: { type: String, required: true },
  file_name: { type: String, required: true },
  evidence_id: { type: String, required: true, unique: true }, // <--- CRITICAL FIELD
  status: { type: String, default: 'PENDING' },
  risk_score: { type: Number, default: 0 },
  anomalies_found: { type: Number, default: 0 },
  ai_summary: { type: String, default: '' },
  attack_type: { type: String, default: 'Unknown' },
  confidence: { type: Number, default: 0 },
  recommended_action: { type: String, default: '' },
  plot_data: { type: Array, default: [] },
  audio_url: { type: String, default: null }, // For the voice file path
  upload_timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);