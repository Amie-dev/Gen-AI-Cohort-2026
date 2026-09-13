import { Agent } from "@openai/agents";
import { z } from "zod";

export const githubReviewAgentResultScheam = z.object({
  criticalFixes: z
    .array(z.string())
    .optional()
    .nullable()
    .describe("critical fix if any"),
  suggestions: z
    .array(z.string())
    .optional()
    .nullable()
    .describe("suggesagation fixes if any"),
  content: z.string().describe("Actual content for the reply"),
  events:z.enum("APPROVE","COMMENT","REQUEST_CHANGES")
});

export const githubPullRequestReviewAgent = new Agent({
  name: "Github Pull request Agent",
  outputType: githubReviewAgentResultScheam,
  instructions: `

  You'r an expert AI code reviewer.
  you are give pull request detials with some basic informations about the pull request
  and the change in that pull request
  Give a defuiled review about code and suggest some fixes, if any comment ,etc.
  use emoji in comment to make it natural.
  `,
});
