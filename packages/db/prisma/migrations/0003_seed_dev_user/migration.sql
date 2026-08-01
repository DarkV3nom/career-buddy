-- Placeholder user for the app's pre-auth dev mode. apps/web's
-- DEV_USER_ID constant (app/(app)/jobs/page.tsx, app/(app)/dashboard/page.tsx)
-- points at this row until Supabase Auth replaces it -- job_descriptions.user_id
-- is a uuid FK to users(id), so the placeholder has to be a real row, not
-- just any string (this is what broke: "dev-user" is not a valid UUID).
insert into users (id, email, full_name)
values ('11111111-1111-1111-1111-111111111111', 'dev@career-buddy.local', 'Dev User')
on conflict (id) do nothing;
