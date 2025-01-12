const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

async function getAccessToken() {
    const keyFilePath = path.join(__dirname, '../eye-bank-chatbot-kubc-18e7b5aa0853.json');
    const keyFile = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));

    const auth = new google.auth.GoogleAuth({
        credentials: keyFile,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    return accessToken.token;
}

app.post('/api/message', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const sessionId = uuidv4(); // Generate a unique session ID for each request
        const token = await getAccessToken();

        // Dynamically import node-fetch
        const { default: fetch } = await import('node-fetch');

        const url = `https://dialogflow.googleapis.com/v2/projects/eye-bank-chatbot-kubc/agent/sessions/${sessionId}:detectIntent`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                queryInput: {
                    text: {
                        text: userMessage,
                        languageCode: 'en'
                    }
                }
            })
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
