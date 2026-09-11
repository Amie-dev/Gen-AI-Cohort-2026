
# 🚀 05 — Advanced Multi-Agent Workflows, Concurrency & Error Resilience

> **Goal:** Master advanced Inngest concepts including parallel multi-agent execution, fan-out/fan-in, concurrency control, throttling, retries, exponential backoff, failure handling, and production reliability patterns.

---

# 1. 🔀 Parallel Multi-Agent Execution

AI workflows often need multiple independent agents to perform different types of research simultaneously.

For example:

* Agent A → Web search
* Agent B → Academic papers
* Agent C → Code repositories

Instead of:

```text
Agent A → Agent B → Agent C
```

we can execute them concurrently:

```text
                         Trigger
                            │
                            ▼
                     Input Analysis
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
        Agent A          Agent B        Agent C
       Web Search       ArXiv/Papers    Code Search
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                     Fan-In / Combine
                            │
                            ▼
                     Synthesis LLM
                            │
                            ▼
                      Final Report
```

This pattern is called:

> **Fan-Out → Parallel Processing → Fan-In**

---

# 2. ⚡ Implementing Parallel Steps

In JavaScript, `Promise.all()` can be used to start independent step calls concurrently.

```javascript
import { inngest } from "./client.js";

export const parallelMultiAgentResearch = inngest.createFunction(
  {
    id: "parallel-multi-agent-research",
  },
  {
    event: "ai/parallel-research.requested",
  },
  async ({ event, step }) => {

    // Step 1: Input preprocessing
    const query = await step.run(
      "preprocess-query",
      async () => {
        return event.data.query.trim().toLowerCase();
      }
    );

    // Step 2: Parallel research
    const [
      webResults,
      academicResults,
      codeResults,
    ] = await Promise.all([
      step.run("agent-web-search", async () => {
        return await runWebSearchAgent(query);
      }),

      step.run("agent-arxiv-research", async () => {
        return await runArxivAgent(query);
      }),

      step.run("agent-code-search", async () => {
        return await runGithubAgent(query);
      }),
    ]);

    // Step 3: Fan-in / synthesis
    const finalReport = await step.run(
      "synthesize-final-report",
      async () => {
        return await runSynthesisLLMAgent({
          web: webResults,
          academic: academicResults,
          code: codeResults,
        });
      }
    );

    return {
      success: true,
      report: finalReport,
    };
  }
);
```

---

# 3. 🧠 Why Use `Promise.all()`?

Without parallel execution:

```text
Web Agent       10s
    ↓
ArXiv Agent     15s
    ↓
Code Agent      8s
    ↓
Synthesis       5s

Approximate critical path:
10 + 15 + 8 + 5 = 38s
```

With parallel execution:

```text
Web Agent ─────── 10s ───┐
                         │
ArXiv Agent ───── 15s ──┼──→ Synthesis 5s
                         │
Code Agent ─────── 8s ───┘

Approximate critical path:
max(10, 15, 8) + 5 = 20s
```

So the parallel portion is approximately limited by the **slowest branch**, rather than the sum of all branch durations.

Actual workflow duration also depends on orchestration and runtime overhead.

---

# 4. ⚠️ Important Parallelism Detail

`Promise.all()` does not mean:

> "Ignore all concurrency limits."

Each step still executes subject to the workflow/function's configured limits and the capabilities/limits of your deployment.

Also remember:

```javascript
await Promise.all([
  step.run(...),
  step.run(...),
  step.run(...),
]);
```

means:

> **These independent operations can proceed concurrently.**

If the operations have dependencies, they should remain sequential:

```javascript
const research = await step.run(...);

const summary = await step.run(
  "summarize",
  async () => {
    return summarize(research);
  }
);
```

because `summary` depends on `research`.

---

# 5. 🔀 Fan-Out vs Fan-In

### Fan-Out

One workflow splits work into multiple independent branches.

```text
              Parent
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
     Agent A  Agent B  Agent C
```

### Fan-In

The outputs are brought back together.

```text
Agent A ──┐
Agent B ──┼──→ Aggregator
Agent C ──┘
```

Together:

```text
                 FAN-OUT
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
        Agent A   Agent B   Agent C
          │         │         │
          └─────────┼─────────┘
                    │
                 FAN-IN
                    │
                    ▼
                Synthesis
```

This is extremely useful for:

* Research agents
* RAG retrieval
* Multi-source search
* Document analysis
* Code analysis
* Fact verification
* Multiple LLM opinions
* Data enrichment

---

# 6. 🚦 Concurrency Control

