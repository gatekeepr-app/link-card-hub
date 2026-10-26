<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Landing links are rows in `public.cards`; public reads go through server functions with a publishable-key client, admin writes through `requireSupabaseAuth` + `has_role` — keeps target URLs off the client bundle and RLS enforced.
- Admin role can be claimed only by product.gatekeepr@gmail.com (DB policy `is_gatekeeper_email`); signup is disabled in auth settings — the owner adds any further accounts manually.
