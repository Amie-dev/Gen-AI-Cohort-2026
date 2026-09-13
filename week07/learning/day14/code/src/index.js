import express from "express"
import { serve } from "inngest/express";
import "dotenv/config"
import { inngest } from "./inngest/client.js"
import {functions} from "../src/inngest/functions/index.js"

const app = express();


// Important: ensure you add JSON middleware to process incoming JSON POST payloads.
app.use(express.json());


// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));


// implement with github webHook

// app.post("/webhook/github",(req,res)=>{
//   inngest.send({name:"github/pullrequest.review",data:{
//     owner:req.body.owner,
//     repo:req.body.repo,
//     pull_number:req.body.pull_number
//   }})
// })


app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});