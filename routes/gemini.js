const express = require('express');
const router = express.Router();
const axios = require('axios');

const apiKey = process.env.GEMINI_API_KEY;

// ✅ STEP 1: List available models
router.get('/list-models', async (req, res) => {
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    const response = await axios.get(url);
    
    const models = response.data.models
      .filter(m => m.name.includes('generateContent'))
      .map(m => m.name);
    
    console.log('📋 Available models:', models);
    res.json({ models });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ STEP 2: Generate description using AVAILABLE model
router.post('/generate-description', async (req, res) => {
  try {
    const { paintingName, artist } = req.body;

    if (!paintingName || !artist) {
      return res.status(400).json({ error: 'Required fields' });
    }

    console.log('🤖 Generating:', paintingName);

    // Try models in order of preference
    const modelsToTry = [
      'models/gemini-1.5-pro-latest',
      'models/gemini-1.5-flash-latest',
      'models/gemini-pro',
      'models/gemini-pro-vision'
    ];

    let description = null;
    let successModel = null;

    for (const model of modelsToTry) {
      try {
        console.log(`📡 Trying ${model}...`);
        
        const url = `https://generativelanguage.googleapis.com/v1/${model}:generateContent?key=${apiKey}`;
        
        const response = await axios.post(url, {
          contents: [{
            parts: [{ 
              text: `Write 100-150 words about "${paintingName}" by ${artist}. Include history, style, impact.` 
            }]
          }]
        });

        description = response.data.candidates[0].content.parts[0].text;
        successModel = model;
        console.log(`✅ Success with ${model}`);
        break;

      } catch (err) {
        console.log(`⚠️ ${model} failed:`, err.response?.data?.error?.message);
        continue;
      }
    }

    if (!description) {
      throw new Error('No available model succeeded');
    }

    res.json({
      success: true,
      description,
      model: successModel
    });

  } catch (err) {
    console.error('❌ Final Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
