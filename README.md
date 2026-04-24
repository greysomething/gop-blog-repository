# Gift of Parenthood Blog

AI-managed blog for [blog.giftofparenthood.org](https://blog.giftofparenthood.org). Research → draft → score → publish pipeline over curated fertility, adoption, surrogacy, and family-building sources, with a 95%-confidence auto-publish gate and a human-review queue for anything medical, legal, or unverified.

Stack: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase (Postgres, Auth, RLS) + Anthropic Claude. Deployed to Vercel.

---

## First-time setup

### 1. Supabase

1. Create a **new** Supabase project (not shared with the grant portal). Region: closest to your users.
2. Grab from **Project Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable key (`sb_publishable_...`) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Secret key (`sb_secret_...`) → `SUPABASE_SERVICE_ROLE_KEY`
3. Run the migrations. Either from the Supabase dashboard SQL editor (paste files in order) or via the CLI:

   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

   Files in [`supabase/migrations/`](supabase/migrations/):
   - `20260423000001_init.sql` — schema + RLS
   - `20260423000002_seed.sql` — categories, tags, and all the curated sources (Tier 1/2/3)
   - `20260423000003_prompts_seed.sql` — initial versioned system prompts for each stage
4. **Promote your first admin user.** Sign up through Supabase Auth (dashboard → Authentication → Users → Invite user, or hit the app once you've deployed), then flip the role:

   ```sql
   update public.profiles set role = 'admin' where email = 'you@giftofparenthood.org';
   ```

5. **PubMed feeds** — the seed inserts PubMed source rows without `feed_url` because each topic-specific feed has a unique ID. Go to [pubmed.ncbi.nlm.nih.gov](https://pubmed.ncbi.nlm.nih.gov/), run each query (IVF, Infertility, PCOS, Endometriosis, Male Factor, Recurrent Pregnancy Loss, Fertility Preservation), click "Create RSS", and paste the resulting feed URL into the matching row's `feed_url`:

   ```sql
   update public.sources set feed_url = 'https://pubmed.ncbi.nlm.nih.gov/rss/search/<id>/' where name = 'PubMed: IVF';
   ```

### 2. Anthropic

Create a key at [console.anthropic.com](https://console.anthropic.com/) → `ANTHROPIC_API_KEY`.

### 3. Local env

Copy `.env.example` to `.env.local` (already stubbed for you — see [`.env.local`](.env.local)) and fill in the blanks. `.env.local` is gitignored.

Generate a `CRON_SECRET`:

```bash
openssl rand -hex 32
```

### 4. Install & run

```bash
npm install
npm run dev
# → http://localhost:3000
# → http://localhost:3000/admin/login
```

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import into Vercel, framework preset: Next.js.
3. Environment variables (all from `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (mark as **server-only**, do not expose)
   - `ANTHROPIC_API_KEY` (server-only)
   - `CRON_SECRET` (server-only)
   - `NEXT_PUBLIC_SITE_URL=https://blog.giftofparenthood.org`
4. Domain: add `blog.giftofparenthood.org` in **Domains**, point DNS per Vercel's instructions.
5. Crons live in [`vercel.json`](vercel.json) and activate automatically on first deploy. Vercel Cron sends `Authorization: Bearer $CRON_SECRET` so the pipeline routes reject unauthorized hits (see [`lib/auth.ts`](lib/auth.ts)).

---

## How the pipeline works

| Stage | Cron | File | What it does |
|-------|------|------|--------------|
| research | every 6h | [`lib/pipeline/research.ts`](lib/pipeline/research.ts) | Fetches RSS/sitemap feeds from all active Tier 1/2/3 sources, passes harvested items to Claude Sonnet to propose 3–10 topics, inserts them with a `dedupe_hash` to avoid re-proposing the same thing. Flags `medical_legal_flag=true` on anything involving dosing, diagnosis, or law. |
| draft | every 2h | [`lib/pipeline/draft.ts`](lib/pipeline/draft.ts) | Takes 3 oldest `proposed` topics. Claude Opus writes a 900–1600 word Markdown article with numbered citations pointing **only** to the topic's source_refs. Writes `posts.status='draft'` + inserts `citations` + `post_tags`. |
| score | every 30m | [`lib/pipeline/score.ts`](lib/pipeline/score.ts) | Scores drafts on the 5-dimension rubric (source quality 25%, citation coverage 20%, 100−risk 20%, fact check 20%, editorial 15%). Hard gates: any `unverified_claims` OR `medical_legal_flag=true` → `queued` for human review. Otherwise → `scored`. |
| publish | every 15m | [`lib/pipeline/publish.ts`](lib/pipeline/publish.ts) | Auto-publishes posts with `status='scored'` AND `confidence_score >= 95`. Revalidates home, sitemap, and RSS. |

Human review of queued posts: admin UI at [`/admin/queue`](app/admin/(protected)/queue/page.tsx) → edit in place → approve (marks citations verified, publishes) or reject.

### Safety invariants

- `score` recomputes the confidence score from the rubric server-side — the model's own arithmetic isn't trusted.
- `medical_legal_flag` on a topic is **sticky**: even if the model says `forces_review=false`, the server forces review (see [`lib/pipeline/score.ts`](lib/pipeline/score.ts:72)).
- All pipeline routes gate on `CRON_SECRET` (401 otherwise).
- Only the service-role server client can write to pipeline tables; RLS blocks anon + reader roles. Public reads are limited to `posts` with `status='published'` and their citations/tags.

---

## Tuning

- **Batch sizes** — `MAX_ITEMS_PER_SOURCE`, `MAX_TOTAL_ITEMS` in `research.ts`; `BATCH` in `draft.ts`/`score.ts`.
- **Threshold** — `AUTO_PUBLISH_THRESHOLD = 95` in [`lib/pipeline/score.ts`](lib/pipeline/score.ts). Lower temporarily to see what would auto-publish, then bring it back up.
- **Prompts** — versioned in `public.prompts`. To roll out a new prompt: insert a new row with the same `name` but a newer `version`, set `is_active=true`, set the old one `is_active=false`. The pipeline picks the most recent active one per `name`.
- **Models** — `lib/ai/anthropic.ts` has `MODEL_DRAFT` (Opus for quality) and `MODEL_SCORE` / `MODEL_RESEARCH` (Sonnet for speed/cost).

---

## Project structure

```
app/
  (root layout + header/footer/GTM)
  page.tsx                 # recent posts
  posts/[slug]/page.tsx    # public article (ISR 60s)
  rss.xml / sitemap.ts / robots.ts
  admin/
    login/page.tsx         # public
    (protected)/           # everything here is admin-gated via layout
      layout.tsx           # sidebar + requireAdmin()
      page.tsx             # dashboard + stats + recent runs
      queue/               # human-review queue + detail editor
      posts/               # all posts + per-post editor
      topics/ sources/ runs/ prompts/
  api/
    pipeline/{research,draft,score,publish}/route.ts   # cron-gated
    admin/queue/[id]/route.ts                          # approve/reject

lib/
  supabase/{client,server,admin}.ts
  ai/{anthropic,prompts}.ts
  pipeline/{feeds,research,draft,score,publish}.ts
  auth.ts                  # requireAdmin() + assertCron()

components/
  layout/{SiteHeader,SiteFooter}.tsx
  admin/{LogoutButton,QueueReviewForm,PostEditor}.tsx
  ui/                      # shadcn primitives

supabase/migrations/       # init + seed sources + seed prompts
```

---

## Notes

- The header/footer are **ported** from `../gop-grant-portal-repository` (which is actually a Vite + React Router SPA, not Next.js as the initial brief described). Same visual language: orange-500 header, black footer with amber-500 stripe, Poppins, shared logo URL, same nav targets.
- Cover images and any uploaded media should go to Supabase Storage — not implemented in this scaffold; for now paste hosted image URLs into `posts.cover_image_url`.
- No email notifications on queue items yet; check `/admin/queue` periodically or wire up a Supabase Edge Function to ping Slack/email when `review_queue` gets a new row.
