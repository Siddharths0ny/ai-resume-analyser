const { GoogleGenerativeAI } = require('@google/generative-ai');

// Fallback rule-based analysis
const fallbackAnalysis = (resumeText, jobDescription) => {
  const text = resumeText.toLowerCase();
  let score = 50;
  const missingKeywords = [];
  const suggestions = [];
  const atsKeywords = [];
  const weakSections = [];

  // 1. Basic Section Detection
  const hasEducation = /education|university|college|bachelor|master|phd/.test(text);
  const hasExperience = /experience|work history|employment/.test(text);
  const hasSkills = /skills|technologies|tools/.test(text);
  const hasProjects = /projects|portfolio/.test(text);

  if (hasEducation) score += 10;
  else {
    suggestions.push("Add a dedicated 'Education' section.");
    weakSections.push("Education");
  }

  if (hasExperience) score += 15;
  else {
    suggestions.push("Ensure your 'Experience' or 'Work History' section is clearly labeled.");
    weakSections.push("Experience");
  }

  if (hasSkills) score += 10;
  else {
    suggestions.push("Add a 'Skills' section with comma-separated keywords.");
    weakSections.push("Skills");
  }

  if (!hasProjects) {
    suggestions.push("Adding a 'Projects' section can highlight your practical experience.");
    weakSections.push("Projects");
  }

  // 2. Keyword Matching (Heuristics)
  const commonKeywords = ['react', 'node', 'javascript', 'python', 'java', 'sql', 'aws', 'docker', 'agile', 'management', 'leadership'];
  
  commonKeywords.forEach(kw => {
    if (text.includes(kw)) {
      atsKeywords.push(kw);
      score += 2;
    }
  });

  // 3. Job Description Matching (if provided)
  if (jobDescription) {
    const jdText = jobDescription.toLowerCase();
    const jdWords = jdText.match(/\b(\w+)\b/g) || [];
    
    // Simple extraction of longer words as potential keywords
    const potentialKeywords = [...new Set(jdWords.filter(w => w.length > 4))].slice(0, 20);
    
    let matchedCount = 0;
    potentialKeywords.forEach(kw => {
      if (!text.includes(kw)) {
        if (missingKeywords.length < 5) missingKeywords.push(kw);
      } else {
        matchedCount++;
        if (!atsKeywords.includes(kw)) atsKeywords.push(kw);
      }
    });

    if (potentialKeywords.length > 0) {
      const matchRatio = matchedCount / potentialKeywords.length;
      score += Math.floor(matchRatio * 20);
    }
  }

  // 4. Action Words Check
  const actionWords = ['developed', 'led', 'managed', 'created', 'designed', 'implemented', 'improved', 'increased'];
  let actionWordCount = 0;
  actionWords.forEach(aw => {
    if (text.includes(aw)) actionWordCount++;
  });

  if (actionWordCount < 3) {
    suggestions.push("Improve bullet points by starting with strong action words like 'Developed', 'Led', or 'Implemented'.");
    weakSections.push("Bullet Points");
  }

  // Cap score at 100
  score = Math.min(score, 100);

  return {
    score,
    missingKeywords,
    suggestions,
    atsKeywords,
    weakSections
  };
};

// AI Enhanced Analysis via Google Gemini API
const analyzeWithAI = async (resumeText, jobDescription) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'AIzaSyBptXoqH3kV2ei-dPJ_xGflNVUWbjLQuLk_placeholder') {
    console.log("No Gemini API key found. Falling back to rule-based analysis.");
    return fallbackAnalysis(resumeText, jobDescription);
  }

  const prompt = `
    You are an expert ATS (Applicant Tracking System) and Resume Analyzer.
    Analyze the following resume text.
    ${jobDescription ? `Compare it against this Job Description:\n${jobDescription}\n` : ''}
    
    Resume Text:
    ${resumeText.substring(0, 5000)} // Truncating to avoid massive payloads
    
    Return a JSON object with EXACTLY this structure, no markdown formatting outside the JSON, just the raw JSON:
    {
      "score": <number between 0 and 100 based on quality and JD match>,
      "missingKeywords": [<array of up to 5 missing keywords from the JD or industry standards>],
      "suggestions": [<array of 3 to 5 actionable suggestions like 'Improve bullet points', 'Add action words', etc.>],
      "atsKeywords": [<array of key skills/tools found in the resume>],
      "weakSections": [<array of strings identifying weak structural areas, e.g., 'Education', 'Projects', 'Bullet Points'>],
      "recommendedJobs": [
        {
          "title": "<Job Title>",
          "companyType": "<e.g., Fintech Startup>",
          "matchReason": "<1 short sentence on why they fit>",
          "applyUrl": "<A valid LinkedIn search URL like https://www.linkedin.com/jobs/search/?keywords=Job%20Title>"
        }
      ]
    }
  `;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    let content = result.response.text();
    
    // Clean up potential markdown formatting from LLM response
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(content);
    return {
      score: parsedData.score || 70,
      missingKeywords: parsedData.missingKeywords || [],
      suggestions: parsedData.suggestions || [],
      atsKeywords: parsedData.atsKeywords || [],
      weakSections: parsedData.weakSections || [],
      recommendedJobs: parsedData.recommendedJobs || []
    };
  } catch (error) {
    console.error("AI Analysis failed, using fallback:", error.message);
    return fallbackAnalysis(resumeText, jobDescription);
  }
};

module.exports = {
  analyzeResume: analyzeWithAI,
  fallbackAnalysis
};
