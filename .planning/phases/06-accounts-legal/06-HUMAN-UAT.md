---
status: partial
phase: 06-accounts-legal
source: [06-VERIFICATION.md]
started: 2026-09-15T14:43:42Z
updated: 2026-09-15T14:43:42Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. A5 no-reload re-render after modal sign-in
expected: On /?ur=90000&mr=50000, signing in via the Clerk modal flips "Sign in to save" to "Save my balances" and "Sign in to save this" to "Save to my account" without a page reload.
result: [pending]

### 2. Consent checkbox required and legalAcceptedAt recorded
expected: Sign-up modal shows a required consent checkbox linking to /privacy; Clerk Dashboard → Users shows a legal-acceptance timestamp on the new user.
result: [pending]

### 3. Clerk self-serve account deletion is OFF
expected: Clerk Dashboard → User & authentication → User model (Restrictions) shows "Allow users to delete their accounts" OFF; UserButton → Manage account shows no Clerk-hosted "Delete account" control.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
