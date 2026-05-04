const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Word count utility
const wordCount = (text) => text.trim().split(/\s+/).length;

// @route   POST api/humanize
// @desc    Humanize AI text + AI % before/after, max 300 words
router.post('/', auth, async (req, res) => {
  const { text } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({ error: 'Humanizer requires Gemini API key.' });
  }

  if (!text || text.length < 20) {
    return res.status(400).json({ error: 'Text must be at least 20 characters.' });
  }

  // Truncate to ~300 words max input
  const truncatedText = text.substring(0, 2000);
  const originalWordCount = wordCount(truncatedText);

  const detectPrompt = `
    Estimate AI-generated probability (0-100%) for this text:
    ${truncatedText}
    
    Respond ONLY with number e.g. "85"
  `;

  const humanizePrompt = `
    Humanize this potentially AI-generated text:
    "${truncatedText}"
    
    Make it sound natural, human-written:
    - Vary sentence length/structure
    - Add natural contractions (I'm, it's)
    - Use conversational tone where appropriate
    - Keep meaning intact
    - Limit to 300 words MAX
    
    Output ONLY the humanized text.
  `;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // AI detection before
    const detectResult = await model.generateContent(detectPrompt);
    const aiBefore = parseFloat(detectResult.response.text().trim()) || 70;

    // Humanize
    const humanizeResult = await model.generateContent(humanizePrompt);
    let humanized = humanizeResult.response.text().trim();
    const humanizedWordCount = wordCount(humanized);

    // Truncate to 300 words
    if (humanizedWordCount > 300) {
      const words = humanized.split(/\s+/);
      humanized = words.slice(0, 300).join(' ') + '...';
    }

    // AI detection after
    const afterDetectResult = await model.generateContent(detectPrompt.replace(truncatedText, humanized.substring(0, 2000)));
    const aiAfter = parseFloat(afterDetectResult.response.text().trim()) || 30;

    res.json({
      success: true,
      originalAiProb: Math.round(aiBefore),
      humanizedAiProb: Math.round(aiAfter),
      originalWords: originalWordCount,
      humanizedText: humanized,
      humanizedWords: Math.min(wordCount(humanized), 300)
    });
  } catch (error) {
    console.error('Humanize error:', error);
    res.status(500).json({ error: 'Humanization failed' });
  }
});

module.exports = router;
