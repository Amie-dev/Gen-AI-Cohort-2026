import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

// Verify that the Anthropic API key is available
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY is not set in your environment variables.');
  console.log('To run this script, please configure ANTHROPIC_API_KEY in your .env file.');
  process.exit(1);
}

// Initialize the Anthropic client
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function main() {
  const prompt = 'Write a 4-line poem about the synergy of JavaScript and Artificial Intelligence.';
  console.log(`Sending prompt to Claude: "${prompt}"\n`);
  console.log('🤖 Streaming Response:\n');

  try {
    // Generate streamed content using claude-3-5-sonnet-latest
    const stream = client.messages.stream({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 250,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    // Write text chunks to standard output as they arrive
    stream.on('text', (text) => {
      process.stdout.write(text);
    });

    // Await stream completion
    await stream.finalMessage();
    console.log('\n\nStream finished successfully.');
  } catch (error) {
    console.error('Error occurred while communicating with Claude API:', error.message);
  }
}

main();
