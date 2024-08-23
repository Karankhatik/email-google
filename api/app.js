const express = require('express');
const app = express();
const cors = require("cors");
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
require('dotenv').config();
const connectDatabase = require("./config/database.js");
const GoogleOauth = require("./models/googleOAuth.js")
const Email = require('./models/email.js');

//connecting to the database
connectDatabase();

app.use((req, res, next) => {
    res.header("Content-Type", "application/json")
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);



app.get('/auth', (req, res) => {
    let state = JSON.stringify({
        userID: req.query.userID,
        for: 'asdsdgsg',
        userLoginID: "1231"
    });

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Important: This ensures we receive a refresh token
        scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://mail.google.com',
            'openid', // Request authentication and an ID token
        ],
        state: state,
        prompt: 'consent',
    });
    res.status(200).json({ url, success: true, message: "success" });
});


app.get('/oauth2callback', async (req, res) => {
    try {
        let { code, state } = req.query;
        

        state = JSON.parse(state);
        console.log("code", code, "state", state);

        // Get the access token and refresh token from the authentication server
        const { tokens } = await oauth2Client.getToken(code);

        // Set the credentials for the OAuth2 client
        oauth2Client.setCredentials(tokens);

        // Fetch user information from the authentication server
        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: 'v2'
        });

        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;

        let googleOAuthData = await GoogleOauth.findOne({ userID: state.userID });
        if (googleOAuthData) {
            googleOAuthData.userEmail = email;
            googleOAuthData.refershToken = tokens.refresh_token;
            googleOAuthData.isConnected = true;
            await googleOAuthData.save();
        } else {
            googleOAuthData = await GoogleOauth.create({
                userEmail: email,
                refreshToken: tokens.refresh_token,
                isConnected: true,
                userID: state.userID
            });
        }

        console.log("google auth data ", googleOAuthData);

        res.redirect('https://email-google.vercel.app');
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Authentication failed' });
    }
});

app.post('/sendMail', async (req, res) => {
    try {
        const { senderMail, receiverMail, subject, text } = req.body;

        const googleOAuthData = await GoogleOauth.findOne({ userID: req.query.userID });
        if (!googleOAuthData) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { userEmail, refreshToken } = googleOAuthData;

        OAuth2Client.setCredentials({
            refresh_token: refreshToken
        });

        // Fetch the access token
        const accessTokenResponse = await OAuth2Client.getAccessToken();
        const accessToken = accessTokenResponse.token;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: userEmail,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: refreshToken,
                accessToken: accessToken
            }
        });

        const mailOptions = {
            from: senderMail,
            to: receiverMail,
            subject: subject,
            text: text,
            html: '<p>' + text + '</p>'
        };

        const result = await transporter.sendMail(mailOptions);

        console.log("Email sent: %s", result);

        // Save the email details including messageId to the database
        const newEmail = new Email({
            messageId: result.messageId, // Assuming Nodemailer provides this correctly
            subject,
            from: senderMail,
            to: receiverMail,
        });

        await newEmail.save();
        res.status(200).json({ success: true, message: 'Email sent successfully' });
        console.log("Message sent: %s", result.messageId);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to send email' });
    }
});


app.delete('/disconnect', async (req, res) => {
    try {
        const email = req.query.email;
        const result = await GoogleOauth.findOneAndDelete({ userEmail: email });
        console.log(result);
        res.status(200).json({ success: true, message: 'disconnected successfully' });
    } catch (error) {
        console.log(error);
    }
});

app.get('/authSetting', async (req, res) => {
    try {
        const result = await GoogleOauth.findOne({
            userID: req.query.userID
        });
        console.log(result);
        res.status(200).json({ success: true, result });
    } catch (error) {
        console.log(error);
    }
});

app.get('/', (req, res) => {
    res.send('server is running!');
})

app.listen(process.env.PORT || 5000, () => {
    console.log('Server listening on port 3000  --> http://localhost:5000');
    console.log('click on this link to get auth: http://localhost:3000/auth');
});