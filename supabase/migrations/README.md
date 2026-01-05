# Database Migrations

Run in Supabase Dashboard → SQL Editor

## Verify after running:

```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';
SELECT column_name FROM information_schema.columns WHERE table_name = 'subscriptions';
SELECT policyname FROM pg_policies WHERE tablename = 'subscriptions';
```
