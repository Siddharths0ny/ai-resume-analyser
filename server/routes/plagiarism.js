const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// @route   POST api/plagiarism
// @desc    Check text for plagiarism and AI generation probability
router.post('/', auth, async (req, res) => {
  const { text } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({ error: 'Plagiarism check requires Gemini API key.' });
  }

  if (!text || text.length < 50) {
    return res.status(400).json({ error: 'Text must be at least 50 characters.' });
  }

  const prompt = `
    Analyze this text for:
    1. Plagiarism risk score (0-100%, higher = more plagiarized)
    2. AI-generated content probability (0-100%, higher = more AI-like)
    
    Text to analyze (up to 3000 chars): ${text.substring(0, 3000)}
    
    Return JSON only:
    {
      "plagiarismScore": number,
      "aiProbability": number,
      "issues": ["list of specific issues or matches"],
      "suggestions": ["improvement tips"]
    }
  `;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    let content = result.response.text().trim();

    // Clean JSON
    content = content.replace(/```json|```/g, '').trim();
    const data = JSON.parse(content);

    res.json({
      success: true,
      plagiarismScore: data.plagiarismScore || 20,
      aiProbability: data.aiProbability || 30,
      issues: data.issues || [],
      suggestions: data.suggestions || []
    });
  } catch (error) {
    console.error('Plagiarism check error:', error);
    res.status(500).json({ error: 'Plagiarism analysis failed' });
  }
});

module.exports = router;
