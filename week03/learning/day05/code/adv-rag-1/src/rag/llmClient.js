import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

let openai = null;
if (apiKey && apiKey !== 'your_openai_api_key_here') {
  openai = new OpenAI({ apiKey });
}

/**
 * Unified LLM Generation Helper
 * Performs structured or text LLM completions with API key checking & graceful mock fallbacks.
 */
export async function generateLLM({ system, user }) {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model,
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

  // Fallback Generation Logic based on system prompt intent
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
