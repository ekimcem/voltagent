---
"@voltagent/server-hono": patch
---

fix: prevent Swagger/OpenAPI from registering MCP and A2A endpoints when no servers are configured and ensure path parameters declare required metadata, avoiding `/doc` errors in projects that omit those optional packages.
