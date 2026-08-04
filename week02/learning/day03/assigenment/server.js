import http from "http";
import url from "url";
import fs from "fs";
import path from "path";

// Import SDKs
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { Mistral } from "@mistralai/mistralai";
import Groq from "groq-sdk";

const PORT = 3000;

// Helper to check if an API key looks like a placeholder
function isPlaceholder(key) {
  if (!key) return true;
  const lower = key.toLowerCase();
  return (
    lower.includes("your_") || lower.includes("placeholder") || lower === ""
  );
}

// Function to stream from OpenAI
async function streamOpenAI(
  prompt,
  apiKey,
  modelName,
  onChunk,
  onError,
  onDone,
) {
  const key = isPlaceholder(apiKey) ? process.env.OPENAI_API_KEY : apiKey;
  if (isPlaceholder(key)) {
    onError("OpenAI API Key is not set or is a placeholder.");
    onDone();
    return "";
  }

  try {
    const client = new OpenAI({ apiKey: key });
    const stream = await client.chat.completions.create({
      model: modelName || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    let fullText = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullText += content;
        onChunk(content);
      }
    }
    onDone();
    return fullText;
  } catch (err) {
    onError(err.message);
    onDone();
    return "";
  }
}

// Function to stream from Gemini
async function streamGemini(
  prompt,
  apiKey,
  modelName,
  onChunk,
  onError,
  onDone,
) {
  const key = isPlaceholder(apiKey) ? process.env.GEMINI_API_KEY : apiKey;
  if (isPlaceholder(key)) {
    onError("Gemini API Key is not set or is a placeholder.");
    onDone();
    return "";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const stream = await ai.models.generateContentStream({
      model: modelName || "gemini-2.0-flash-lite",
      contents: prompt,
    });

    let fullText = "";
    for await (const chunk of stream) {
      const content = chunk.text();
      if (content) {
        fullText += content;
        onChunk(content);
      }
    }
    onDone();
    return fullText;
  } catch (err) {
    onError(err.message);
    onDone();
    return "";
  }
}

// Function to stream from Groq
async function streamGroq(prompt, apiKey, modelName, onChunk, onError, onDone) {
  const key = isPlaceholder(apiKey) ? process.env.GROQ_API_KEY : apiKey;
  if (isPlaceholder(key)) {
    onError("Groq API Key is not set or is a placeholder.");
    onDone();
    return "";
  }

  try {
    const client = new Groq({ apiKey: key });
    const stream = await client.chat.completions.create({
      model: modelName || "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    let fullText = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullText += content;
        onChunk(content);
      }
    }
    onDone();
    return fullText;
  } catch (err) {
    onError(err.message);
    onDone();
    return "";
  }
}

// Function to stream from Mistral
async function streamMistral(
  prompt,
  apiKey,
  modelName,
  onChunk,
  onError,
  onDone,
) {
  const key = isPlaceholder(apiKey) ? process.env.MISTRAL_API_KEY : apiKey;
  if (isPlaceholder(key)) {
    onError("Mistral API Key is not set or is a placeholder.");
    onDone();
    return "";
  }

  try {
    const client = new Mistral({ apiKey: key });
    const stream = await client.chat.stream({
      model: modelName || "mistral-large-latest",
      messages: [{ role: "user", content: prompt }],
    });

    let fullText = "";
    for await (const chunk of stream) {
      const content = chunk.data.choices[0]?.delta?.content || "";
      if (content) {
        fullText += content;
        onChunk(content);
      }
    }
    onDone();
    return fullText;
  } catch (err) {
    onError(err.message);
    onDone();
    return "";
  }
}

