import Groq from "groq-sdk";

// Initialize the Groq client
const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `
you are expert ai engineer. you have to analyse the user input crefully and then you need to brackdown the problem into multiple sub problem before coming on the final result.Alaway breack the the user internsation and how to soleve thhis problem and step by  step solved 
we are  goig to follow a pipeline of "INITAL","THINk","ANALYSE" and "output" pipline.

the pipeline
-"INITIAL":when user give an input ,we will ahve an input thought process on what this user is trying to do
-"THINK": this is where we are going to think about how to solved this and then start to brackdown the problem.
-"ANALYSE":this is where we will analying the solution and also verify if the output is correct 
-"THINK":we can go back to think mode where we now see if any sub problem remains and think
-"ANALYSE" again analyse the problem and get onto a solutions
-"OUTPUT":this is where we can end and give the final output to user 

Rules:
 -Always output one step at a time and wait for other step before proceeding
 -Always maintain the sequence of pipelin as given in example
 -Always folloe=w JSON output format strictly"

EXAMPLE:
 - "user": what is 2+2-5*10/3 ?
 OUTPUT:
   -"INITAL": "the user wants to solved a math equation"
   -"THINK":"I will used th BODMAS formula on that i should first multiple 5*10 which is 50
   -"ANALYSE":"The BOBMAS is actually right and now equations is 2+2-50/3"
   -"THINK":"Now as per role i sholud perform divided which is dividing 50/3is 16.66667
   -"ANALYSE":"Now the new equationsremains 2+2-16.66667"
   -THINK":"Now its simple we can just do 2+2=4 and new equation remain 4-16.666667'
   -"ANALYSE":"Great, now lets just do the final step as simple subtractions"
   -"THINK":"After fianl substacinos the remations -12.444447
   -"OUTPUT":"the final is -12.444447
   
 OUTPUT format:
  {
 "step":"THINK"|"ANALYSE"| "OUTPUT", "text": "<The Actual Text>"
  }
`;

const MESSAGE_DB = [{ role: "system", content: SYSTEM_PROMPT }];

async function generateWithRetry() {
  let retries = 5;
  while (retries > 0) {
    try {
      return await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: MESSAGE_DB,
        response_format: { type: "json_object" }
      });
    } catch (error) {
      if (error.message.includes("429") || error.status === 429 || JSON.stringify(error).includes("429")) {
        console.warn("⚠️ Rate limit (429) hit. Retrying in 10 seconds...");
        await new Promise(resolve => setTimeout(resolve, 10000));
        retries--;
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded for Groq API call.");
}

async function main(prompt = '') {
  MESSAGE_DB.push({ role: "user", content: prompt });
  while (true) {
    try {
      const response = await generateWithRetry();

      const rawResult = response.choices[0].message.content;
      const parsedResult = JSON.parse(rawResult);

      MESSAGE_DB.push({ role: "assistant", content: rawResult });
      console.log(`🤖 (${parsedResult.step}: ${parsedResult.text})`);

      if (parsedResult.step.toLowerCase() === "output") {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error running loop:", error.message);
      break;
    }
  }
}

main("what is 2+2-5*10/3 ?");
