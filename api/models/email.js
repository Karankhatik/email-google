const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    messageId: {
        type: String,
        required: true,
        unique: true // Ensuring that each message ID is unique
    },
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    reply: {
        type: String,
        default: ''
    }
});

const Email = mongoose.model('Email', emailSchema);

module.exports = Email;
