# 📚 Day 15 — Introduction to MCP

## 🎯 Goal

Understand **Model Context Protocol (MCP)** from first principles: why it was created, what problem it solves, how MCP servers/providers expose tools, how agents communicate with them, transports such as **STDIO and HTTP/SSE**, and how **MCP Gateways** help solve tool/context explosion.

---

# 1. 🤖 The AI Trend in 2024 — Agentic AI

One of the major hype terms in 2024 was:

* **Agentic AI**
* **AI Agents**

The basic idea was to move from:

> **User → AI → Answer**

to:

> **User → AI Agent → Reason → Select Tool → Execute Tool → Observe Result → Continue → Answer**

For example, imagine an AI agent that can help a user purchase something.

The agent might need tools such as:

```text
searchProduct()
getProductDetails()
createPayment()
checkPaymentStatus()
sendEmail()
```

The LLM decides **which tool to call and with what arguments**.

---

# 2. 🧠 The Problem With AI Agent Tools

Suppose you are building an AI agent.

Your system prompt might contain:

```text
You are a helpful shopping assistant.

Available tools:
- searchProduct
- getProduct
- createPayment
- checkPayment
```

The tools themselves are implemented by your application.

For example:

```text
createPayment()
        ↓
Stripe API
        ↓
Payment created
```

The problem starts when you want your agent to work with **different LLM providers**.

For example:

```text
OpenAI
Claude
Gemini
Other LLMs
```

Historically, different model platforms could have different interfaces/formats for describing and invoking tools.

Conceptually:

```text
Your Tool
    │
    ├── OpenAI adapter
    ├── Claude adapter
    ├── Gemini adapter
    └── Other provider adapter
```

This creates unnecessary integration work.

---

# 3. 🔥 The Core Problem

Imagine you have **100 tools**.

You don't want to build:

```text
100 tools × every AI provider
```

Instead, you want a standardized protocol:

```text
                 Standard Tool Interface
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
       OpenAI          Claude         Gemini
```

The central question becomes:

> **Can we standardize how AI applications discover and communicate with external tools and data sources?**

This is where **MCP — Model Context Protocol** comes in.

---

# 4. 🌐 What Is MCP?

**MCP (Model Context Protocol)** is an open protocol designed to standardize how AI applications connect to external **tools, resources, and prompts**.

Think of MCP as a common communication contract between:

```text
AI Application
      ↓
    MCP
      ↓
MCP Server
      ↓
External systems
```

The important idea is:

> **MCP standardizes the interaction between AI applications and external capabilities.**

It is not an LLM.

It is not an AI agent.

It is not a database.

It is a **protocol**.

---

# 5. 🏗️ MCP Architecture

A simplified architecture looks like this:

```text
┌─────────────────────────────┐
│       AI Application        │
│                             │
│   Agent / LLM / Assistant   │
└──────────────┬──────────────┘
               │
               │ MCP
               │
               ▼
┌─────────────────────────────┐
│         MCP Server          │
│                             │
│  Tools                      │
│  Resources                  │
│  Prompts                    │
└──────────────┬──────────────┘
               │
       ┌───────┼─────────┐
       ↓       ↓         ↓
    Stripe   Database    API
```

---

# 6. 🖥️ MCP Server

An **MCP server** is a program/process that exposes capabilities through MCP.

For example:

```text
Stripe MCP Server
```

could expose:

```text
create_payment
get_payment
refund_payment
list_customers
```

Another MCP server could expose GitHub operations:

```text
create_issue
get_issue
list_repositories
create_pull_request
```

Another could expose database functionality:

```text
query_database
get_schema
```

So:

```text
MCP Server
    │
    ├── Tool 1
    ├── Tool 2
    ├── Tool 3
    └── Tool 4
```

---

# 7. 🔧 MCP Tools

A tool represents an action that an AI application can request from the MCP server.

For example:

```text
create_payment
```

might have an input schema:

```json
{
  "amount": 1000,
  "currency": "usd"
}
```

The MCP server receives the request:

```text
create_payment
        ↓
Stripe API
        ↓
Payment Result
```

The AI application receives the result.

---

# 8. 🔄 Tool Flow

The complete flow can look like:

