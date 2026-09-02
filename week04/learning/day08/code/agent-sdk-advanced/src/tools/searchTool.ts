import { ITool } from "../types.js";

const KNOWLEDGE_BASE: Record<string, string> = {
  "agent sdk": "Agent SDK is a TypeScript framework for building modular, multi-agent systems with ReAct pipelines, guardrails, and handoffs.",
  "guardrails": "Guardrails validate and transform inputs and outputs per agent to enforce security, safety, and domain rules.",
  "handoff": "Agent handoff transfers conversation context and control from one specialized agent to another.",
};

export const searchTool: ITool = {
  name: "searchKnowledgeBase",
  description: "Searches internal knowledge base for technical facts, concepts, and guides.",
  doc: "searchKnowledgeBase(query: string): SearchResult",
  executor(query: string): string {
    const key = query.toLowerCase().trim();
    for (const [k, v] of Object.entries(KNOWLEDGE_BASE)) {
      if (key.includes(k) || k.includes(key)) {
        return JSON.stringify({ status: "found", query, result: v });
      }
    }
    return JSON.stringify({ status: "not_found", query, message: "No match found in knowledge base." });
  },
};
