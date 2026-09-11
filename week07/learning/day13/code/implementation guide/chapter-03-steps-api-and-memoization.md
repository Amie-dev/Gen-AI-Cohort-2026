# 🛠️ Chapter 03 — Steps API & Memoization Mechanics

## 1. Step API Overview

- `step.run(id, fn)`: Executes a memoized step.
- `step.sleep(id, duration)`: Non-blocking durable delay (`"30s"`, `"2h"`).
- `step.invoke(id, opts)`: Invokes sub-workflow function durably.
- `step.sendEvent(id, events)`: Emits new asynchronous events.

---

## 2. Re-Hydration Rules

- Code outside `step.run()` re-executes on every function invocation retry.
- Code inside `step.run()` executes **once**, and its serialized JSON return value is cached for subsequent retries.
