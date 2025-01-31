
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true }, // e.g., "login", "logout", "profile_update"
    ipAddress: { type: String, required: true },
    sessionId: { type: String },
    userAgent: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    details: { type: Object } // Additional details about the action
});

export const LogModel = mongoose.model('logs', logSchema);
