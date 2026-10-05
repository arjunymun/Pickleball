-- Call the bounded app reconciler independently of the hosting provider's Cron tier.
-- The authorization token is supplied to Vault separately; it never belongs in a migration.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net with schema extensions;
    create schema if not exists academy_private;
    revoke all on schema academy_private from public, anon, authenticated;

    execute $function$
      create or replace function academy_private.reconcile_payments()
      returns bigint
      language plpgsql
      security invoker
      set search_path = ''
      as $body$
      declare
        scheduler_secret text;
      begin
        select decrypted_secret into scheduler_secret
        from vault.decrypted_secrets
        where name = 'academy_cron_secret';

        if scheduler_secret is null or length(scheduler_secret) < 32 then
          raise exception 'Academy scheduler secret is not configured';
        end if;

        return net.http_get(
          url := 'https://pickleball-xi.vercel.app/api/cron/reconcile',
          headers := jsonb_build_object('Authorization', 'Bearer ' || scheduler_secret),
          timeout_milliseconds := 120000
        );
      end
      $body$;
    $function$;
    revoke all on function academy_private.reconcile_payments() from public, anon, authenticated;
    perform cron.schedule(
      'academy-reconcile-payments',
      '*/5 * * * *',
      'SELECT academy_private.reconcile_payments();'
    );
  else
    raise notice 'pg_net unavailable: schedule payment reconciliation on another compatible runtime';
  end if;
end $$;
