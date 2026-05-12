# EveSpace Supabase Operations Notes

The memory board schema stores uploaded media in Supabase Storage and keeps only
metadata, bucket names, and storage paths in Postgres.

Manual checks that still need to happen in Supabase:

- Upgrade the project plan or database size if table/storage volume outgrows the current tier.
- Keep memory media in Storage buckets, especially `memory-post-media`.
- Watch database size, table growth, and slow queries in the Supabase dashboard.
- Use the pooled connection string for serverless deployments so API bursts do not exhaust Postgres connections.
- Confirm Storage buckets exist for `memory-post-media`, `event-covers`, `stickers`, and `profile-avatars`.
