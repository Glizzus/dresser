-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
-- Fire seed_new_user() (see 04_seed.sql) for every newly created auth user.
-- Depends on public.seed_new_user() already existing, so this file must come
-- after 04_seed.sql in config.toml's schema_paths.

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.seed_new_user();