A multi-agent AI system can create a large amount of simultaneous work.

For example:

```text
100 users
   │
   ├── 3 agents each
   │
   └── 300 potential agent executions
```

Without limits, you may run into:

* LLM RPM limits
* LLM TPM limits
* Database connection limits
* Search API limits
* CPU/memory constraints
* Provider throttling
* Increased cost

Inngest allows concurrency to be configured declaratively.

---

# 7. 👤 Per-User / Per-Tenant Concurrency

Suppose one customer can have at most five jobs running simultaneously.

Conceptually:

```javascript
export const rateLimitedAgent = inngest.createFunction(
  {
    id: "rate-limited-llm-agent",

    concurrency: [
      {
        limit: 5,
        key: "event.data.userId",
      },
    ],
  },
  {
    event: "ai/heavy-task.requested",
  },
  async ({ event, step }) => {
    // Workflow logic
  }
);
```

Mental model:

```text
User A
 ├── Job 1
 ├── Job 2
 ├── Job 3
 ├── Job 4
 ├── Job 5
 └── Job 6 → waits

User B
 ├── Job 1
 ├── Job 2
 └── Job 3
```

The key makes the concurrency limit apply according to the value extracted from the event.

---

# 8. 🌍 Global Concurrency

You may also want a system-wide limit.

For example:

```javascript
concurrency: [
  {
    limit: 20,
  },
]
```

Conceptually:

```text
                 Application
                     │
          ┌──────────┴──────────┐
          │ Global limit = 20   │
          └──────────┬──────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
      User A       User B       User C
```

This helps prevent your entire system from overwhelming an external dependency.

---

# 9. 🏢 Combining Concurrency Policies

You can design concurrency around multiple dimensions.

For example:

```text
                    AI Workflow
                        │
             ┌──────────┴──────────┐
             │                     │
       Global limit            User limit
          20 total                5/user
```

This gives you a useful multi-tenant protection model:

```text
Global capacity
      ↓
Protect entire system

Tenant/user capacity
      ↓
Prevent one customer from consuming
all available capacity
```

This distinction is important in SaaS applications.

---

# 10. ⏱️ Throttling

**Concurrency** answers:

> How many executions can run at the same time?

**Throttling** answers:

> How frequently can executions be allowed over a period?

For example:

```javascript
export const throttledScraper = inngest.createFunction(
  {
    id: "throttled-web-scraper",

    throttle: {
      limit: 10,
      period: "1m",
      key: "event.data.targetDomain",
    },
  },
  {
    event: "scrape/domain.requested",
  },
  async ({ event, step }) => {
    // Scraper logic
  }
);
```

Mental model:

```text
Concurrency:

Running jobs at one moment
        ↓
       [5]

Throttle:

Executions during a time window
        ↓
    10 / minute
```

---

# 11. 🆚 Concurrency vs Throttling

| Feature    | Concurrency             | Throttling                   |
| ---------- | ----------------------- | ---------------------------- |
| Controls   | Simultaneous executions | Execution frequency          |
| Question   | "How many now?"         | "How often?"                 |
| Example    | 5 running at once       | 10 per minute                |
| Useful for | Resource protection     | API/provider rate protection |
| Key        | User/tenant/global      | User/domain/provider/etc.    |

They solve related but different problems.

---

# 12. 🛡️ Retry & Error Resilience

Distributed AI workflows frequently encounter transient failures.

Examples:

```text
LLM API timeout
     ↓
429 rate limit
     ↓
Temporary network failure
     ↓
Search API unavailable
     ↓
Database connection error
```

Immediately failing the entire workflow is often undesirable.

Retries allow transient failures to recover automatically.

---

# 13. 🔁 Configuring Retries

A function can be configured with a retry count.

```javascript
export const resilientWorkflow = inngest.createFunction(
  {
    id: "resilient-workflow",
    retries: 5,
  },
  {
    event: "ai/resilient.requested",
  },
  async ({ event, step }) => {

    const result = await step.run(
      "call-ai-provider",
      async () => {
        return await callAIProvider(event.data);
      }
    );

    return result;
  }
);
```

The important mental model is:

```text
Attempt
   │
   ▼
Failure?
   │
   ├── No → Success
   │
   └── Yes
        │
        ▼
      Retry
        │
        ▼
      Retry
        │
        ▼
      ...
```

The exact retry timing/backoff behavior should be configured and understood from the current Inngest runtime/configuration rather than assuming a particular mathematical schedule.

---

# 14. 📈 Exponential Backoff

