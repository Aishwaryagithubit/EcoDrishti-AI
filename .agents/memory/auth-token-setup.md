---
name: Auth token setup
description: How the Bearer token flow works and what breaks if setAuthTokenGetter is not called
---

The `customFetch` in `lib/api-client-react/src/custom-fetch.ts` only sends an Authorization header when `setAuthTokenGetter` is configured. In a web app (unlike Expo), session cookies are NOT used, so this getter is mandatory.

**Rule:** In `AuthContext.tsx`, call `setAuthTokenGetter(() => token)` on login, `setAuthTokenGetter(null)` on logout, and initialize it in the `useState` initializer from `localStorage.getItem('eco_token')`.

**Why:** Without the getter, every authenticated API call returns 401 even after a successful login. The bug is silent because login itself returns 200 — only subsequent requests fail.

**How to apply:** Any new auth context or token management code must call `setAuthTokenGetter` imported from `@workspace/api-client-react`.
