---
"@voltagent/core": patch
---

fix: ensure agents expose their default in-memory storage so observability APIs can read it
fix: keep tool call inputs intact when persisted so VoltOps observability shows them instead of empty payloads
