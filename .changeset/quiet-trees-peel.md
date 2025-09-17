---
"@voltagent/core": patch
---

fix: resolve UIMessage tool persistence issue causing OpenAI API errors and useChat display problems

Fixed a critical issue where tool messages weren't being properly converted between UIMessage and ModelMessage formats, causing two problems:

1. OpenAI API rejecting requests with "An assistant message with 'tool_calls' must be followed by tool messages"
2. useChat hook showing tools as "working/running" despite having `state: "output-available"`

## The Problem

When converting tool messages to UIMessages for persistence:

- Tool role messages were incorrectly having `providerExecuted: false` set
- This caused AI SDK's `convertToModelMessages` to misinterpret client-executed tools
- The conversion logic was not properly preserving the tool execution context

## The Solution

- Removed explicit `providerExecuted` assignments for tool role messages
- Tool role messages now correctly indicate client execution by omitting the flag
- Removed unnecessary `step-start` insertions that were added during message conversion
- Now exactly mimics AI SDK's UIMessage generation behavior

## Technical Details

The `providerExecuted` flag determines how tools are converted:

- `providerExecuted: true` → tool results embedded in assistant message (provider-executed)
- `providerExecuted: undefined/false` → separate tool role messages (client-executed)

By not setting this flag for tool role messages, the AI SDK correctly:

1. Generates required tool messages after tool_calls (fixes OpenAI API error)
2. Recognizes tools as completed rather than "working" (fixes useChat display)
