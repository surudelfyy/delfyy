# Supabase Sanity Checklist

Short, practical checks to avoid breaking production data paths.

## Inspect idempotency table shape
```sql
-- List columns on public.idempotency_keys
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'idempotency_keys'
order by ordinal_position;
```

## Confirm RLS is on
```sql
-- RLS must be enabled
select relrowsecurity
from pg_class
where relname = 'idempotency_keys';
```

## Naming reminder
- Code expects `idempotency_key` (not `key`). Mismatch here breaks idempotency.

## Applying migrations safely
- Prefer migration files for repeatability. One-shot SQL is only for emergencies; document exactly what ran.
- Before apply: run the SQL on a staging clone; verify RLS stays enabled.
- After apply: re-run the column + RLS checks above and run app idempotency tests.*** End Patch.twimgсьці

