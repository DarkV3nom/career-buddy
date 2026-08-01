-- Fixes the job_descriptions_external_url_key index for databases that
-- already ran the original 0002 migration (the partial-index version).
-- New databases running the corrected 0002 never hit this -- see its
-- migration.sql for the full explanation.
drop index job_descriptions_external_url_key;
create unique index job_descriptions_external_url_key on job_descriptions(external_url);
