const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { analyzeResume } = require('../utils/analyzer');
const { db } = require('../config/firebase');
const auth = require('../middleware/auth');

const router = express.Router();

// Multer setup for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/', auth, upload.single('resume'), async (req, res) => {
  console.log(`Uploaded file: ${req.file?.originalname}, size: ${req.file?.size || 0} bytes, mimetype: ${req.file?.mimetype || 'unknown'}`);
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Validate file type
  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Unsupported file type. Please upload PDF or DOCX (max 10MB).' });
  }

  try {
    const fileBuffer = req.file.buffer;
    const originalname = req.file.originalname;
    const jobDescription = req.body.jobDescription || "";
    let extractedText = '';

    // Extract text based on file type
    if (originalname.endsWith('.pdf')) {
      const pdfData = await pdfParse(fileBuffer);
      extractedText = pdfData.text;
    } else if (originalname.endsWith('.docx')) {
      const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedText = docxData.value;
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload PDF or DOCX.' });
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ error: 'Could not extract text from the file. It might be an image-based PDF or empty.' });
    }

    // Pass both the resume text and the optional job description to the analyzer
    const analysisResults = await analyzeResume(extractedText, jobDescription);

    // Save to database if connected
    if (db) {
      const newAnalysis = {
        userId: req.user.id,
        fileName: originalname,
        jobDescription: jobDescription,
        score: analysisResults.score,
        missingKeywords: analysisResults.missingKeywords,
        suggestions: analysisResults.suggestions,
        atsKeywords: analysisResults.atsKeywords,
        weakSections: analysisResults.weakSections,
        recommendedJobs: analysisResults.recommendedJobs || [],
        extractedTextPreview: extractedText.substring(0, 200),
        createdAt: new Date().toISOString()
      };
      
      const savedDocRef = await db.collection('analyses').add(newAnalysis);
      console.log(`Analysis saved to Firebase with ID: ${savedDocRef.id}`);
    } else {
      console.log("Firebase not connected. Analysis generated but not saved.");
    }

    // Return the response to the client
    return res.json({
      success: true,
      message: 'Resume analyzed successfully',
      data: analysisResults
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: 'An error occurred during resume processing' });
  }
});

module.exports = router;
