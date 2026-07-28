import { get_encoding } from "tiktoken";

// Helper function to show token details
function printTokenDetails(label, tokenizerName, text) {
  const encoder = get_encoding(tokenizerName);
  const encoded = encoder.encode(text);
  
  console.log(`=== ${label} (Tokenizer: ${tokenizerName}) ===`);
  console.log(`Input Text: "${text}"`);
  console.log(`Token Count: ${encoded.length}`);
  console.log(`Token IDs: [${encoded.join(", ")}]`);
  
  // Show individual token fragments
  const fragments = Array.from(encoded).map(id => {
    // Decode each token ID individually
    const decodedBytes = encoder.decode(new Uint32Array([id]));
    return new TextDecoder().decode(decodedBytes);
  });
  console.log(`Tokenized Fragments: ${JSON.stringify(fragments)}`);
  console.log();
  
  // Clean up encoder to prevent memory leaks (tiktoken allocates WASM memory)
  encoder.free();
}

// 1. Basic Tokenization Comparison
console.log("--- TEST 1: Standard English phrase ---");
const englishText = "Hello From Gen AI!";
printTokenDetails("GPT-2 Tokenizer", "gpt2", englishText);
printTokenDetails("GPT-4 Tokenizer (cl100k_base)", "cl100k_base", englishText);

// 2. Multilingual Tokenization Comparison (Demonstrating the Token Tax)
console.log("--- TEST 2: Multilingual phrase ---");
const multilingualText = "नमस्ते (Hello) & ¡Hola!";
printTokenDetails("GPT-2 Tokenizer", "gpt2", multilingualText);
printTokenDetails("GPT-4 Tokenizer (cl100k_base)", "cl100k_base", multilingualText);