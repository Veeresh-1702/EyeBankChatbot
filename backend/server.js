require('dotenv').config();  // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');  // Import fetch

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Function to retrieve access token using Google API key stored in .env
async function getAccessToken() {
    try {
        // Retrieve the secret JSON string and parse it
        const keyFile = JSON.parse(process.env.GOOGLE_API_CREDENTIALS_JSON);  // Parses the JSON string into an object

        const auth = new GoogleAuth({
            credentials: keyFile,
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });

        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();
        console.log('Access token retrieved successfully');
        return accessToken.token;
    } catch (error) {
        console.error('Error retrieving access token:', error);
        throw error;  // Re-throw to handle in the endpoint
    }
}

// Route to handle the chatbot message
app.post('/api/message', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const sessionId = uuidv4();  // Generate a unique session ID
        const token = await getAccessToken();

        const url = `https://dialogflow.googleapis.com/v2/projects/eye-bank-chatbot-kubc/agent/sessions/${sessionId}:detectIntent`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                queryInput: {
                    text: {
                        text: userMessage,
                        languageCode: 'en',
                    },
                },
            }),
        });

        const data = await response.json();
        const botReply = data.queryResult.fulfillmentText;
        res.json({ botReply });
    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
