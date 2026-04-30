const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// @route   POST api/rewrite
// @desc    Rewrite specific resume section using AI
router.post('/', auth, async (req, res) => {
  const { targetSection, originalText } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({ error: 'AI rewriting requires a Gemini API key.' });
  }

  const prompt = `
    You are an expert Resume Writer and ATS Optimizer.
    The user wants to improve a specific section or aspect of their resume.
    
    Target Improvement: ${targetSection}
    
    Original Resume Text:
    ${originalText.substring(0, 3000)} // Truncated to avoid huge payloads

    Please provide a rewritten, highly polished version of the relevant content. Use strong action verbs, quantifiable metrics where implied, and professional tone.
    Output ONLY the rewritten text, nothing else. No intro, no markdown code blocks unless it's for the text itself.
  `;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    const rewrittenText = result.response.text().trim();

    res.json({ success: true, rewrittenText });
  } catch (error) {
    console.error('Rewrite Error:', error.message);
    res.status(500).json({ error: 'Failed to rewrite text using AI.' });
  }
});

module.exports = router;
