const axios = require('axios');
const redisClient = require('../config/redis');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

class GeminiService {
  constructor() {
    this.apiKey = GEMINI_API_KEY;
    this.baseUrl = GEMINI_API_URL;
    this.enabled = !!GEMINI_API_KEY;

    if (!this.enabled) {
      console.log('⚠️  Gemini API key not configured - using local validation fallback');
    }
  }

  // Fallback validation when Gemini is not available
  fallbackValidation(challenge, userCode, userOutput) {
    const hasCode = userCode && userCode.trim().length > 0;
    const hasOutput = userOutput && (Array.isArray(userOutput) ? userOutput.length > 0 : Object.keys(userOutput).length > 0);

    // Basic heuristic scoring
    let correctnessScore = 0;
    let qualityScore = 0;
    let performanceScore = 0;

    if (hasCode && hasOutput) {
      // Check if output has rows
      const rowCount = Array.isArray(userOutput) ? userOutput.length : 0;

      // Basic correctness - has output
      correctnessScore = rowCount > 0 ? 70 : 30;

      // Quality check - code formatting
      const codeUpper = userCode.toUpperCase();
      if (codeUpper.includes('SELECT') && (codeUpper.includes('FROM') || challenge.description.toLowerCase().includes('create'))) {
        qualityScore = 20;
      }

      // Performance check - no SELECT *
      if (!codeUpper.includes('SELECT *') || challenge.description.includes('all columns')) {
        performanceScore = 30;
      } else {
        performanceScore = 15;
      }
    }

    const correct = correctnessScore >= 60;

    return {
      correct,
      correctnessScore,
      qualityScore,
      performanceScore,
      feedback: {
        correctness: correct ? 'Your query produces output!' : 'Query may need adjustments.',
        quality: qualityScore >= 15 ? 'Good SQL structure.' : 'Consider improving SQL structure.',
        performance: performanceScore >= 25 ? 'Efficient query.' : 'Consider being more specific with column selection.'
      },
      hints: correct ? [] : ['Review the challenge requirements', 'Check your WHERE clause'],
      encouragement: correct ? 'Great job! Keep going!' : 'Keep trying, you\'re making progress!'
    };
  }

  async callGemini(prompt, temperature = 0.1) {
    if (!this.enabled) {
      throw new Error('Gemini API not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: temperature,
            responseMimeType: "application/json"
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Gemini API Error:', error.response ? error.response.data : error.message);
      throw new Error('Failed to communicate with AI service');
    }
  }

  async validateSQLSolution(challenge, userCode, userOutput) {
    // Use fallback if Gemini not configured
    if (!this.enabled) {
      return this.fallbackValidation(challenge, userCode, userOutput);
    }

    const cacheKey = `validation:sql:${challenge.id}:${require('crypto').createHash('md5').update(userCode).digest('hex')}`;

    // Check cache
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    const prompt = `
      You are an expert SQL tutor for Databricks Learning Quest.
      Validate this student's SQL solution.
      
      Challenge Title: ${challenge.title}
      Description: ${challenge.description}
      Expected Output Schema (Context): ${JSON.stringify(challenge.expected_output || 'Table matching requirements')}
      
      Student Code:
      \`\`\`sql
      ${userCode}
      \`\`\`
      
      Student Execution Output (JSON):
      \`\`\`json
      ${JSON.stringify(userOutput || {}).substring(0, 1000)} ... (truncated if long)
      \`\`\`
      
      Analyze for:
      1. Correctness: Does it solve the problem?
      2. Quality: Is it idiomatic SQL? (Indentation, casing, standard practices)
      3. Performance: Any obvious inefficiencies? (e.g. SELECT * on large tables if not needed, inefficient joins)

      Return strictly valid JSON matching this schema:
      {
        "correct": boolean,
        "correctnessScore": number (0-100),
        "qualityScore": number (0-30),
        "performanceScore": number (0-50),
        "feedback": {
          "correctness": "string explanation",
          "quality": "string insights",
          "performance": "string optimization suggestions"
        },
        "hints": ["string", "string"],
        "encouragement": "string"
      }
    `;

    return this.executeWithRetry(cacheKey, prompt);
  }

  async validatePythonSolution(challenge, userCode, userOutput) {
    // Use fallback if Gemini not configured
    if (!this.enabled) {
      return this.fallbackValidation(challenge, userCode, userOutput);
    }

    const cacheKey = `validation:python:${challenge.id}:${require('crypto').createHash('md5').update(userCode).digest('hex')}`;

    // Check cache
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    const prompt = `
      You are an expert PySpark/Python tutor.
      Validate this student's solution.
      
      Challenge: ${challenge.title} - ${challenge.description}
      
      Student Code:
      \`\`\`python
      ${userCode}
      \`\`\`
      
      Output:
      ${JSON.stringify(userOutput || {}).substring(0, 1000)}
      
      Return JSON:
      {
        "correct": boolean,
        "correctnessScore": number (0-100),
        "qualityScore": number (0-30),
        "performanceScore": number (0-50),
        "feedback": {
          "correctness": "string",
          "quality": "string",
          "performance": "string"
        },
        "hints": ["string"],
        "encouragement": "string"
      }
    `;

    return this.executeWithRetry(cacheKey, prompt);
  }

  async generateHint(challenge, userCode, hintLevel) {
    const prompt = `
      The student is stuck on "${challenge.title}".
      Hint Level: ${hintLevel} (1=Small nudge, 2=Specific direction, 3=Code snippet/Major clue).
      
      Current Code:
      ${userCode}
      
      Provide a JSON response:
      {
        "hint": "The hint text",
        "level": ${hintLevel}
      }
    `;

    const result = await this.callGemini(prompt, 0.4);
    return JSON.parse(result.candidates[0].content.parts[0].text);
  }

  async executeWithRetry(cacheKey, prompt, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const result = await this.callGemini(prompt);
        const text = result.candidates[0].content.parts[0].text;

        // Clean markdown code blocks if present (Gemini sometimes wraps JSON in code fences)
        const jsonStr = text.replace(/```json\n?|\n?```/g, '');
        const parsedData = JSON.parse(jsonStr);

        // Cache result (expire in 24h)
        await redisClient.setex(cacheKey, 86400, JSON.stringify(parsedData));

        return parsedData;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i))); // Exponential backoff
      }
    }
  }
}

module.exports = new GeminiService();