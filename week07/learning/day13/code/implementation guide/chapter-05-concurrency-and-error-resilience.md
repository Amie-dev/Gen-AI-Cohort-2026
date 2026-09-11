# 🚦 Chapter 05 — Concurrency, Rate Limiting & Failure Recovery

## 1. Declarative Concurrency Control

```javascript
concurrency: [
  { limit: 2, key: 'event.data.userId' }, // Per tenant cap
  { limit: 10 },                          // Global system cap
]
```

---

## 2. Unrecoverable Failure Handlers (`onFailure`)

```javascript
onFailure: async ({ event, step, error }) => {
  await step.run('mark-failed-in-db', async () => markFailed(event.data.jobId));
  await step.run('send-alert', async () => alertAdmin(error.message));
}
```