// Helper to find a working key for the consensus synthesis step
function getConsensusSynthesizer(queryKeys) {
  // Priority: Gemini -> OpenAI -> Groq -> Mistral
  const geminiKey = isPlaceholder(queryKeys.geminiKey)
    ? process.env.GEMINI_API_KEY
    : queryKeys.geminiKey;
  if (!isPlaceholder(geminiKey)) {
    return { provider: "gemini", key: geminiKey, model: "gemini-2.0-flash-lite" };
  }

  const openaiKey = isPlaceholder(queryKeys.openaiKey)
    ? process.env.OPENAI_API_KEY
    : queryKeys.openaiKey;
  if (!isPlaceholder(openaiKey)) {
    return { provider: "openai", key: openaiKey, model: "gpt-4o-mini" };
  }

  const groqKey = isPlaceholder(queryKeys.groqKey)
    ? process.env.GROQ_API_KEY
    : queryKeys.groqKey;
  if (!isPlaceholder(groqKey)) {
    return { provider: "groq", key: groqKey, model: "llama-3.3-70b-versatile" };
  }

  const mistralKey = isPlaceholder(queryKeys.mistralKey)
    ? process.env.MISTRAL_API_KEY
    : queryKeys.mistralKey;
  if (!isPlaceholder(mistralKey)) {
    return {
      provider: "mistral",
      key: mistralKey,
      model: "mistral-large-latest",
    };
  }

  return null;
}

