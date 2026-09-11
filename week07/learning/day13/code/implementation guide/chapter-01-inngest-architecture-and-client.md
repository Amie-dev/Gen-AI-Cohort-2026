# ⚡ Chapter 01 — Inngest Engine Architecture & SDK Setup

## 1. Event Bus Architecture

Inngest decouples event emission from background execution using an HTTP-based webhook architecture.

```text
[Client Application] ──► emit event ──► [Inngest Engine]
                                               │
                                               ▼ HTTP POST /api/inngest
                                       [Express App Endpoint]
```

---

## 2. Inngest Client Initialization

```javascript
const { Inngest } = require('inngest');

const inngest = new Inngest({
  id: 'ai-multiagent-platform',
  eventKey: process.env.INNGEST_EVENT_KEY,
});
```

### Key Principles:
- Single client object serves as the application's unique event identity.
- Environment variables control event routing and cryptographic webhook signatures.
