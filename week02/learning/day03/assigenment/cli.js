// Import SDKs
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { Mistral } from '@mistralai/mistralai';
import Groq from 'groq-sdk';

// Helper to check if an API key looks like a placeholder
function isPlaceholder(key) {
  if (!key) return true;
  const lower = key.toLowerCase();
  return lower.includes('your_') || lower.includes('placeholder') || lower === '';
}

function formatAPIError(provider, errorMsg) {
  if (!errorMsg) return `${provider.toUpperCase()} Error: Unknown error`;
  if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('Quota exceeded')) {
    if (provider === 'gemini') {
      return 'Google Gemini: Quota Exceeded (429). Your project\'s free tier requests limit is 0. Please ensure a billing account is linked to your project in Google AI Studio or create your API key inside a new project.';
    }
    return `${provider.toUpperCase()} Error: Rate limit or quota exceeded (429). Please wait a few seconds or check your plan details.`;
  }
  if (errorMsg.includes('401') || errorMsg.includes('API key not valid') || errorMsg.includes('API_KEY_INVALID')) {
    return `${provider.toUpperCase()} Error: Invalid API key. Please check your credentials in the configuration settings or the .env file.`;
  }
  return `${provider.toUpperCase()} Error: ${errorMsg}`;
}

// Streaming function templates
async function streamOpenAI(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (isPlaceholder(key)) {
    console.log('⚠️ OpenAI: API key not set or is placeholder. Skipping.');
    return '';
  }

  console.log('\n--- OpenAI (gpt-4o-mini) ---');
  try {
    const client = new OpenAI({ apiKey: key });
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    let fullText = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullText += content;
        process.stdout.write(content);
      }
    }
    console.log();
    return fullText;
  } catch (err) {
    console.log(`❌ ${formatAPIError('openai', err.message)}`);
    return '';
  }
}

async function streamGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (isPlaceholder(key)) {
    console.log('⚠️ Gemini: API key not set or is placeholder. Skipping.');
    return '';
  }

  console.log('\n--- Google Gemini (gemini-2.0-flash-lite) ---');
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.0-flash-lite',
      contents: prompt,
    });

    let fullText = '';
    for await (const chunk of stream) {
      const content = chunk.text();
      if (content) {
        fullText += content;
        process.stdout.write(content);
      }
    }
    console.log();
    return fullText;
  } catch (err) {
    console.log(`❌ ${formatAPIError('gemini', err.message)}`);
    return '';
  }
}

async function streamGroq(prompt) {
  const key = process.env.GROQ_API_KEY;
  if (isPlaceholder(key)) {
    console.log('⚠️ Groq: API key not set or is placeholder. Skipping.');
    return '';
  }

  console.log('\n--- Groq (llama-3.3-70b-versatile) ---');
  try {
    const client = new Groq({ apiKey: key });
    const stream = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    let fullText = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullText += content;
        process.stdout.write(content);
      }
    }
    console.log();
    return fullText;
  } catch (err) {
    console.log(`❌ ${formatAPIError('groq', err.message)}`);
    return '';
  }
}

async function streamMistral(prompt) {
  const key = process.env.MISTRAL_API_KEY;
  if (isPlaceholder(key)) {
    console.log('⚠️ Mistral: API key not set or is placeholder. Skipping.');
    return '';
  }

  console.log('\n--- Mistral (mistral-large-latest) ---');
  try {
    const client = new Mistral({ apiKey: key });
    const stream = await client.chat.stream({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: prompt }],
    });

    let fullText = '';
    for await (const chunk of stream) {
      const content = chunk.data.choices[0]?.delta?.content || '';
      if (content) {
        fullText += content;
        process.stdout.write(content);
      }
    }
    console.log();
    return fullText;
  } catch (err) {
    console.log(`❌ ${formatAPIError('mistral', err.message)}`);
    return '';
  }
}

