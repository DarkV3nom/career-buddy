# @career-assistant/db

Prisma schema (`prisma/schema.prisma`) and hand-written SQL migration
(`prisma/migrations/0001_init/migration.sql`) for the core data layer.

## Known limitation from this build

`prisma validate` / `prisma generate` / `prisma migrate dev` could not be
run in the sandbox that generated this repo — the Prisma CLI downloads its
query/schema-engine binaries from `binaries.prisma.sh` at install/run time,
and that domain was unreachable (403) from the build environment. The
schema was checked manually instead: brace balance, no duplicate fields,
all 12 models present, nullable FKs paired correctly with `onDelete:
SetNull`, and the implicit many-to-many join table for
`StarStory <-> InterviewPrepPack` hand-matched to Prisma's default naming
convention (`_PrepPackStories`, columns `A`/`B`) so `prisma db pull` should
reconcile cleanly.

**First thing to run on your machine, before anything else:**

```bash
cd packages/db
npx prisma validate
npx prisma generate
```

If that passes, the schema is confirmed sound and `@prisma/client` types
will be available to the rest of the app. If `prisma migrate dev` reports
drift against `migration.sql`, trust `prisma db pull` output over this
hand-written file and reconcile.

## Applying the migration to Supabase

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or paste `prisma/migrations/0001_init/migration.sql` directly into the
Supabase SQL editor. Either way, run it once — RLS policies (`create
policy ... using (user_id = auth.uid())`) depend on Supabase Auth being
configured first, since `auth.uid()` resolves via Supabase's session JWT.
