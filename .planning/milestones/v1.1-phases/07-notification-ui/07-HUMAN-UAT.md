---
status: partial
phase: 07-notification-ui
source: [07-VERIFICATION.md]
started: 2026-03-25T10:00:00Z
updated: 2026-03-25T10:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Bell icon visible in portal sidebar and real-time badge update
expected: Bell appears below client name/badges in sidebar; INSERT into notifications table causes badge to increment with animate-ping pulse (no page refresh); badge disappears when all marked read
result: [pending]

### 2. Dropdown UI interaction end-to-end
expected: Clicking bell opens dropdown with type icons, titles, truncated body, relative timestamps; clicking a notification marks it read (bold/dot removed) and navigates to action_link; Escape and click-outside close the dropdown
result: [pending]

### 3. Cross-tenant E2E test execution
expected: `npx playwright test --project=cross-tenant` passes — User B does not see User A's inserted notification
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
