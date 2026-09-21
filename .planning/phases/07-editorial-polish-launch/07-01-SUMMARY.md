# Phase 07 Plan 01: Wave 0 Decisions, Package Legitimacy Gate, Lighthouse CI Skeleton Summary

> In progress — Task 1 rulings recorded first so they are committed before any install runs. The remaining sections are filled in when Task 3 completes.

## Wave 0 Decisions

Answered by Nick on 2026-09-21. Later plans (07-05, 07-06, 07-07, 07-08, 07-10) read these keys verbatim.

```
D7-01: b
domain: none
D7-02: b
providers: google
D7-03: N=34
batch1=0
batch2=0
android_device: no
```

- **D7-01: b** — stay on milesworth.vercel.app with the Clerk development instance. No custom domain. (`domain: none`)
- **D7-02: b** — keep social connections + render the in-app-browser hint (plan 07-05 renders the hint). `providers: google`
- **D7-03: N=34** — ship the dataset as-is. `batch1=0` (= min(20, 34 − 34)), `batch2=0` (= 34 − 34 − 0).
- **android_device: no** — no Android device available for plan 07-07's device pass.

### D7-02 nuance (recorded verbatim)

As of 2026-09-21 the live Clerk development instance (renewing-seal-8576.clerk.accounts.dev) has NO social connections enabled — the public /v1/environment endpoint reports `enabled social: none`, email_code is the only first factor. Nick chose to enable Google himself in the Clerk Dashboard before launch.

**Open human action:** Nick enables Google in Clerk Dashboard → Configure → SSO connections (pending as of 2026-09-21)

No executor changes Clerk settings; this is Nick's Dashboard action.
