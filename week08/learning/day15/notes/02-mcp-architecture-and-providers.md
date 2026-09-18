

# 🏗️ Chapter 2: MCP Architecture & Providers

---

## 🎯 Learning Objectives

By the end of this chapter, you will understand:

* The 3-tier architecture of MCP: **Host Application → MCP Client → MCP Server**
* The role of an **MCP Server / MCP Provider**
* The 3 core MCP primitives: **Tools, Resources, and Prompts**
* The **JSON-RPC 2.0** message model used by MCP
* The complete lifecycle of an MCP tool invocation
* How MCP servers connect AI applications to external systems

---

# 1. 📐 The 3-Tier MCP Architecture

MCP follows a **host-client-server architecture**. MCP messages use the **JSON-RPC 2.0** protocol and are exchanged over an MCP transport.

```text
┌────────────────────────────────────────────────────────────┐
│                    HOST APPLICATION                        │
│                                                            │
│   Examples: Claude Desktop, IDE, Custom AI Application     │
│                                                            │
│   ┌────────────────────────────────────────────────────┐   │
│   │                    MCP CLIENT                      │   │
│   │                                                    │   │
│   │  Connects to and communicates with MCP Servers     │   │
│   └──────────────────────────┬─────────────────────────┘   │
└──────────────────────────────┼─────────────────────────────┘
                               │
                               │ JSON-RPC 2.0
                               │ over MCP Transport
                               ▼
┌────────────────────────────────────────────────────────────┐
│                    MCP SERVER                              │
│                  (MCP Provider)                             │
│                                                            │
│   ├── Tools       → executable capabilities                │
│   ├── Resources   → readable data/context                  │
│   └── Prompts     → reusable prompt templates              │
│                                                            │
└──────────────────────────────┬─────────────────────────────┘
                               │
                               ▼
                 ┌─────────────────────────┐
                 │ External Systems        │
                 │                         │
                 │ Stripe / GitHub / DB    │
                 │ APIs / Files / Services │
                 └─────────────────────────┘
```

### Components Breakdown

### 1. Host Application

The **Host** is the AI application that the user interacts with.

Examples:

* Claude Desktop
* An IDE with MCP support
* A custom Node.js AI application
* An AI agent runtime

The Host is responsible for managing the overall AI experience and MCP connections.

---

### 2. MCP Client

An **MCP Client** is the component inside the Host that communicates with an MCP Server.

It handles things such as:

* Establishing the MCP connection
* Performing protocol communication
* Discovering server capabilities
* Sending tool calls
* Receiving tool results
* Handling MCP protocol messages

A Host can have multiple MCP Client connections.

```text
AI Host
   │
   ├── MCP Client ─── GitHub MCP Server
   │
   ├── MCP Client ─── Database MCP Server
   │
   └── MCP Client ─── Stripe MCP Server
```

Conceptually:

```text
1 Host
  ↓
Multiple MCP Clients
  ↓
Multiple MCP Servers
```

---

### 3. MCP Server / Provider

An **MCP Server** is a program that implements the MCP protocol and exposes capabilities to an MCP Client.

Those capabilities can include:

* Tools
* Resources
* Prompts

The server may internally communicate with external systems.

For example:

```text
MCP Server
    │
    └── create_payment()
            │
            ▼
       Stripe API
```

The MCP Server itself is **not necessarily Stripe, GitHub, or PostgreSQL**.

Instead:

> The MCP Server is the program that exposes MCP capabilities and may use Stripe, GitHub, PostgreSQL, or other systems internally.

---

# 2. 🧩 The 3 Core MCP Primitives

An MCP Server can expose three important types of capabilities:

```text
                         MCP SERVER
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
         TOOLS           RESOURCES         PROMPTS
            │                │                │
         Actions            Data          Templates
```

They serve different purposes.

---

## 2.1 🔧 Tools — Actions

**Tools** are executable operations exposed by an MCP Server.

They can:

* Query data
* Modify data
* Call APIs
* Create records
* Send messages
* Trigger external actions

Example:

```text
create_payment({
  amount: 2000,
  currency: "usd"
})
```

The AI application can discover the tool and provide its schema to the model.

The model can then decide that a tool should be used based on the user's request.

Example:

```text
User:
"Pay $20 for the order."

        ↓

LLM decides a payment tool is needed

        ↓

tools/call

        ↓

create_payment({
  amount: 2000,
  currency: "usd"
})
```

### Important

Tools can have **side effects**.

For example:

