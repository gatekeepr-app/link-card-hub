# Implementation Plan: Move the Backend to Convex

## Overview

Replace Supabase card storage and server functions with Convex while keeping Vercel as the web host. Preserve public card behavior, admin card management, and the rule that only `product.gatekeepr@gmail.com` can claim the initial admin role. Authentication moves to Convex Auth; the owner must create a new credential because Supabase passwords and sessions cannot transfer.

## Architecture Decisions

- Convex owns card data, public reads, admin queries, and admin mutations.
- Public functions return only active card fields; destination URLs remain server-side.
- Every admin query and mutation checks an authenticated identity and the admin role inside Convex.
- Vercel remains the hosting platform for the TanStack Start app.
- Do not disable or delete the current Supabase project until data has been imported and the new production flow is verified.
- Convex Auth is used for sign-in, first-time account setup, email verification, resend, and password reset. Auth-dependent screens are client-rendered because Convex Auth SSR support is still in beta.
- Email delivery uses Resend; production needs `RESEND_API_KEY` and `AUTH_FROM_EMAIL` set directly in Convex environment variables.

## Task List

### Phase 1: Convex foundation
- [x] Add Convex dependencies and local configuration without committing deployment secrets.
- [x] Define a schema for cards and admin identities, including unique slug constraints/indexes.
- [x] Implement validated public queries and admin-only CRUD mutations.
- [x] Preserve active-card filtering, sorting, and slug collision errors.

### Phase 2: App integration
- [x] Replace Supabase card server functions and query options with Convex queries/mutations.
- [x] Update the homepage, slug route, admin route, and sitemap to read Convex data.
- [x] Implement Convex Auth and remove obsolete Supabase auth middleware/client code.
- [x] Preserve the allowlisted first-admin claim and deny unapproved accounts from admin operations.

### Phase 3: Data and deployment cutover
- [ ] Export all existing card rows, including inactive rows, and import them into Convex. The available Supabase publishable key exposed one active row; inactive rows still require an authorized export.
- [x] Create dev and production Convex deployments and configure Vercel's `VITE_CONVEX_URL`.
- [ ] Deploy and verify the homepage, card destinations, admin sign-in, CRUD, and sitemap. The production homepage and sitemap are verified; admin email flows await Resend configuration and a new owner account.
- [x] Remove Supabase runtime dependencies and configuration from the app. The Supabase project remains available until all records are confirmed imported.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Existing Supabase credentials do not transfer to Convex Auth | Admin cannot sign in after cutover | Require a new Convex account/password or select a supported hosted identity provider before cutover |
| Convex Auth is beta and SSR support is limited | Auth flow may conflict with TanStack Start | Keep auth-dependent routes client-rendered or choose a supported OIDC provider |
| Current public key cannot export inactive card rows | Existing unpublished links could be lost | Export from Supabase Dashboard or with an authorized admin before importing |
| Deployment variables differ between Vercel and Convex | Production requests fail | Configure each service separately and verify a production deployment before removing Supabase |

## Open Questions

- The user selected Convex Auth and will configure Resend in Convex production.
- Can the current Supabase project provide an export of all cards, including inactive rows?
