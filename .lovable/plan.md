

## Plan: Add Google Sign-In

### Overview
Add a "Sign in with Google" button to the Auth page using Lovable Cloud's managed Google OAuth, which requires no API keys or configuration from you.

### Steps

1. **Configure Google OAuth provider** using the Configure Social Login tool. This generates the required `@lovable.dev/cloud-auth-js` package and `src/integrations/lovable/` module automatically.

2. **Update Auth page** (`src/pages/Auth.tsx`):
   - Import `lovable` from `@/integrations/lovable/index`
   - Add a "Sign in with Google" button below the email/password form, separated by an "or" divider
   - The button calls `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`
   - Style it consistently with the existing design

3. **Update Auth context** (`src/lib/auth.tsx`):
   - The existing `onAuthStateChange` listener already handles OAuth sessions, so no changes needed there. The Google sign-in will automatically set the session and redirect the user.

### Technical Details
- Uses Lovable Cloud's managed Google OAuth (no API keys needed)
- The `lovable.auth.signInWithOAuth()` function handles the full OAuth redirect flow
- After Google auth completes, the existing `onAuthStateChange` in `AuthProvider` picks up the session automatically
- The `ProtectedRoute` component works unchanged since it checks `user` from the same auth state

