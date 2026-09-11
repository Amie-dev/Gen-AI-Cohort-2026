# 🎯 Executive Interview Reference — Inngest & Durable Execution

A quick executive-level Q&A summary for Day 13 core concepts.

---

## ⚡ Core Summary Q&A

### Q1. What is Inngest?
**A:** An event-driven background workflow engine that provides durable execution for serverless and Node.js applications without requiring manual Redis or queue infrastructure.

### Q2. What is Durable Execution?
**A:** A programming model where execution progress is checkpointed at steps. If a process crashes mid-way, execution resumes from the exact failed step using cached previous outputs.

### Q3. Why are synchronous HTTP routes unsafe for multi-agent AI pipelines?
**A:** Long-running LLM calls trigger HTTP gateway timeouts (10-30s). Process failures crash the whole route, forcing full restarts that waste expensive LLM tokens and API quotas.

### Q4. How does `step.run()` work?
**A:** It executes a callback function as a durable step, serializing and caching its JSON result. On retries, previous steps return cached results immediately without re-executing.

### Q5. What is the difference between `step.sleep()` and `setTimeout()`?
**A:** `setTimeout()` holds memory open and dies if the server crashes. `step.sleep()` pauses durably, frees server memory immediately, and resumes via Inngest webhook after the elapsed duration.

### Q6. What is `step.waitForEvent()`?
**A:** A durable primitive that pauses workflow execution until a matching external event is received (e.g. human approval), with configurable timeout handling.

### Q7. How do you handle per-user rate limits in Inngest?
**A:** By defining declarative concurrency limits in function configuration:
```javascript
concurrency: [{ limit: 5, key: "event.data.userId" }]
```

### Q8. What does `onFailure` do?
**A:** An automatic callback triggered when a function exhausts all retries, allowing resilient cleanup, database status updates, and alerting.