```text
create_payment()
delete_file()
send_email()
create_github_issue()
```

Therefore, an AI application should apply appropriate authorization and user-confirmation policies.

---

# 2.2 📚 Resources — Data / Context

**Resources** represent data that an MCP Server can expose to the AI application.

Examples:

```text
file:///project/README.md

postgres://database/schema

github://repository/issues

docs://api/reference
```

Resources can represent:

* Files
* Documentation
* Database schemas
* Application data
* Logs
* Other readable information

Unlike Tools, Resources are primarily about **providing data/context**, rather than performing an action.

Example:

```text
Resource:

file:///project/package.json

        ↓

MCP Server

        ↓

Package.json contents
```

### Key idea

```text
Tool      → "Do something"
Resource  → "Give me information"
```

---

# 2.3 📝 Prompts — Reusable Templates

**Prompts** are reusable prompt templates exposed by an MCP Server.

They can help an application provide standardized workflows to users.

Example:

```text
analyze_code_security
```

with arguments:

```json
{
  "file_path": "src/auth.js"
}
```

The server can provide a structured prompt template for analyzing the specified file.

Conceptually:

```text
Prompt Template
      │
      ▼
"Analyze this code for security vulnerabilities..."
      │
      ▼
Host / User
      │
      ▼
LLM
```

### Easy memory trick

```text
Tools      → Actions
Resources  → Data
Prompts    → Templates
```

---

# 3. 📜 MCP Protocol — JSON-RPC 2.0

MCP uses **JSON-RPC 2.0** as its message format.

JSON-RPC provides a standardized structure for sending:

* Requests
* Responses
* Errors
* Notifications

A simplified request looks like:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

Here:

```text
jsonrpc → protocol version
id      → identifies the request
method  → operation being requested
params  → parameters for that operation
```

---

# 4. 🔍 Tool Discovery

Before an AI application can use a tool, it needs to discover what the MCP Server provides.

The client can request the server's available tools.

### Request

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

### Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "create_payment",
        "description": "Creates a payment",
        "inputSchema": {
          "type": "object",
          "properties": {
            "amount": {
              "type": "number"
            },
            "currency": {
              "type": "string"
            }
          },
          "required": [
            "amount",
            "currency"
          ]
        }
      }
    ]
  }
}
```

The client now knows:

```text
Tool name:
create_payment

Input:
amount
currency

Description:
Creates a payment
```

The AI application can use this information when deciding which capability is relevant.

---

# 5. 🔄 Tool Invocation Lifecycle

Let's follow a complete example.

### User request

```text
"Pay $20 for my order."
```

The high-level flow is:

```text
User
 │
 │ "Pay $20"
 ▼
AI Host / Application
 │
 │ Available tools
 ▼
LLM
 │
 │ Decides to use create_payment
 ▼
MCP Client
 │
 │ tools/call
 ▼
MCP Server
 │
 │ create_payment()
 ▼
Stripe API
 │
 │ Payment result
 ▼
MCP Server
 │
 │ Tool result
 ▼
MCP Client
 │
 ▼
LLM
 │
 │ Generates final response
 ▼
AI Host
 │
 ▼
User
```

### Step-by-step

**1. User sends a request**

```text
"Pay $20 for my order."
```

**2. AI application provides relevant tool information to the model**

For example:

```text
create_payment
refund_payment
get_payment_status
```

**3. The model decides to use a tool**

Conceptually:

```text
create_payment({
  amount: 2000,
  currency: "usd"
})
```

**4. MCP Client sends the tool call**

The client sends a JSON-RPC request to the MCP Server.

Conceptually:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "create_payment",
    "arguments": {
      "amount": 2000,
      "currency": "usd"
    }
  }
}
```

**5. MCP Server executes the operation**

```text
MCP Server
     │
     ▼
Stripe API
     │
     ▼
Payment processed
```

**6. MCP Server returns the tool result**

```text
Payment successful
Transaction ID: txn_123
```

**7. AI application gives the result back to the model**

The model can now generate a natural-language response.

```text
"Your payment of $20 was completed successfully."
```

---

# 6. 🧠 Who Actually Decides to Call a Tool?

This distinction is extremely important.

A simplified architecture is:

```text
                 ┌─────────────┐
User ───────────►│     LLM     │
                 └──────┬──────┘
                        │
                 decides tool
                        │
                        ▼
                 ┌─────────────┐
                 │ MCP Client  │
                 └──────┬──────┘
                        │
                   tools/call
                        │
                        ▼
                 ┌─────────────┐
                 │ MCP Server  │
                 └──────┬──────┘
                        │
                        ▼
                   External API
```