A common strategy for transient failures is **exponential backoff**.

Instead of:

```text
Retry immediately
Retry immediately
Retry immediately
```

the system progressively waits longer.

Conceptually:

```text
Attempt 1 → fail
     ↓
Wait
     ↓
Attempt 2 → fail
     ↓
Wait longer
     ↓
Attempt 3 → fail
     ↓
Wait even longer
```

Example conceptual schedule:

```text
1s
2s
4s
8s
16s
```

In real systems, backoff often includes **jitter** so that many clients do not retry simultaneously.

The important principle:

> **Retries should reduce pressure on an already struggling dependency, not amplify it.**

---

# 15. 🧠 Retry Only What Makes Sense

Not every error should necessarily be retried.

### Potentially transient

```text
429 Too Many Requests
503 Service Unavailable
Temporary network timeout
Temporary provider failure
```

### Potentially permanent

```text
Invalid API key
Invalid request schema
Permission denied
Malformed input
Non-existent resource
```

A robust AI workflow should distinguish between transient and permanent failures whenever possible.

---

# 16. 💥 `onFailure` — Final Failure Handling

Sometimes all retries fail.

For important workflows, you need a controlled failure path.

Conceptually:

```text
Workflow
   │
   ▼
Step
   │
   ▼
Failure
   │
   ▼
Retry
   │
   ▼
Failure
   │
   ▼
Retry
   │
   ▼
Final failure
   │
   ▼
onFailure
```

Typical uses:

* Mark job as `FAILED`
* Notify the user
* Alert administrators
* Record diagnostics
* Release application-level resources
* Trigger compensating actions

---

# 17. `onFailure` Example

```javascript
export const workflowWithFailureHandler = inngest.createFunction(
  {
    id: "workflow-with-failure-handler",
    retries: 3,

    onFailure: async ({ event, step, error }) => {

      await step.run(
        "mark-job-failed",
        async () => {
          await db.jobs.update({
            where: {
              id: event.data.jobId,
            },

            data: {
              status: "FAILED",
              failedAt: new Date(),
              errorMessage: error.message,
            },
          });
        }
      );

      await step.run(
        "send-admin-alert",
        async () => {
          await sendAdminAlert(
            `Job ${event.data.jobId} failed: ${error.message}`
          );
        }
      );
    },
  },
  {
    event: "ai/pipeline.requested",
  },
  async ({ event, step }) => {

    await step.run(
      "main-processing",
      async () => {
        await runPipeline(event.data);
      }
    );
  }
);
```

### Important

The failure handler itself should be written defensively.

For example, if updating the database fails while handling the failure, you should still have appropriate monitoring/logging so that the failure is not silently lost.

---

# 18. 🧯 Failure Handling Architecture

A production AI job often needs explicit lifecycle states:

```text
QUEUED
  │
  ▼
RUNNING
  │
  ├───────────────┐
  ▼               ▼
COMPLETED       FAILED
                  │
                  ▼
              onFailure
                  │
          ┌───────┴────────┐
          ▼                ▼
       Database          Alert
       update            Admin
```

For example:

```javascript
{
  jobId: "job_123",
  status: "FAILED",
  failedAt: "...",
  errorCode: "PROVIDER_TIMEOUT"
}
```

This gives your frontend a reliable way to display job status.

---

# 19. 🔐 Idempotency + Retries

Retries introduce an important production concern:

> **Could this side effect happen more than once?**

Example:

```javascript
await step.run("send-email", async () => {
  await sendEmail(...);
});
```

Suppose the email provider accepts the request, but your workflow doesn't receive the response because of a network failure.

A retry may happen.

Therefore:

```text
Retry
  ≠
Exactly once
```

For important side effects, use:

* Idempotency keys
* Unique database constraints
* Upserts
* Provider-level idempotency
* State checks

---

# 20. 🧠 Production AI Workflow Example

Consider a document intelligence system:

```text
                Document Uploaded
                       │
                       ▼
                Validate Input
                       │
                       ▼
              ┌────────┼────────┐
              ▼        ▼        ▼
           OCR Agent  RAG     Metadata
              │       Agent     Agent
              │        │        │
              └────────┼────────┘
                       ▼
                 Fan-In Results
                       │
                       ▼
                  Synthesis LLM
                       │
                       ▼
                 Human Approval
                       │
                       ▼
                 Publish Result
                       │
                       ▼
                Send Completion
```

Production controls:

```text
                  Workflow
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
  Concurrency     Throttle      Retries
        │            │            │
        ▼            ▼            ▼
 Protect DB      Protect API   Recover
 / providers     frequency     transient
                               failures
```

