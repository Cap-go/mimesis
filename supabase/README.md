# Supabase Migrations

This directory contains database migrations for the Mimesis project.

## Initial Setup

The initial schema has been created based on the TypeScript types, but to get the exact production schema, you should:

1. **Get your database password** from the Supabase dashboard:
   - Go to https://supabase.com/dashboard/project/asavjwzyvjjyjdmsjlhv/settings/database
   - Copy the database password

2. **Link to your production project**:

   ```bash
   supabase link --project-ref asavjwzyvjjyjdmsjlhv
   ```

   Enter your database password when prompted.

3. **Pull the actual schema from production**:

   ```bash
   supabase db pull
   ```

   This will create a new migration file with the exact schema from production.

4. **Replace the initial migration** if needed:

   ```bash
   # Backup the generated file
   mv supabase/migrations/00000000000000_initial_schema.sql supabase/migrations/00000000000000_initial_schema.sql.bak

   # The pulled migration will have a timestamp, rename it
   mv supabase/migrations/YYYYMMDDHHMMSS_remote_schema.sql supabase/migrations/00000000000000_initial_schema.sql
   ```

## Alternative: Direct DB Dump

If you prefer to use pg_dump directly:

```bash
# Using the connection string from your Supabase project settings
pg_dump "postgresql://postgres:YOUR_PASSWORD@db.asavjwzyvjjyjdmsjlhv.supabase.co:5432/postgres" \
  --schema=public \
  --no-owner \
  --no-privileges \
  --no-comments \
  > supabase/migrations/00000000000000_initial_schema.sql
```

## Running Migrations

To apply migrations to a local database:

```bash
supabase db reset
```

To apply migrations to production:

```bash
supabase db push
```

## Creating New Migrations

```bash
supabase migration new your_migration_name
```