The **LLM chooses whether a tool should be used** as part of the AI application's agent loop.

The **MCP Client performs the protocol communication**.

The **MCP Server executes the requested capability**.

So remember:

```text
LLM
 ↓
Decision

MCP Client
 ↓
Communication

MCP Server
 ↓
Execution
```

---

# 7. 🔌 Transport Layer

JSON-RPC messages need a way to travel between the Client and Server.

MCP supports different transports.

Common examples include:

### Local MCP Server

```text
AI Host
   │
   │ STDIO
   ▼
MCP Server Process
```

STDIO is particularly useful when the MCP Server runs locally as a child process.

Example:

```text
Node.js AI Application
        │
        │ stdin/stdout
        ▼
github-mcp-server
```

---

### Remote MCP Server

```text
AI Host
   │
   │ HTTP
   ▼
Remote MCP Server
```

Modern MCP remote deployments use **Streamable HTTP**.

Earlier MCP implementations commonly used **HTTP + SSE**, so you may still encounter SSE in older tutorials and code.

---

# 8. 🏢 Multiple MCP Providers

A Host can connect to multiple MCP Servers.

For example:

```text
                         AI HOST
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
        MCP Client     MCP Client     MCP Client
             │              │              │
             ▼              ▼              ▼
       GitHub Server   Database Server   Payment Server
             │              │              │
             ▼              ▼              ▼
          GitHub         PostgreSQL        Stripe
```

This allows one AI application to combine capabilities from many different systems.

For example, an agent could:

```text
1. Search GitHub repository
2. Read database schema
3. Query customer data
4. Create a payment
5. Send an email
```

without each integration needing to invent its own MCP communication protocol.

---

# 9. ⚠️ Tool Overload Problem

As the number of MCP servers grows, the AI application may gain access to hundreds of tools.

For example:

```text
GitHub       → 30 tools
Slack        → 40 tools
Database     → 50 tools
Stripe       → 20 tools
CRM          → 80 tools
Cloud        → 100 tools

Total        → 320 tools
```

Giving all of these tools to the model at once can create problems:

### 1. Context growth

Tool descriptions and schemas consume context.

```text
More tools
   ↓
More tool definitions
   ↓
Larger context
```

### 2. Higher token usage

More context can increase token consumption.

### 3. Higher latency

Larger prompts and more complex tool selection can increase processing time.

### 4. Tool selection ambiguity

If many tools have similar names or purposes, the model may have difficulty selecting the intended capability.

Example:

```text
get_customer()
get_customer_data()
fetch_customer()
lookup_customer()
find_customer()
```

---

# 10. 🚪 MCP Gateway

A gateway can be introduced between the AI application and multiple MCP Servers.

```text
                  AI APPLICATION
                         │
                         ▼
                  ┌──────────────┐
                  │ MCP GATEWAY  │
                  └──────┬───────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      GitHub MCP     Database MCP    Stripe MCP
        Server          Server          Server
```

Depending on the implementation, a gateway can provide:

* Tool filtering
* Routing
* Authentication
* Authorization
* Rate limiting
* Logging
* Observability
* Policy enforcement
* Tool discovery/aggregation

Instead of exposing every available tool to the model, the gateway can help control which capabilities are available.

---

# 11. 🔐 Important Architectural Principle: Decoupling

One of MCP's important benefits is **decoupling**.

An MCP Server does not need to know which particular LLM is ultimately producing the user's response.

For example:

```text
                 ┌── OpenAI model
                 │
AI Application ──┼── Claude model
                 │
                 ├── Gemini model
                 │
                 └── Local model
                        │
                        ▼
                   MCP Client
                        │
                        ▼
                   MCP Server
                        │
                        ▼
                   External API
```

The MCP Server focuses on exposing its capabilities through MCP.

The AI application's model layer can change independently from the MCP server.

---

# 12. 🧠 Important Clarification: "Stateless"

It is better **not** to describe MCP as simply a "stateless protocol."

MCP uses persistent client-server sessions and includes lifecycle/session concepts.

Therefore, remember:

> MCP communication uses JSON-RPC messages, but MCP itself should not be reduced to a collection of independent stateless request/response messages.

The server may also maintain state depending on the implementation and connection lifecycle.

---

# 13. 🔄 Complete Mental Model

Put everything together:

