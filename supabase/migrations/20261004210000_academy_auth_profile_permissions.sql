-- The foreign key validates the verified auth identity without granting the
-- service role access to Supabase's private auth.users records.
do $$
declare
  definition text := pg_get_functiondef('public.academy_dispatch(text,jsonb,uuid)'::regprocedure);
  old_guard text := 'p_actor is null or not exists(select 1 from auth.users where id=p_actor)';
begin
  if strpos(definition, old_guard) = 0 then
    raise exception 'Expected academy customer guard is missing';
  end if;
  execute replace(definition, old_guard, 'p_actor is null');
end $$;