```text
User
 │
 │ "Pay $20 for this product"
 ▼
AI Agent
 │
 │ decides
 ▼
create_payment
 │
 │ MCP
 ▼
MCP Server
 │
 ▼
Stripe
 │
 ▼
Payment Result
 │
 ▼
MCP Server
 │
 ▼
AI Agent
 │
 ▼
User
```

The LLM doesn't need to know the internal implementation of Stripe.

It only needs to understand the tool's interface.

---

# 9. 🧩 MCP Standardizes Tool Communication

Without a standard:

```text
Agent
 │
 ├── Provider-specific tool format A
 ├── Provider-specific tool format B
 ├── Provider-specific tool format C
 └── Custom integration
```

With MCP:

```text
             MCP
              │
      Standard interface
              │
       ┌──────┼──────┐
       ↓      ↓      ↓
    Tools  Resources Prompts
```

This is similar to how standardized web protocols made it possible for different programming languages and systems to communicate.

---

# 10. 🌍 Analogy — REST API

This is a useful way to understand MCP.

We have many programming languages:

```text
JavaScript
Python
Java
Go
Rust
C#
```

But they can communicate with web services using common HTTP conventions.

For example:

```http
GET /users
POST /users
PUT /users/123
PATCH /users/123
DELETE /users/123
```

The backend implementation can be written in:

```text
Node.js
Python
Java
Go
Rust
```

The client doesn't need to know the implementation language.

It understands the **protocol/interface**.

---

# 11. 🌐 REST + HTTP

A simplified mental model:

```text
Client
   │
   │ HTTP
   ▼
REST API
   │
   ▼
Server
```

HTTP commonly uses:

```text
GET
POST
PUT
PATCH
DELETE
```

with:

```text
Headers
Body
Status
Response
```

For example:

```http
POST /payments
Content-Type: application/json
```

```json
{
  "amount": 2000,
  "currency": "usd"
}
```

The protocol provides a standardized way for systems to communicate.

---

# 12. 🚚 Transport Layer

A **transport** determines how communication is carried between two processes/systems.

A useful networking mental model is:

```text
Application protocol
        ↓
Transport
        ↓
Network
```

For example:

```text
HTTP
 ↓
TCP
 ↓
IP
```

HTTP commonly runs over TCP, although modern HTTP/3 uses QUIC instead.

The important distinction for MCP is:

> **MCP defines the protocol semantics; a transport carries MCP messages between participants.**

---

# 13. 🚚 MCP Transports

For MCP, two important transport approaches you should understand are:

### Local process communication

```text
STDIO
```

### Network communication

Historically MCP used:

```text
HTTP + SSE
```

and the modern MCP specification uses **Streamable HTTP** for remote servers.

So don't memorize only:

```text
HTTP Streaming = SSE
```

Instead understand the evolution:

```text
Local MCP
   ↓
STDIO

Remote MCP
   ↓
HTTP-based transport
   ↓
Streamable HTTP
```

SSE was an important earlier remote transport mechanism in MCP.

---

# 14. 🖥️ STDIO Transport

STDIO means:

```text
Standard Input
Standard Output
```

The MCP client launches an MCP server as a local process.

Architecture:

```text
┌─────────────────┐
│   AI Client     │
│                 │
│  MCP Client     │
└────────┬────────┘
         │
         │ stdin/stdout
         │
         ▼
┌─────────────────┐
│   MCP Server    │
│                 │
│    Tools        │
└─────────────────┘
```

For example:

```text
node server.js
```

The MCP client starts the process and communicates through:

```text
stdin
stdout
```

This is especially useful for **local MCP servers**.

---

# 15. 🧪 STDIO Example

Imagine:

```text
my-mcp-server/
│
├── package.json
├── server.js
└── tools/
    └── payment.js
```

The client starts:

```bash
node server.js
```

Communication happens through the process streams rather than a normal HTTP port.

Conceptually:

```text
Client
  │
  │ JSON-RPC messages
  │
  ├──── stdin ────→ Server
  │
  └──── stdout ←── Server
```

MCP uses **JSON-RPC** as the message format underneath the protocol.

---

# 16. 🌐 Remote MCP

For a remote server:

```text
AI Application
      │
      │ Internet
      │
      ▼
┌──────────────┐
│ MCP Server   │
│              │
│ HTTPS        │
└──────┬───────┘
       │
       ▼
External API
```

For example:

```text
AI Agent
   │
   │ HTTPS
   ▼
Stripe MCP Server
   │
   ▼
Stripe API
```

