# Convex Backend Migration Tasks

1. [x] Restore and verify active-card redirects on the live Vercel deployment. The public homepage, `/hiring`, and sitemap all return HTTP 200.
2. [x] Export and import every card. The user confirmed the one active card was the only card.
3. [ ] Configure `RESEND_API_KEY` and `AUTH_FROM_EMAIL` on Convex production, then create and verify the owner's new Convex account. **Waiting for owner setup.**
4. [ ] Verify admin sign-in and CRUD, then close out the migration.

Completed foundations: Convex schema/functions and auth UI; Vercel and Convex production deployments; homepage and sitemap deployment; Supabase runtime dependencies/configuration and Vercel variables removed. The Supabase project remains intact until all card data is confirmed migrated.