// Function to select synthesizer for consensus
function runConsensusSynthesis(prompt, results) {
  // Priority: Gemini -> OpenAI -> Groq -> Mistral
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!isPlaceholder(geminiKey)) {
    return { provider: 'gemini', run: (prompt) => streamGemini(prompt) };
  }
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!isPlaceholder(openaiKey)) {
    return { provider: 'openai', run: (prompt) => streamOpenAI(prompt) };
  }
  const groqKey = process.env.GROQ_API_KEY;
  if (!isPlaceholder(groqKey)) {
    return { provider: 'groq', run: (prompt) => streamGroq(prompt) };
  }
  const mistralKey = process.env.MISTRAL_API_KEY;
  if (!isPlaceholder(mistralKey)) {
    return { provider: 'mistral', run: (prompt) => streamMistral(prompt) };
  }
  return null;
}

function showHelp() {
  console.log('\n⚡ CLI Usage Guide — Day 03 Assignments ⚡\n');
  console.log('1. Multi-Provider Streaming (Assignment 1):');
  console.log('   node --env-file=.env week02/learning/day03/assigenment/cli.js --stream "My Prompt"\n');
  console.log('2. AI Consensus Aggregator (Assignment 2):');
  console.log('   node --env-file=.env week02/learning/day03/assigenment/cli.js --consensus "My Prompt"\n');
  process.exit(0);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    showHelp();
  }

  const mode = args[0];
  const prompt = args[1];

  if (mode !== '--stream' && mode !== '--consensus') {
    showHelp();
  }

  console.log(`\nPrompt: "${prompt}"`);

  if (mode === '--stream') {
    console.log('\n--- Running Multi-Provider AI Streaming ---');
    await streamOpenAI(prompt);
    await streamGemini(prompt);
    await streamGroq(prompt);
    await streamMistral(prompt);
    console.log('\nStreaming complete.');
  } else {
    console.log('\n--- Collecting Responses from All Providers ---');
    // Run sequentially to prevent messy terminal print output, but log progress
    const openaiRes = await streamOpenAI(prompt);
    const geminiRes = await streamGemini(prompt);
    const groqRes = await streamGroq(prompt);
    const mistralRes = await streamMistral(prompt);

    console.log('\n--- Synthesizing Consensus Answer ---');
    const synthesisPrompt = `
    User Prompt: "${prompt}"

    Here are the answers generated by four different AI models:

    ---
    MODEL 1 (OpenAI):
    ${openaiRes || '(Failed to generate response)'}

    ---
    MODEL 2 (Gemini):
    ${geminiRes || '(Failed to generate response)'}

    ---
    MODEL 3 (Groq):
    ${groqRes || '(Failed to generate response)'}

    ---
    MODEL 4 (Mistral):
    ${mistralRes || '(Failed to generate response)'}

    ---
    Task:
    Compare the four answers.
    1. Identify the areas of agreement.
    2. Spot and resolve any contradictions or factual discrepancies.
    3. Synthesize the inputs into a single highly accurate, balanced, and concise final response.
    4. Briefly explain why you resolved discrepancies the way you did.
    `;

    // Try candidates in priority order
    const synthesisCandidates = [
      { provider: 'gemini', run: streamGemini },
      { provider: 'openai', run: streamOpenAI },
      { provider: 'groq', run: streamGroq },
      { provider: 'mistral', run: streamMistral }
    ];

    let synthesisSuccessful = false;
    for (const candidate of synthesisCandidates) {
      const key = process.env[candidate.provider.toUpperCase() + '_API_KEY'];
      if (!isPlaceholder(key)) {
        console.log(`Using ${candidate.provider.toUpperCase()} as consensus synthesis agent...`);
        const result = await candidate.run(synthesisPrompt);
        if (result) {
          synthesisSuccessful = true;
          break;
        } else {
          console.log(`❌ ${candidate.provider.toUpperCase()} synthesis failed. Trying fallback...\n`);
        }
      }
    }

    if (!synthesisSuccessful) {
      console.log('❌ Error: All consensus synthesis candidates failed or no working API credentials found.');
    } else {
      console.log('\nConsensus synthesis complete.');
    }
  }
}

main();
