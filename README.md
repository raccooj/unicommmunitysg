# Campus SG

Anonymous, mobile-first community boards for students at **NUS, NTU, SMU and SIM**.
University membership is **self-declared and not verified**. Not affiliated with any university.

Stack: Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Supabase (Auth + Postgres RLS).

Flow: sign up / log in → choose university (once) → university feed (General / Academics / Campus Life) → write post → open post → comment.

## Setup

1. Create a Supabase project.
2. **SQL Editor** → paste and run `supabase/migrations/0001_campus_sg.sql` (safe to re-run).
3. **Authentication → URL Configuration**: set *Site URL* to your deployed URL and add
   `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback` to *Redirect URLs*.
   (For a quick demo you may instead turn off *Confirm email* under Authentication → Providers → Email.)
4. `cp .env.example .env.local` and fill in values from **Project Settings → API** (URL + anon/publishable key only).
5. `npm install && npm run dev`.

## Deploy (Vercel)

Import the repo in Vercel, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, deploy, then add the
production URL to Supabase Redirect URLs (step 3). Never add the service role key — the app does not need it.

## Security model (enforced in Postgres)

- `profiles`: users read/update only their own row; university can be set once and never changed.
- `posts` / `comments`: readable only when the post's university equals the reader's university.
- `author_id`, `university` (posts) and `is_op` (comments) are set by triggers from the session — clients cannot supply them.
- Column-level grants hide `author_id` from clients entirely; feed and comments show only "Anonymous".
- Only authors may update/delete their own posts and comments. `anon` has no table access.

`npm run test:rls` runs 36 authorization checks against the migration in an in-memory Postgres (PGlite) with a stubbed `auth` schema.

### Anonymity limitations

- Supabase (and project admins) can link every post and comment to an account and email.
- Comments by the post's author are labelled "Anonymous (author)" — readers learn that those come from the same person.
- Timing, writing style and post content can still identify people; small communities make this easier.
- Self-declared university: anyone can claim any of the four universities with any email address.