```text
┌──────────────────────┐
│        USER          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    HOST APPLICATION  │
│                      │
│  AI Agent / LLM      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      MCP CLIENT      │
└──────────┬───────────┘
           │
           │ JSON-RPC
           │ over Transport
           ▼
┌──────────────────────┐
│      MCP SERVER      │
│     / PROVIDER       │
│                      │
│ Tools                │
│ Resources            │
│ Prompts              │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   EXTERNAL SYSTEM    │
│                      │
│ GitHub / Stripe / DB │
│ APIs / Files / SaaS  │
└──────────────────────┘
```

### The simplest mental model

```text
Host
 ↓
Client
 ↓
MCP
 ↓
Server
 ↓
Capability
 ↓
External System
```

And:

```text
Tool      = Action
Resource  = Data
Prompt    = Template
```

---

# 📌 Key Architectural Rules

### 1. Decoupling

MCP Servers expose capabilities without being tightly coupled to a specific LLM provider.

### 2. Separation of Responsibilities

```text
Host
→ manages the AI application

Client
→ communicates with MCP Server

Server
→ exposes and executes capabilities
```

### 3. Standardized Communication

MCP uses a standardized protocol and message model so different AI applications and MCP servers can communicate using the same MCP specification.

### 4. Multiple Servers

A Host can connect to multiple MCP Servers simultaneously.

```text
Host
 ├── GitHub MCP
 ├── Slack MCP
 ├── Database MCP
 └── Stripe MCP
```

### 5. MCP Does Not Replace Existing APIs

An MCP Server can act as an adapter around existing technologies.

```text
AI Application
      │
      ▼
  MCP Client
      │
      ▼
  MCP Server
      │
      ├── REST API
      ├── GraphQL
      ├── SDK
      ├── Database
      └── Internal Service
```

MCP standardizes the AI-facing interaction; the server can use whatever backend technology is appropriate.

---

# 🎯 Interview Questions

### Q1. What is MCP architecture?

MCP uses a **Host → Client → Server** architecture where the Host application uses MCP Clients to communicate with MCP Servers that expose tools, resources, and prompts.

### Q2. What is an MCP Host?

The application that manages the overall AI interaction and MCP connections.

### Q3. What is an MCP Client?

A component inside the Host that establishes and manages communication with an MCP Server.

### Q4. What is an MCP Server?

A program that implements MCP and exposes capabilities such as Tools, Resources, and Prompts.

### Q5. What are the three MCP primitives?

```text
Tools
Resources
Prompts
```

### Q6. What is a Tool?

An executable capability that an AI application can invoke through an MCP Server.

### Q7. What is a Resource?

A data/context item exposed by an MCP Server, typically identified by a URI.

### Q8. What is a Prompt?

A reusable prompt template exposed by an MCP Server.

### Q9. What does JSON-RPC do in MCP?

It provides the structured message format used for MCP communication.

### Q10. What is `tools/list`?

A protocol operation used to discover the tools exposed by an MCP Server.

### Q11. What is `tools/call`?

A protocol operation used to invoke a specific tool exposed by an MCP Server.

### Q12. Who decides which tool to use?

Typically, the LLM makes the tool-selection decision as part of the AI application's agent loop. The Host/Application then orchestrates the invocation through the MCP Client.

### Q13. Does the MCP Server directly talk to the LLM?

Not necessarily.

The typical relationship is:

```text
LLM
 ↓
AI Host
 ↓
MCP Client
 ↓
MCP Server
```

### Q14. Does MCP replace REST?

No.

MCP and REST operate at different layers and can work together.

```text
AI Application
      ↓
     MCP
      ↓
MCP Server
      ↓
REST API
      ↓
External Service
```

### Q15. Why can many MCP tools become a problem?

Because large numbers of tool definitions can increase context size, token usage, latency, and tool-selection complexity.

### Q16. What is an MCP Gateway?

A middleware layer that can aggregate, route, filter, secure, and observe interactions with multiple MCP servers, depending on its implementation.

---

# 🧠 One-Line Memory Trick

> **Host manages → Client communicates → Server exposes → Tool acts → Resource provides data → Prompt guides.**

### Complete architecture:

```text
User
 ↓
Host / AI Application
 ↓
MCP Client
 ↓
JSON-RPC + Transport
 ↓
MCP Server
 ↓
Tools / Resources / Prompts
 ↓
External Systems
```

### Chapter 2 in one sentence

> **MCP architecture separates the AI application, protocol communication, and external capabilities through a Host → Client → Server model, with Tools, Resources, and Prompts exposed by MCP Servers.**


