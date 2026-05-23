# Dresser — database schema management

This project uses the **Supabase CLI** with **declarative schemas**. The CLI is
a dev dependency (`npm i`, no global install). Run it with `npx supabase …` or
the `db:*` npm scripts below.

## Layout

```
supabase/
├── config.toml                 # CLI config; schema_paths lists the schema files in order
├── schemas/                    # ← DECLARATIVE schema: the desired state of the DB
│   ├── 01_tables.sql           #   tables + indexes
│   ├── 02_rls.sql              #   RLS enable + owner_all policies + role grants
│   ├── 03_functions.sql        #   do_laundry()
│   ├── 04_seed.sql             #   seed_new_user() (per-user app seeding)
│   └── 05_triggers.sql         #   on_auth_user_created trigger
├── migrations/                 # ← versioned, append-only history applied to the DB
│   └── 20260101000000_initial_schema.sql   # the original hand-written schema
└── seed.sql                    # `db reset` seed (empty — no global seed data)
```

The **`schemas/` files describe the end state** you want. The **`migrations/`
files are the ordered, immutable steps** that get the real database there.
`schema_paths` in `config.toml` lists the schema files **in dependency order**
(tables first; the seed function before the trigger that calls it). When you add
a schema file, add it to that list in the right position.

## The declarative workflow

1. **Edit the desired state** — change the files in `supabase/schemas/`. Add a
   column, a table, a policy, whatever. Do *not* hand-write migrations.
2. **Generate a migration from the diff:**
   ```bash
   npx supabase db diff -f <name>      # or: npm run db:diff -- -f <name>
   ```
   This spins up a shadow database, applies `schemas/`, diffs it against the
   existing migrations, and writes `migrations/<timestamp>_<name>.sql`.
   > `db diff` needs Docker running (shadow DB). The `-f` flag names the file.
3. **Review the generated migration.** The diff tool is good but not infallible
   — read the SQL. Watch for destructive changes (dropped columns/tables) and
   anything `diff` can't infer (data backfills, some RLS/grant nuances). Edit the
   *new* migration if needed.
4. **Apply it to the remote:**
   ```bash
   npx supabase db push                # or: npm run db:push
   ```

To exercise everything locally first, `npm run db:start` (local stack) and
`npm run db:reset` (rebuild local DB from migrations + `seed.sql`), then
`npm run db:stop`.

## The one rule: never edit an applied migration

Once a migration has been pushed to the remote (or committed and applied by
anyone), **treat it as frozen.** Migrations are an append-only ledger. To change
the schema, edit `schemas/` and generate a *new* migration. Editing an
already-applied migration desyncs the migration history from the real database
and breaks `db push`/`db reset` for you and the remote.

## One-time setup: start the remote over from scratch

The remote was previously built by hand-running the old `schema.sql`. We are
**discarding all remote data** and rebuilding from migrations. `db reset
--linked` drops everything in the linked project and reapplies the local
migrations — turning the remote into a clean database matching
`migrations/`.

```bash
# 1. Authenticate the CLI (opens a browser).
npx supabase login

# 2. Link this repo to your remote project (asks for the DB password).
npx supabase link --project-ref <YOUR_PROJECT_REF>

# 3. ⚠️ DESTRUCTIVE: wipe the linked remote and reapply local migrations fresh.
#    Prompts for confirmation (add --yes to skip). This deletes ALL remote data.
npx supabase db reset --linked
```

After the reset, `npx supabase migration list` should show `20260101000000` as
applied both locally and remotely, and from then on `db push` only applies *new*
migrations you generate from `schemas/`.
