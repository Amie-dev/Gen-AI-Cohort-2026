import { GoogleGenAI } from "@google/genai";
import axios from 'axios';
import { exec } from 'child_process';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function getWeatherData(cityName) {
  const url = `https://wttr.in/${cityName.toLowerCase()}?format=%C+%t`;
  const response = await axios.get(url, { responseType: 'text' });
  return JSON.stringify({ cityName, weatherInfo: response.data });
}

async function executeCommandOnCli(cmd) {
  return new Promise((res) => {
    exec(cmd, (err, out) => {
      if (err) return res(`There was an Error ${err}`);
      else return res(out);
    });
  });
}

const SYSTEM_PROMPT = `
  You are an expert AI engineer. Only and only answer questions related to the coding and enginnering.

  You have to analyse the user's input carefully and then you need to
  breakdown the problem into multiple sub problems before comming on to the final result. Always breakdown
  the users intention and how to solve that problem and then step by step solve it.

  We are going to follow a pipeline of "INITAL", "THINK", "TOOL_REQUEST", "ANALYSE" and "OUTPUT" pipline.

  The Pipeline:
  - "INITAL" When user gives an input, we will have an inital thought process on what this user is trying to do.
  - "THINK" this is where we are going to think about how to solve this and then start to breakdown the problem
  - "ANALYSE" this is where we will analyse the solution and also verify if the output is correct
  - "THINK" we can go back to think mode where we now see if any sub problem remanins and think
  - "ANALYSE" again analyse the problem and get onto a solution
  - "TOOL_REQUEST": use this for calling or requesting a tool. The format of output would be
    { "step": "TOOL_REQUEST", "functionName": "getWeatherData", "input": "Goa" }
  - "OUTPUT" this is where we can end and give the final output to the user.

  Available Tools:
  - "getWeatherData": getWeatherData(cityName: string): Returns the realtime weather information of city
  - "executeCommandOnCli": executeCommandOnCli(command: string): Executes the command on user's device and returns output from stdout

  Rules:
  - Always output one step at a time and wait for other step before proceeding.
  - Always maintain the sequence of pipeline as given in example
  - Always follow JSON output format strictly.

  Example:
  - "USER": What is 2 + 2 - 5 * 10 / 3?
  OUTPUT:
  - "INITAL": "The user wants me to solve a maths equation"
  - "THINK": "I will use the BODMAS formula and based on that I should firt multiple 5 * 10 which is 50"
  - "ANALYSE": "Yes, the bodmas is actaully right and now equation is 2 + 2 - 50 / 3"
  - "THINK": "Now as per rule I should perform divide which is dividing 50 / 3 which is 16.666667"
  - "ANALYSE": "Now the new equations remains 2 + 2 - 16.666667"
  - "THINK": "Now its simple we can just do 2 + 2 = 4 and new equation remains 4 - 16.6666667"
  - "ANALYSE": "Great, now lets just do the final step as simple subtraction"
  - "THINK": "After the final subtraction the ans remations -12.666667"
  - "OUTPUT": "The final output is "-12.666667"

  Example:
  - "USER" what is weather of Goa?
  OUTPUT:
   - "INITAL": "The user wants me to fetch weather information of Goa",
   - "THINK": "From the tools I can see we have a tool named getWeatherData which can be called"
   - "ANALYSE": "We are going right we can call getWeatherData with "GOA" as input"
   - "TOOL_REQUEST": { "functionName": "getWeatherData", "input": "goa" }
   - "TOOL_OUTPUT": The weather of Goa is sunny with some 30 degree c.
   - "THINK": "We got the weather info"
   - "OUTPUT": "The weather of Goa is sunny with some 30 degree c. Its goona be Hottttttt"

  Output Format:
  { "step": "INITAL" | "THINK" | "TOOL_REQUEST" | "ANALYSE" | "OUTPUT", "text": "<The Actual Text>", "functionName": "<NAME OF FUNCTION>", "input": "INPUT PARAMS of Function" }
`;

const MESSAGES_DB = [];

async function generateWithRetry(contents) {
  let retries = 5;
  while (retries > 0) {
    try {
      return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
        }
      });
    } catch (error) {
      const errMsg = error.message || "";
      const status = error.status || 0;
      const errorStr = JSON.stringify(error) || "";
      
      const isTransient = status === 429 || status === 503 || status === 502 || status === 504 || 
                          errMsg.includes("429") || errMsg.includes("503") || 
                          errMsg.includes("UNAVAILABLE") || errMsg.includes("demand") ||
                          errorStr.includes("429") || errorStr.includes("503");

      if (isTransient) {
        console.warn(`⚠️ Transient API error (status ${status}). Retrying in 10 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        retries--;
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded for Gemini API call.");
}

async function main(prompt = '') {
  MESSAGES_DB.push({ role: 'user', content: prompt });

  while (true) {
    // Map MESSAGES_DB into Gemini's alternating user/model pattern
    // Tool/developer outputs are mapped to 'user' role
    const contents = MESSAGES_DB.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    try {
      const result = await generateWithRetry(contents);

      const rawResult = result.text;
      const parsedResult = JSON.parse(rawResult);

      MESSAGES_DB.push({ role: 'assistant', content: rawResult });

      console.log(`🤖 (${parsedResult.step}): ${parsedResult.text}`);

      if (parsedResult.step.toLowerCase() === 'output') break;

      if (parsedResult.step.toUpperCase() === 'TOOL_REQUEST') {
        const { functionName, input } = parsedResult;

        if (functionName === 'executeCommandOnCli') {
          const toolResult = await executeCommandOnCli(input);
          console.log(`🛠️(${functionName}):${input}`, toolResult);
          MESSAGES_DB.push({
            role: 'user', // feed back tool output as user role
            content: JSON.stringify({
              step: 'TOOL_OUTPUT',
              output: toolResult,
            }),
          });
        } else if (functionName === 'getWeatherData') {
          const toolResult = await getWeatherData(input);
          console.log(`🛠️(${functionName}):${input}`, toolResult);
          MESSAGES_DB.push({
            role: 'user', // feed back tool output as user role
            content: JSON.stringify({
              step: 'TOOL_OUTPUT',
              output: toolResult,
            }),
          });
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error in agent loop:", error.message);
      break;
    }
  }
}

main('Build a funny functional design working TODO application and run on browser and store all files on todo folder');
