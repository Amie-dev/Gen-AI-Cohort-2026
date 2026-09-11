# 🤖 Chapter 02 — Procedural Code vs. Durable Execution

## 1. Procedural Execution Vulnerabilities

In procedural code, sequential LLM steps inside standard HTTP handlers lose state during server restarts:

```text
[Step 1] ──► [Step 2] ──► 💥 CRASH! ──► Restart from [Step 1] (Double Token Cost!)
```

---

## 2. Inngest Durable Checkpointing

Inngest checkpoints step results in durable state:

```text
[Step 1] (Cached) ──► [Step 2] ──► 💥 CRASH! ──► Resumes FROM [Step 2] (Zero Duplicate Cost!)
```
