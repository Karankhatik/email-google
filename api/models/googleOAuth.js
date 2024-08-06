const mongoose = require("mongoose")


const googleOAuthSchema = new mongoose.Schema({
    userEmail: {
        type: String,
    },
    refershToken: {
        type: String,
    },
    accessToken: {
        type: String,
    },
    isConnected: {
        type: Boolean,
        default: false
    },
    userID: {
        type: String,
        required: true,
        unique: true
    }
});

const GoogleOauth = mongoose.model("GoogleOAuth", googleOAuthSchema);
module.exports = GoogleOauth;