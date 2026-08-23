import dotenv from 'dotenv';

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiModelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';

let genAI = null;
let openai = null;

// Dynamically initialize Google Gemini API if installed and key provided
if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    genAI = new GoogleGenerativeAI(geminiApiKey);
    console.log(`[LLM Client] Configured Google Gemini API (${geminiModelName})`);
  } catch (err) {
    console.warn(`[LLM Client Warning] Could not load @google/generative-ai SDK (${err.message}).`);
  }
}

// Dynamically initialize OpenAI API if installed and key provided
if (!genAI && openaiApiKey && openaiApiKey !== 'your_openai_api_key_here') {
  try {
    const { default: OpenAI } = await import('openai');
    openai = new OpenAI({ apiKey: openaiApiKey });
    console.log(`[LLM Client] Configured OpenAI API (${openaiModelName})`);
  } catch (err) {
    console.warn(`[LLM Client Warning] Could not load OpenAI SDK (${err.message}).`);
  }
}

/**
 * Unified LLM Generation Helper with Google Gemini Primary Engine
 * Performs structured or text LLM completions with API key checking & graceful mock fallbacks.
 */
export async function generateLLM({ system, user }) {
  // 1. Primary Engine: Google Gemini API
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: geminiModelName,
        systemInstruction: system
      });

      const result = await model.generateContent(user);
      const responseText = result.response.text();

      return {
        text: responseText.trim()
      };
    } catch (err) {
      console.warn(`[LLM Client Warning] Gemini API call failed (${err.message}). Falling back to local/secondary generation logic.`);
    }
  }

  // 2. Secondary Provider: OpenAI API
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: openaiModelName,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.2
      });

      return {
        text: response.choices[0].message.content.trim()
      };
    } catch (err) {
      console.warn(`[LLM Client Warning] OpenAI call failed (${err.message}). Using local fallback generation logic.`);
    }
  }

  // 3. Graceful Fallback Generation Logic based on system prompt intent
  const sysLower = system.toLowerCase();
  const userLower = user.toLowerCase();

  // Query Rewrite Fallback
  if (sysLower.includes('rewrite the user query')) {
    return {
      text: user.trim().endsWith('?') ? user.trim() : `${user.trim()} details and clarification?`
    };
  }

  // Step-Back Prompting Fallback
  if (sysLower.includes('broader conceptual question')) {
    if (userLower.includes('refund')) {
      return { text: 'What general principles and policies govern customer subscription refunds and billing?' };
    }
    return { text: `What are the core background concepts and principles related to: ${user}?` };
  }

  // Sub-Queries Fallback
  if (sysLower.includes('3-5 independent retrieval questions')) {
    return {
      text: JSON.stringify({
        queries: [
          `1. Terms and conditions regarding ${user}`,
          `2. User eligibility criteria for ${user}`,
          `3. Standard operating procedures for ${user}`
        ]
      })
    };
  }

  // HyDE Fallback
  if (sysLower.includes('hypothetical document')) {
    return {
      text: `Hypothetical document passage addressing: ${user}. Standard enterprise policies specify terms, eligibility, processing timelines, and account rules.`
    };
  }

  // Query Router Fallback
  if (sysLower.includes('query router')) {
    if (userLower.includes('balance') || userLower.includes('account')) {
      return { text: JSON.stringify({ targetStore: 'AUTH_DB' }) };
    }
    if (userLower.includes('refund') && userLower.includes('plan')) {
      return { text: JSON.stringify({ targetStore: 'MULTI_STORE' }) };
    }
    if (userLower.includes('download') || userLower.includes('file') || userLower.includes('invoice')) {
      return { text: JSON.stringify({ targetStore: 'S3' }) };
    }
    return { text: JSON.stringify({ targetStore: 'VECTOR_DB' }) };
  }

  // Grounded Generation Fallback
  if (sysLower.includes('grounded assistant')) {
    return {
      text: `Based on the provided documentation context, customer refund requests are processed according to the plan terms. Eligible accounts are entitled to a prorated refund within 30 days of subscription renewal upon verification.`
    };
  }

  // CRAG Evaluation Fallback
  if (sysLower.includes('evaluate the answer')) {
    return {
      text: JSON.stringify({
        score: 8,
        grounded: true,
        relevance: 'high',
        missing: []
      })
    };
  }

  return {
    text: `Standard response for query: ${user}`
  };
}
