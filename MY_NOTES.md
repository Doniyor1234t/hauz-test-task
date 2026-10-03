# NOTES


## Decisions

- **Auth is server-only.Sessions use an httpOnly cookie, and the browser never sees the session secret or API key.all TanStack Start server functions protected with createServerOnlyFn.
- **Who am I” is one React Query (meQuery). The root loader hydrates it during SSR, so the header is correct on first paint. /profile guards access via beforeLoad: signed-out users go to /sign-in?redirect=/profile, while users without an account go to /onboarding.
- **Validation happens on the server too. Zod schemas check every input
  before anything reaches Appwrite.

## My Disagrees

- **Redirects are restricted to same-site paths. safeRedirect accepts only paths beginning with a single /, rejecting //evil.com, /\evil.com, and full URLs. Invalid values fall back to /, preventing open redirects.
- **Profile updates never send a user ID. The server identifies the caller from the session, so the client cannot impersonate another user by changing an ID.
- **The session cookie is cleared only on a 401. Network failures, outages, and other errors are thrown instead of logging the user out unnecessarily.

## Next steps for production

- Rate-limit "send code" per email and per IP, and show generic error
  messages instead of passing Appwrite's raw errors back.
- Add CSRF protection to the server functions that change data. `SameSite=lax`
  helps but isn't enough on its own.
- Run end-to-end tests for the full flow: new user, returning user, redirect
  back to `/profile`, refresh while signed in, logout, and a double-clicked
  onboarding.
- Use real UI components, add i18n (uz / ru / en) and an accessibility pass.
  I added light styling, but it wasn't in scope.