function formatAPIError(provider, errorMsg) {
  if (!errorMsg) return 'Unknown error';
  if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('Quota exceeded')) {
    if (provider === 'gemini' || provider === 'consensus') {
      return 'Google Gemini: Quota Exceeded (429). Your project\'s free tier requests limit is 0. Please ensure a billing account is linked to your project in Google AI Studio or create your API key inside a new project.';
    }
    return `${provider.toUpperCase()}: Rate limit or quota exceeded (429). Please wait a few seconds or check your plan details.`;
  }
  if (errorMsg.includes('401') || errorMsg.includes('API key not valid') || errorMsg.includes('API_KEY_INVALID')) {
    return `${provider.toUpperCase()}: Invalid API key. Please check your credentials in the configuration settings or the .env file.`;
  }
  return errorMsg;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Serve Frontend UI
  if (pathname === "/" || pathname === "/index.html") {
    const filePath = path.join(
      process.cwd(),
      "week02/learning/day03/assigenment/public/index.html",
    );
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(
          "Error loading dashboard index.html. Ensure the public/index.html file exists.",
        );
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(content);
      }
    });
    return;
  }

  // API Endpoint: Event Stream for parallel generation & consensus synthesis
  if (pathname === "/api/stream" || pathname === "/api/consensus") {
    const isConsensusMode = pathname === "/api/consensus";
    const query = parsedUrl.query;
    const prompt = query.prompt;

    if (!prompt) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Missing prompt parameter");
      return;
    }

    // Set SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    const sendSSE = (provider, type, content) => {
      const payload = { provider, type };
      if (type === "chunk") payload.text = content;
      if (type === "error") payload.error = formatAPIError(provider, content);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    // Collect query-based overrides
    const keys = {
      openaiKey: query.openai_key,
      geminiKey: query.gemini_key,
      groqKey: query.groq_key,
      mistralKey: query.mistral_key,
    };

    const models = {
      openaiModel: query.openai_model,
      geminiModel: query.gemini_model,
      groqModel: query.groq_model,
      mistralModel: query.mistral_model,
    };

    // Parallel calls
    const providers = ["openai", "gemini", "groq", "mistral"];
    const results = {};
    let activeProviders = 4;

    const streamPromises = [
      streamOpenAI(
        prompt,
        keys.openaiKey,
        models.openaiModel,
        (chunk) => sendSSE("openai", "chunk", chunk),
        (err) => sendSSE("openai", "error", err),
        () => {
          sendSSE("openai", "done");
          activeProviders--;
        },
      ).then((text) => {
        results.openai = text;
      }),

      streamGemini(
        prompt,
        keys.geminiKey,
        models.geminiModel,
        (chunk) => sendSSE("gemini", "chunk", chunk),
        (err) => sendSSE("gemini", "error", err),
        () => {
          sendSSE("gemini", "done");
          activeProviders--;
        },
      ).then((text) => {
        results.gemini = text;
      }),

      streamGroq(
        prompt,
        keys.groqKey,
        models.groqModel,
        (chunk) => sendSSE("groq", "chunk", chunk),
        (err) => sendSSE("groq", "error", err),
        () => {
          sendSSE("groq", "done");
          activeProviders--;
        },
      ).then((text) => {
        results.groq = text;
      }),

      streamMistral(
        prompt,
        keys.mistralKey,
        models.mistralModel,
        (chunk) => sendSSE("mistral", "chunk", chunk),
        (err) => sendSSE("mistral", "error", err),
        () => {
          sendSSE("mistral", "done");
          activeProviders--;
        },
      ).then((text) => {
        results.mistral = text;
      }),
    ];

    // Wait for all provider streams to complete
    await Promise.all(streamPromises);

    // If consensus mode, run synthesis using a working provider
    if (isConsensusMode) {
      sendSSE("consensus", "status", "Synthesizing final consensus answer...");

      // Build the compilation prompt
      const synthesisPrompt = `
      User Prompt: "${prompt}"

      Here are the answers generated by four different AI models:

      ---
      MODEL 1 (OpenAI):
      ${results.openai || "(Failed to generate response)"}

      ---
      MODEL 2 (Gemini):
      ${results.gemini || "(Failed to generate response)"}

      ---
      MODEL 3 (Groq):
      ${results.groq || "(Failed to generate response)"}

      ---
      MODEL 4 (Mistral):
      ${results.mistral || "(Failed to generate response)"}

      ---
      Task:
      Compare the four answers.
      1. Identify the areas of agreement.
      2. Spot and resolve any contradictions or factual discrepancies.
      3. Synthesize the inputs into a single highly accurate, balanced, and concise final response.
      4. Briefly explain why you resolved discrepancies the way you did.
      `;

      // Select and run synthesizer client with fallback
      const synthesisCandidates = [];
      const geminiKey = isPlaceholder(keys.geminiKey)
        ? process.env.GEMINI_API_KEY
        : keys.geminiKey;
      if (!isPlaceholder(geminiKey)) {
        synthesisCandidates.push({
          provider: "gemini",
          key: geminiKey,
          model: models.geminiModel || "gemini-2.0-flash-lite",
          run: streamGemini,
        });
      }
      const openaiKey = isPlaceholder(keys.openaiKey)
        ? process.env.OPENAI_API_KEY
        : keys.openaiKey;
      if (!isPlaceholder(openaiKey)) {
        synthesisCandidates.push({
          provider: "openai",
          key: openaiKey,
          model: models.openaiModel || "gpt-4o-mini",
          run: streamOpenAI,
        });
      }
      const groqKey = isPlaceholder(keys.groqKey)
        ? process.env.GROQ_API_KEY
        : keys.groqKey;
      if (!isPlaceholder(groqKey)) {
        synthesisCandidates.push({
          provider: "groq",
          key: groqKey,
          model: models.groqModel || "llama-3.3-70b-versatile",
          run: streamGroq,
        });
      }
      const mistralKey = isPlaceholder(keys.mistralKey)
        ? process.env.MISTRAL_API_KEY
        : keys.mistralKey;
      if (!isPlaceholder(mistralKey)) {
        synthesisCandidates.push({
          provider: "mistral",
          key: mistralKey,
          model: models.mistralModel || "mistral-large-latest",
          run: streamMistral,
        });
      }

      let synthesisSuccessful = false;
      const onChunk = (chunk) => sendSSE("consensus", "chunk", chunk);
      const onDone = () => {}; // No-op during execution to prevent premature 'done' events

      for (const candidate of synthesisCandidates) {
        let candidateError = "";
        const onError = (err) => {
          candidateError = err;
        };

        sendSSE(
          "consensus",
          "status",
          `Synthesizing final consensus answer using ${candidate.provider.toUpperCase()}...`,
        );
        const result = await candidate.run(
          synthesisPrompt,
          candidate.key,
          candidate.model,
          onChunk,
          onError,
          onDone,
        );
        if (result) {
          synthesisSuccessful = true;
          sendSSE("consensus", "done");
          break;
        } else {
          sendSSE(
            "consensus",
            "error",
            `${candidate.provider.toUpperCase()} synthesis failed: ${candidateError || "Unknown error"}. Trying fallback...`,
          );
        }
      }

      if (!synthesisSuccessful) {
        sendSSE(
          "consensus",
          "error",
          "All consensus synthesis candidates failed or no working API credentials found.",
        );
        sendSSE("consensus", "done");
      }
    }

    res.write("event: end\ndata: stream ended\n\n");
    res.end();
    return;
  }

  // Handle resource files (e.g. stylesheet, browser JS, icons) - Send 404 for simplicity since all files are in HTML
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("File Not Found");
});

server.listen(PORT, () => {
  console.log(`\n🚀 AI Dashboard Server running at http://localhost:${PORT}`);
  console.log("Press Ctrl+C to terminate\n");
});