This allows the MCP server to run independently from the AI application.

---

# 17. 🛠️ Building an MCP Tool

Suppose you build:

```text
get_weather
```

The MCP server exposes the tool.

The tool might define:

```text
Name:
get_weather
```

Input:

```json
{
  "city": "Kolkata"
}
```

Output:

```json
{
  "temperature": 31,
  "condition": "Cloudy"
}
```

The internal implementation could be:

```text
get_weather
      ↓
Weather API
      ↓
Process response
      ↓
Return structured result
```

The AI doesn't need to know how the weather API works internally.

---

# 18. 🧰 Multiple Tools

An MCP server can expose many tools.

For example:

```text
Developer MCP Server

├── search_code
├── read_file
├── write_file
├── run_tests
├── create_issue
└── create_pull_request
```

Another:

```text
Database MCP Server

├── get_schema
├── query_database
├── explain_query
└── list_tables
```

Another:

```text
Payment MCP Server

├── create_payment
├── get_payment
├── refund_payment
└── list_transactions
```

This creates a reusable ecosystem of capabilities.

---

# 19. 🤖 One Agent + Multiple MCP Servers

An AI application can connect to multiple MCP servers.

```text
                    AI Agent
                       │
          ┌────────────┼─────────────┐
          │            │             │
          ▼            ▼             ▼
     MCP Server    MCP Server    MCP Server
       GitHub        Stripe        Database
          │            │             │
          ▼            ▼             ▼
       GitHub        Stripe        PostgreSQL
```

The agent can discover the available tools and invoke them when needed.

---

# 20. 🔥 The Big Advantage

Instead of rebuilding integrations for every agent:

```text
Agent A → Custom Stripe integration
Agent B → Custom Stripe integration
Agent C → Custom Stripe integration
```

you can have:

```text
                 Stripe MCP Server
                       │
             ┌─────────┼─────────┐
             ↓         ↓         ↓
          Agent A    Agent B   Agent C
```

The MCP server becomes a standardized capability provider.

---

# 21. ⚠️ New Problem — Too Many Tools

MCP solves tool interoperability, but it introduces another problem.

Imagine your agent has access to:

```text
500 tools
```

Now you potentially have a huge amount of tool definitions entering the model's context.

```text
System Prompt
     +
Instructions
     +
Conversation
     +
Tool Definitions
     +
Tool Results
     ↓
Huge Context
```

This can create:

* Context bloat
* Higher token usage
* Higher latency
* Tool-selection difficulty
* Increased chances of choosing the wrong tool
* More complicated agent orchestration

---

# 22. ☠️ Tool Context Poisoning

A related concern is **tool/context overload or poisoning**.

Imagine:

```text
Tool 1: search_customer
Tool 2: search_customers
Tool 3: find_customer
Tool 4: lookup_customer
Tool 5: retrieve_customer
...
```

The model may have difficulty distinguishing tools.

The problem becomes worse when many tools have:

* Similar names
* Similar descriptions
* Large schemas
* Conflicting instructions
* Unnecessary capabilities

Therefore:

> **Giving an agent access to every available tool is not necessarily a good architecture.**

---

# 23. 🚪 MCP Gateway

One architectural solution is an **MCP Gateway**.

Instead of:

```text
Agent
 │
 ├── MCP Server 1
 ├── MCP Server 2
 ├── MCP Server 3
 ├── MCP Server 4
 ├── MCP Server 5
 └── MCP Server 6
```

you can introduce:

```text
                 AI Agent
                     │
                     ▼
                MCP Gateway
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
   MCP Server     MCP Server    MCP Server
    GitHub          Stripe        Database
```

The gateway can act as an intelligent boundary.

---

# 24. 🧠 What Can an MCP Gateway Do?

Depending on the architecture, a gateway can help with:

### Tool discovery

```text
Find only relevant tools
```

### Tool filtering

```text
Agent asks about payment
        ↓
Expose payment tools
```

instead of:

```text
Expose 500 unrelated tools
```

### Authentication

```text
Agent
 ↓
Gateway
 ↓
Authenticate
 ↓
MCP Server
```

### Authorization

Control which users/agents can access which tools.

### Routing

```text
payment tool
      ↓
Stripe MCP Server

github tool
      ↓
GitHub MCP Server
```

### Observability

