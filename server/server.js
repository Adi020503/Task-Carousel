// A simple Node.js server using the Express framework
const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config(); // Loads the .env file with your key

const app = express();
app.use(express.json());

// This is the secure endpoint your front-end will call
app.post('/api/get-suggestions', async (req, res) => {
    console.log("Received a request to /api/get-suggestions"); // New log
    
    const { taskText } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; // The key is securely loaded from .env

    if (!apiKey) {
        console.error("API key not found in .env file."); // New log
        return res.status(500).json({ error: 'API key not found on server.' });
    }

    const prompt = `You are a helpful project manager. Break down the following task into a simple checklist of 3 to 5 short, actionable sub-tasks. Task: "${taskText}"`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: { "subtasks": { type: "ARRAY", items: { type: "STRING" } } }
                    }
                }
            })
        });

        if (!response.ok) {
            // New, more detailed error logging
            const errorBody = await response.text();
            console.error(`Google API Error: ${response.status} ${response.statusText}`, errorBody);
            throw new Error(`Google API Error: ${response.statusText}`);
        }

        const result = await response.json();
        const suggestions = JSON.parse(result.candidates[0].content.parts[0].text);
        
        console.log("Successfully got suggestions from AI."); // New log
        // Send the suggestions back to the front-end
        res.json(suggestions);

    } catch (error) {
        // New, more detailed error logging
        console.error("An error occurred in the /api/get-suggestions endpoint:", error);
        res.status(500).json({ error: 'Failed to get AI suggestions.' });
    }
});

// Serve your index.html file
app.use(express.static('../')); // This serves files from the parent directory

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("Make sure your .env file is in the 'server' directory and contains your GEMINI_API_KEY.");
});