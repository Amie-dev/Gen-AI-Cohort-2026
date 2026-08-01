import { GoogleGenAI } from '@google/genai';

// Verify that the Gemini API key is available
if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY is not set in your environment variables.');
  process.exit(1);
}

// Initialize the Google Gen AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const prompt = 'Explain the difference between a REST API and an SDK in 3 simple bullet points.';
  console.log(`Sending prompt to Gemini: "${prompt}"\n`);
  console.log('🤖 Streaming Response:\n');

  try {
    // Generate streamed content using gemini-2.0-flash
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    // Loop through the stream chunks and write to standard output in real-time
    for await (const chunk of responseStream) {
      if (chunk.text) {
        process.stdout.write(chunk.text());
      }
    }
    console.log('\n\nStream finished successfully.');
  } catch (error) {
    console.error('Error occurred while communicating with Gemini API:', error.message);
  }
}

main();
