# Gen AI JS Cohort 2026

Welcome to the **Gen AI JS Cohort 2026**, powered by **Chaicode**!

This repository contains all learning phases, projects, and deployment workflows designed to help you transition from JavaScript fundamentals to modern Generative AI development using JavaScript and TypeScript.

---

# 📖 Curriculum Overview

## Foundation

### Transformers

* What happens when you send a message to an LLM
* How transformers process text internally
* Tokenization and how text becomes numbers
* Attention mechanism and why it matters
* Embeddings and vector space intuition
* Context windows and what happens when you exceed them
* Temperature, top-p, and how randomness is controlled

### API Platforms

* Setting up your Node.js project from scratch
* Exploring OpenAI API Dashboard
* Understanding Claude APIs
* Gemini APIs via Google AI Studio
* Reading and handling the response object
* Streaming responses end-to-end
* Running local LLMs with Ollama
* Generating embeddings on your own machine
* Picking the right model for cost, speed, and quality

### Prompt Engineering

* Zero-shot prompting
* Few-shot prompting with examples
* Role prompting and personas
* Chain-of-Thought prompting
* Self-consistency technique
* ReAct prompting
* Negative prompting and setting constraints
* Getting reliable structured output like JSON
* Prompt chaining across multiple calls
* Common prompt mistakes and how to fix them

### Streaming ChatGPT Clone

* Setting up the full-stack project
* Streaming chat responses in real time
* Markdown and code block rendering
* Persisting responses to a database
* Loading and managing conversation history
* Token counting and handling context limits

---

# AI System Design

## RAG Architecture

* What RAG is and the problem it solves
* Indexing pipeline design
* Query pipeline design
* Fixed-size chunking
* Semantic chunking
* Recursive chunking
* Choosing the right chunking strategy
* Document parsing across PDFs, Markdown, and HTML
* Picking the right embedding model

## Vector Search with Qdrant

* What a vector database is under the hood
* Running Qdrant locally with Docker
* Storing and querying embeddings
* Vector similarity search
* Metadata filtering for scoped results
* Reranking for better retrieval quality

## Production Ingestion

* Why ingestion should never block a web request
* Queue-based ingestion architecture
* Background workers for document processing
* Handling failures and retrying jobs safely
* Tracking ingestion progress

---

# Vectorless Indexing

## Where Vector RAG Fails

* Chunk boundary problems that destroy meaning
* Embedding drift over time
* Opaque similarity scores that mislead retrieval
* Questions that need reasoning across multiple chunks

## Vectorless Retrieval

* PageIndex retrieval without any vector database
* Building an LLM-generated wiki from your documents
* Using the wiki as an agent memory substrate
* Vector vs. vectorless tradeoffs
* Hybrid strategies for real workloads
* Deciding which approach your project actually needs

---

# AI Powered Projects

## NotebookLM Clone

* Uploading and indexing user documents
* Querying across multiple documents at once
* Multi-document reasoning
* Handling large files and edge cases

## AI Pitch Deck

* Prompt to outline generation
* Outline to slides pipeline
* Structured output for consistent slide formatting
* Exporting the final deck as a downloadable file

---

# Agentic Workflows

## Agent Fundamentals

* The difference between a chain and an agent
* The perceive-decide-act loop in code
* Designing tools with strict JSON schemas
* Parallel vs. sequential tool calls
* Guardrails and safe tool execution
* Retries and error recovery
* Preventing infinite loops and runaway agents

## CLI Agent from Scratch

* Building the core agent loop in plain JavaScript
* File read, write, and directory tools
* Shell command execution tool
* Claude-Code-style CLI interface

---

# Agentic SDK

## OpenAI Agents SDK

* Why frameworks exist and what they save you from
* Rebuilding the CLI agent with the SDK
* Defining agents and their instructions
* Multi-agent handoffs and shared state
* Input and output guardrails
* Built-in tracing and session management

## Managed Tools & Voice

* File Search tool
* Web Search tool
* Code Interpreter tool
* How the OpenAI Realtime API works
* Building a real-time voice agent
* Handling audio input and output streams

---

# Claude 101

## Claude's Unique Primitives

* Long context window and what it makes possible
* Sending PDFs directly without any parsing
* Getting inline citations from Claude responses
* What prompt caching is and how it works
* Setting up manual prompt caching in API calls
* Measuring cost savings from caching
* Extended thinking and when to use it
* Structured tool use and output schemas
* Message batches for bulk processing

## Claude Agent SDK

* Setting up the Claude Agent SDK in Node.js
* Defining tools and writing system prompts
* Building a full agent loop end-to-end
* Managing multi-turn conversations
* Picking the right Claude model per task
* Claude vs. OpenAI for agentic workloads

---

# Agentic AI Project

## AutoWiki for Git

* Repository indexing progress
* File tree explorer
* Search files, functions, and classes
* Copy AI-generated docs
* Export wiki as Markdown/PDF

---

# Memory Layer

## Architecture

* Why LLMs are stateless by default
* Short-term memory and the context window
* Long-term memory stored outside the model
* Episodic memory for past interactions
* Semantic memory for facts and user knowledge
* Memory write, update, and forget policies

## Implementations

* Integrating Mem0 into an existing agent
* Writing and retrieving personal memories
* What a knowledge graph is and why it fits memory
* Setting up Neo4j and connecting it to your agent
* Storing memory as nodes and relationships
* Querying connected memories across sessions
* Building a personal AI that remembers you

---

# Adapting AI Ecosystem

## MCP

* What the Model Context Protocol is
* Why MCP became the industry standard
* MCP architecture: clients, servers, and transports
* Building your first MCP server
* Exposing tools through the MCP interface
* Publishing your server for others to install
* Connecting any MCP-aware client on day one

## Skills

* What a Claude Skill is
* Packaging agentic capabilities as a Skill
* Defining input and output schemas
* Distributing your Skill in the AI ecosystem

## Plugins

* How Plugins differ from Skills
* Building and registering a Plugin
* Shipping a public portfolio of everything you built

---

# Bonus

* Bounties
* Live Interactive Quizzes
* Hackathons
* Project Peer Review

---

# 👨‍🏫 Organized By

**Chai Code**

### Mentors

* Hitesh Choudhary
* piyush garg
