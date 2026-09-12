# Supabase database foundation

The migration in `migrations/` targets Supabase PostgreSQL. It creates the initial relational model, constraints, indexes, timestamp triggers, and conservative Row Level Security policies.

## Applying the migration

1. Create a free Supabase project.
2. Copy `.env.example` to `.env.local` and add the project URL and anon key.
3. Apply the migration using the Supabase dashboard SQL editor or Supabase CLI.
4. Generate official database types later with the Supabase CLI and replace `lib/supabase/types.ts`.

No service-role key is required for this foundation. If a future trusted server workflow needs one, keep it server-only and never use a `NEXT_PUBLIC_` prefix.
