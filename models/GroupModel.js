const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    groupName: { type: String, required: true, unique: true },
    members: [{ type: String }], // Array of usernames
    messages: [{
        sender: String,
        message: String,
        timestamp: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('Group', GroupSchema);
