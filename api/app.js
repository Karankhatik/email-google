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
const cron = require('node-cron');




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

const checkForReplies = async () => {
    // Fetch all emails that have been sent out
    const emails = await Email.find();


    const user = await GoogleOauth.findOne(); // Assuming there's only one user

    if (!user || !user.isConnected) {
        console.log("No connected user found.");
        return;
    }

    oauth2Client.setCredentials({
        refresh_token: user.refershToken
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    
        try {
            // let rawId = email.messageId;
            // let cleanedId = rawId.replace(/[<>]/g, '');  // Removes angle brackets
            //console.log(`Checking for cleanedId for email with ID: ${cleanedId}`);
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            res = await gmail.users.messages.list({
                userId: 'me',
                q: `in:inbox subject:"Re: " after:${Math.floor(Date.now() / 1000) - 60 * 60}`,
            });

            console.log("res.data.messages: ", res.data.messages[0]);
           

            const messages = res.data.messages;
            if (messages && messages.length > 0) {
                for (let message of messages) {
                    const reply = await gmail.users.messages.get({
                        userId: 'me',
                        id: message.id,
                    });
                    console.log('Reply: ', reply.data.snippet);
                }
            } else {
                console.log(`No replies found for email ID: ${cleanedId}`);
            }

        } catch (error) {
            console.error(`Failed to check for replies for email with ID: ${email._id}:`, error);
        }
  
};


// cron.schedule('* * * * *', () => {
//     console.log('Checking for replies every minute...');
//     checkForReplies();
// });

app.get('/auth', (req, res) => {
    let state = req.query.userID;

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Important: This ensures we receive a refresh token
        scope: [
            'https://mail.google.com/',
            'https://www.googleapis.com/auth/userinfo.email' // Scope to get the user's email
        ],
        state: state
    });
    res.status(200).json({ url, success: true, message: "success" });
});


app.get('/oauth2callback', async (req, res) => {


    try {
        const { code, state } = req.query;
        console.log("code", code, "state", state);

        // Get the access token and refresh token from the authentication server
        const { tokens } = await oauth2Client.getToken(code);

        // Set the credentials for the OAuth2 client
        oauth2Client.setCredentials({
            refresh_token: tokens.refresh_token
        });

        // Fetch user information from the authentication server
        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: 'v2'
        });

        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;

        const googleOAuthData = await GoogleOauth.findOne({ userID: state });
        if (googleOAuthData) {
            googleOAuthData.userEmail = email;
            googleOAuthData.refershToken = tokens.refresh_token;
            googleOAuthData.accessToken = tokens.access_token;
            googleOAuthData.isConnected = true;
            await googleOAuthData.save();
        } else {
            await GoogleOauth.create({
                userEmail: email,
                refershToken: tokens.refresh_token,
                accessToken: tokens.access_token,
                isConnected: true,
                userID: state
            });
        }

        console.log("google auth data ", googleOAuthData);

        res.redirect('https://email-google.vercel.app');
    } catch (error) {
        console.log(error);
    }
});

app.post('/sendMail', async (req, res) => {
    try {
        const { senderMail, receiverMail, subject, text } = req.body;


        const { userEmail, refershToken } = await GoogleOauth.findOne({ userID: req.query.userID });

        oauth2Client.setCredentials({
            refresh_token: refershToken
        });

        // Fetch the token
        const accessTokenResponse = await oauth2Client.getAccessToken();

        // Accessing the access tokens
        const accessToken = accessTokenResponse.res.data.access_token;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: userEmail,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: refershToken,
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

        console.log("Email sent: accepted %s", result.accepted);

        console.log("Email sent: envelope %s", result.envelope);
        console.log("Email sent: ehlo %s", result.ehlo);
        // Save the email details including messageId and possibly threadId to the database
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // Get the threadId from the sent email
        // const sentMessage = await gmail.users.messages.get({
        //     userId: 'me',
        //     id: result.messageId.replace('<', '').replace('>', '')
        // });

        // console.log(sentMessage);

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
    }
})

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