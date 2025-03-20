const mongoose = require('mongoose');

const FriendSchema = new mongoose.Schema({
    username: { type: String, required: true },
    friends: [
        {
            username: { type: String, required: true },
            profilePic: { type: String, required: true },
            isOnline: { type: Boolean, default: false }
        }
    ]
});

module.exports = mongoose.model('Friend', FriendSchema);
