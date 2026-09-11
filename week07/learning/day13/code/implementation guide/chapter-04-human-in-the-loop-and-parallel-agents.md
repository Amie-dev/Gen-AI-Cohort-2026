# 🔀 Chapter 04 — Parallel Agents & Human-in-the-Loop Signals

## 1. Parallel Multi-Agent Execution

Execute multiple background steps in parallel and aggregate their results:

```javascript
const [web, papers, code] = await Promise.all([
  step.run('agent-web', async () => fetchWeb(query)),
  step.run('agent-papers', async () => fetchPapers(query)),
  step.run('agent-code', async () => fetchCode(query)),
]);
```

---

## 2. Human-in-the-Loop Signals (`step.waitForEvent`)

Durably pause function execution until an external event is received:

```javascript
const approval = await step.waitForEvent('wait-for-approval', {
  event: 'ai/research.approved',
  timeout: '24h',
  match: 'async.data.jobId',
});
```
