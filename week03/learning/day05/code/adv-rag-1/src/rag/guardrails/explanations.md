# `src/rag/guardrails/` Directory Explanations

## Overview
Guardrails enforce data privacy, security, and safety compliance across both the input phase (before query translation and retrieval) and output phase (after generation).

## Sub-Module Breakdown
1. **`pii.js`**: Detects Personally Identifiable Information (PII) such as full names, email addresses, phone numbers, and SSNs. Replaces them with token placeholders (e.g. `USER_123`) before passing to external LLMs and restores them after generation.
2. **`jailbreak.js`**: Analyzes incoming queries for prompt injection attacks, system prompt overrides, and unauthorized commands.
3. **`input.js`**: Acts as the central Input Guardrail coordinator, executing PII masking, jailbreak filtering, and policy checks in sequence.
4. **`output.js`**: Performs post-generation verification, checking generated answers for toxic content, PII leakage, and policy violations before sending responses back to users.
