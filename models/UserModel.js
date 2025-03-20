const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String,  unique: true },
    googleId: { type: String, required: true },
    profilePic: { type: String }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User; // Correct export for CommonJS