Track:

```text
Who called the tool?
Which tool?
When?
How long?
Success/failure?
```

---

# 25. 🏗️ Complete Architecture

A production-style architecture could look like:

```text
                         USER
                           │
                           ▼
                     AI APPLICATION
                           │
                           ▼
                       AI AGENT
                           │
                           │ MCP
                           ▼
                    ┌──────────────┐
                    │ MCP GATEWAY  │
                    └───────┬──────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
        MCP Server      MCP Server     MCP Server
          GitHub          Stripe          DB
             │              │              │
             ▼              ▼              ▼
          GitHub          Stripe       PostgreSQL
```

This separates:

```text
AI reasoning
     ↓
Tool access
     ↓
Business systems
```

---

# 26. 🧩 MCP Mental Model

Remember MCP with this simple model:

```text
MCP
│
├── Protocol
│
├── Client
│     └── Lives inside/alongside AI application
│
├── Server
│     └── Exposes capabilities
│
├── Tools
│     └── Actions
│
├── Resources
│     └── Data/context
│
├── Prompts
│     └── Reusable prompt templates
│
└── Transport
      ├── STDIO
      └── HTTP-based transport
```

---

# 27. 🔄 MCP vs REST API

They are **not replacements for each other**.

Think:

```text
REST API
   ↓
General software-to-software API communication
```

while:

```text
MCP
   ↓
Standardized AI application ↔ capability/server interaction
```

You can even build an MCP server that internally calls REST APIs:

```text
AI Agent
    │
    │ MCP
    ▼
MCP Server
    │
    │ REST/HTTP
    ▼
Stripe API
```

So MCP can sit **above existing APIs**.

---

# 28. 🧠 Important Distinction

Don't think:

> "MCP is an API."

Better:

> **MCP is a protocol that standardizes how AI applications discover and interact with capabilities exposed by MCP servers.**

An MCP server may internally use:

```text
REST
GraphQL
gRPC
SQL
SDKs
Filesystem
Other services
```

The implementation is up to the server.

---

# 29. 📌 Day 15 Key Takeaways

### Before MCP

```text
AI Agent
   │
   ├── Provider-specific tool integration
   ├── Custom APIs
   ├── Custom schemas
   └── Custom adapters
```

### With MCP

```text
AI Agent
   │
   │ MCP
   ▼
MCP Server
   │
   ├── Tool
   ├── Tool
   ├── Resource
   └── Prompt
```

### With multiple MCP servers

```text
AI Agent
    │
    ▼
MCP Gateway
    │
    ├── GitHub
    ├── Stripe
    ├── Database
    ├── Search
    └── Internal APIs
```

---

# 🎯 Interview Questions

### 1. What is MCP?

**Model Context Protocol is an open protocol for standardizing how AI applications interact with external tools, resources, and prompts.**

### 2. Why was MCP needed?

To reduce fragmented, provider/application-specific integrations and provide a standardized interface for AI applications to interact with external capabilities.

### 3. What is an MCP server?

A process/service that exposes tools, resources, and prompts through MCP.

### 4. What is an MCP tool?

A callable capability exposed by an MCP server that an AI application can invoke with structured arguments.

### 5. What is STDIO?

A transport mechanism where an MCP client communicates with a locally running MCP server through standard input/output streams.

### 6. Can MCP replace REST APIs?

**No.** MCP and REST solve different problems. An MCP server can itself consume REST APIs.

### 7. Why can too many MCP tools be problematic?

Because exposing a very large number of tool definitions can increase context size, token usage, latency, and tool-selection complexity.

### 8. What is an MCP Gateway?

A layer that can sit between AI applications and multiple MCP servers to provide capabilities such as routing, filtering/discovery, authentication, authorization, and observability.

---

# 🧠 One-Line Memory Trick

> **REST standardized web APIs; MCP standardizes how AI applications interact with tools and context providers.**

And the architecture to remember:

```text
                 AI AGENT
                     │
                     │ MCP
                     ▼
                MCP SERVER
                     │
              ┌──────┼──────┐
              ▼      ▼      ▼
            TOOL   TOOL   RESOURCE
              │
              ▼
          External API
```

**Day 15 = Why MCP → MCP architecture → Server → Tools → Transport → STDIO → HTTP/SSE evolution → Multiple tools → Tool overload → MCP Gateway.**
