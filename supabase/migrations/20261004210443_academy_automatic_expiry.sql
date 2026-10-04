-- Supabase includes pg_cron; the embedded test runtime does not bundle it.
-- Availability and booking writes also expire stale holds transactionally.
do $$
begin
  if exists(select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule(
      'academy-expire-holds',
      '*/5 * * * *',
      'SELECT public.academy_expire();'
    );
  else
    raise notice 'pg_cron unavailable: automatic expiry must be configured on the hosted database';
  end if;
end $$;
