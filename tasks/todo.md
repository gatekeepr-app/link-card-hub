# Convex Backend Migration Tasks

- [x] Move authentication to Convex Auth; user selected Resend for email delivery and will configure its production credentials.
- [x] Add Convex schema and admin-secure backend functions.
- [x] Integrate public and admin app flows with Convex.
- [ ] Export and import every card. One active card was available through the Supabase publishable key; inactive rows need an authorized export.
- [x] Configure Convex development and production deployments and Vercel's production Convex URL.
- [x] Deploy and verify the public homepage and sitemap on Vercel.
- [x] Remove Supabase runtime dependencies/configuration from the app and remove old Supabase variables from Vercel.
- [ ] Configure `RESEND_API_KEY` and `AUTH_FROM_EMAIL` on Convex production, then create and verify the owner's new Convex account and test admin CRUD.