---

# 21. 🏢 Multi-Tenant SaaS Architecture

For a SaaS AI platform, concurrency should often be designed around tenants.

Example:

```text
                   AI Platform
                       │
              Global capacity
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
    Tenant A         Tenant B        Tenant C
      │                 │               │
   5 jobs max        5 jobs max      5 jobs max
```

Why?

Without tenant-level protection:

```text
Tenant A
   │
   ├── 100 jobs
   ├── 100 jobs
   ├── 100 jobs
   └── ...
          ↓
   Shared infrastructure
          ↓
    Other customers
       suffer
```

This is known as a **noisy-neighbor problem**.

Concurrency controls can help prevent one tenant from monopolizing workflow capacity.

---

# 22. 🤖 AI Provider Protection

Suppose an LLM provider allows approximately:

```text
100 requests / minute
```

Your system has:

```text
1,000 users
```

If every user triggers several agents simultaneously:

```text
1,000 users
 ×
3 agents
 =
3,000 potential calls
```

Without proper controls:

```text
Your application
      │
      ▼
LLM Provider
      │
      ▼
429 Too Many Requests
```

A better architecture combines:

```text
Concurrency
     +
Throttling
     +
Retries
     +
Backoff
```

---

# 23. 🧩 Production Best Practices

## Architecture

* [ ] Divide long workflows into meaningful durable steps.
* [ ] Use parallel execution only for genuinely independent work.
* [ ] Use fan-out/fan-in for independent multi-agent research.
* [ ] Keep workflows deterministic outside durable work boundaries.
* [ ] Keep individual steps reasonably scoped.

---

## 🧠 Step Design

* [ ] Use stable step IDs.
* [ ] Avoid dynamically generated step IDs.

Good:

```javascript
await step.run("parse-document", async () => {
  // ...
});
```

Avoid:

```javascript
await step.run(
  `parse-${Math.random()}`,
  async () => {
    // ...
  }
);
```

Stable step identity is important for durable execution and replay behavior.

---

# 24. 📦 Keep Step Results Manageable

Avoid returning huge objects unnecessarily.

Bad:

```javascript
return {
  entireDocument,
  entireSearchIndex,
  thousandsOfRawPages,
  hugeLLMResponse,
};
```

Prefer:

```javascript
return {
  documentId,
  summaryId,
  resultLocation,
};
```

Then later steps can retrieve the required data.

Mental model:

```text
Step
 │
 ├── Do expensive work
 │
 └── Return compact durable result
          │
          ▼
      Next step
```

This makes workflows easier to manage and reason about.

---

# 25. 🔐 Secrets & Environment Variables

Never hard-code secrets:

```javascript
// ❌ Bad
const apiKey = "sk-...";
```

Use environment variables:

```javascript
const apiKey = process.env.OPENAI_API_KEY;
```

Keep Inngest-related credentials/configuration in environment variables according to the deployment setup.

For example, commonly:

```text
INNGEST_EVENT_KEY
INNGEST_SIGNING_KEY
```

Do not commit secret values to Git.

---

# 26. 📊 Observability

A production workflow should make it possible to answer:

```text
What happened?
      ↓
Which step failed?
      ↓
How long did it take?
      ↓
How many retries occurred?
      ↓
Which tenant/user triggered it?
      ↓
What was the final state?
```

Monitor things such as:

* Workflow success/failure rate
* Step latency
* Retry frequency
* Provider errors
* Concurrency saturation
* Throttling
* Token usage
* Cost
* Queue/wait time
* Database failures

---

# 27. 🧪 Local Development

Use the Inngest development tooling for local workflow testing.

A common development command is:

```bash
npx inngest-cli@latest dev
```

Then run your application and inspect the workflow execution through the local Inngest development environment.

This is useful for understanding:

```text
Event
  ↓
Function
  ↓
Step 1
  ↓
Step 2
  ↓
Step 3
```

before deploying to production.

---

# 28. 🧠 Complete Reliability Model

For production AI workflows, think in layers:

```text
                 AI WORKFLOW
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
    Parallelism   Concurrency   Throttling
        │             │             │
        ▼             ▼             ▼
    Faster work    Protect       Protect
                   resources     providers
                      │
                      ▼
                   Retries
                      │
                      ▼
                 Backoff/Jitter
                      │
                      ▼
                 onFailure
                      │
                      ▼
                Recovery/Alert
                      │
                      ▼
                 Observability
```

---

# 29. ⚖️ Key Concepts Compared

| Concept         | Main Question                          | Example                 |
| --------------- | -------------------------------------- | ----------------------- |
| `Promise.all()` | What can run concurrently?             | 3 research agents       |
| Fan-out         | How do I split work?                   | Web + ArXiv + GitHub    |
| Fan-in          | How do I combine results?              | Synthesis LLM           |
| Concurrency     | How many run simultaneously?           | 5 per tenant            |
| Throttling      | How frequently can they execute?       | 10/minute               |
| Retry           | What if transient failure occurs?      | Retry API call          |
| Backoff         | How should retries be spaced?          | Increasing delay        |
| `onFailure`     | What happens after final failure?      | Mark job failed         |
| Idempotency     | How do I avoid duplicate side effects? | Payment idempotency key |
| Observability   | How do I understand execution?         | Logs/traces/metrics     |

---

# 30. 🎯 Interview Questions

### Q1. What is fan-out/fan-in?

**Fan-out** splits a workflow into independent parallel branches.

**Fan-in** combines the outputs of those branches for downstream processing.

---

### Q2. Why use `Promise.all()` with Inngest steps?

It allows independent step operations to be initiated concurrently, reducing the critical-path duration compared with sequential execution.

---

### Q3. What is the difference between concurrency and throttling?

Concurrency limits the number of executions happening at the same time.

Throttling limits how frequently executions are allowed over a time window.

---

### Q4. Why is concurrency important for AI systems?

AI workloads can generate many simultaneous LLM, search, database, and tool calls. Concurrency controls help prevent resource exhaustion and provider overload.

---

### Q5. What is exponential backoff?

It is a retry strategy where the delay between retry attempts generally increases after successive failures.

---

### Q6. Why isn't retry enough?

Retries can recover transient errors, but they don't solve:

* Permanent errors
* Duplicate side effects
* Resource exhaustion
* Incorrect application logic

You still need validation, idempotency, concurrency control, and failure handling.

---

### Q7. What is `onFailure` used for?

It provides a final failure path for workflows that cannot successfully complete after their configured retry behavior.

Typical uses include updating job status, alerting administrators, and recording failure information.

---

### Q8. Does retry guarantee exactly-once execution?

**No.**

Durable execution helps preserve workflow progress, but external side effects must still be designed to tolerate retries.

---

# 31. 🧾 Cheat Sheet

### Parallel agents

```javascript
await Promise.all([
  step.run("agent-a", () => runAgentA()),
  step.run("agent-b", () => runAgentB()),
  step.run("agent-c", () => runAgentC()),
]);
```

### Per-user concurrency

```javascript
concurrency: [
  {
    limit: 5,
    key: "event.data.userId",
  },
]
```

### Global concurrency

```javascript
concurrency: [
  {
    limit: 20,
  },
]
```

### Throttling

```javascript
throttle: {
  limit: 10,
  period: "1m",
  key: "event.data.targetDomain",
}
```

### Retries

```javascript
{
  retries: 5,
}
```

### Failure handler

```javascript
{
  onFailure: async ({ event, step, error }) => {
    // Final failure handling
  },
}
```

---

# 🧠 Final Mental Model

Remember these five questions:

```text
1. What can execute together?
       ↓
   Promise.all()
   / Fan-out

2. How many can execute at once?
       ↓
   Concurrency

3. How frequently can they execute?
       ↓
   Throttling

4. What happens when something temporarily fails?
       ↓
   Retry + Backoff

5. What happens when it still fails?
       ↓
   onFailure
```

For an AI SaaS platform:

```text
                 USER REQUEST
                      │
                      ▼
                INNGEST EVENT
                      │
                      ▼
                INPUT STEP
                      │
              ┌───────┼───────┐
              ▼       ▼       ▼
            Agent A Agent B Agent C
              │       │       │
              └───────┼───────┘
                      ▼
                  FAN-IN
                      │
                      ▼
                SYNTHESIS LLM
                      │
                      ▼
                   RESULT
```

While underneath:

```text
        ┌─────────────────────────────┐
        │        Reliability          │
        ├─────────────────────────────┤
        │ Concurrency                 │
        │ Throttling                  │
        │ Retries                     │
        │ Backoff                     │
        │ Idempotency                 │
        │ Failure Handling            │
        │ Observability               │
        └─────────────────────────────┘
```

### 🚀 One-line summary

> **Parallelism makes AI workflows faster, concurrency protects resources, throttling protects external providers, retries recover transient failures, `onFailure` handles unrecoverable failures, and idempotency makes side effects safe under retries.**

