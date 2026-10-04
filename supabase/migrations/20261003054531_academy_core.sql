-- Academy tables are intentionally independent of the retired portfolio schema.
-- Apply to a clean Supabase project; all business writes pass through the server.
create extension if not exists btree_gist;

create table public.academy_customers (
  id uuid primary key references auth.users(id),
  email text not null, name text not null, phone text,
  role text not null default 'customer' check (role in ('customer','staff','owner')),
  created_at timestamptz not null default now()
);
create table public.academy_courts (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique check(number between 1 and 4), name text not null
);
insert into public.academy_courts(number,name) select n, 'Court ' || n from generate_series(1,4) n;
create table public.academy_allocations (
  id uuid primary key default gen_random_uuid(), court_id uuid not null references public.academy_courts,
  starts_at timestamptz not null, ends_at timestamptz not null,
  active boolean not null default true, check(starts_at < ends_at),
  exclude using gist(court_id with =, tstzrange(starts_at,ends_at,'[)') with &&) where(active)
);
create table public.academy_bookings (
  id uuid primary key references public.academy_allocations,
  customer_id uuid references public.academy_customers, customer_name text not null,
  status text not null check(status in('held','confirmed','checked_in','completed','no_show','cancelled','expired')),
  payment_status text not null check(payment_status in('pending','paid','failed','refund_pending','partially_refunded','refunded','external','cash','not_required')),
  amount_paise integer not null check(amount_paise >= 0), refunded_paise integer not null default 0,
  hold_expires_at timestamptz,
  source text not null check(source in('online','walk_in','phone','playo','hudle','district','individual_play')),
  reference text, reason text, created_at timestamptz not null default now(),
  check(refunded_paise between 0 and amount_paise),
  check(source <> 'online' or customer_id is not null)
);
create table public.academy_blocks(id uuid primary key references public.academy_allocations, reason text not null);
create table public.academy_memberships (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.academy_customers,
  subscription_id text unique, status text not null default 'pending' check(status in('pending','active','past_due','cancelled','expired')),
  current_period_start timestamptz, paid_through timestamptz, cancel_at_period_end boolean not null default false, cancellation_requested boolean not null default false,
  provider_updated_at bigint not null default 0, last_reconciled_at timestamptz, created_at timestamptz not null default now()
);
create unique index academy_one_open_membership on public.academy_memberships(customer_id) where(status in('pending','active','past_due'));
create table public.academy_attendance (
  id uuid primary key default gen_random_uuid(), membership_id uuid not null references public.academy_memberships,
  customer_id uuid not null references public.academy_customers, visit_date date not null,
  checked_in_at timestamptz not null default now(), unique(customer_id,visit_date), unique(membership_id,visit_date)
);
create table public.academy_notes(id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.academy_customers, actor_id uuid not null references public.academy_customers, body text not null, created_at timestamptz not null default now());
create table public.academy_audit(id uuid primary key default gen_random_uuid(), actor_id uuid references public.academy_customers, action text not null, entity_id uuid, detail jsonb not null default '{}', created_at timestamptz not null default now());
create table public.academy_requests (
  actor_id uuid not null references public.academy_customers, request_key text not null, action text not null,
  input jsonb not null, entity_id uuid not null, primary key(actor_id,request_key)
);
create table public.academy_payment_attempts (
  id uuid primary key default gen_random_uuid(), booking_id uuid unique references public.academy_bookings,
  membership_id uuid unique references public.academy_memberships, actor_id uuid not null references public.academy_customers,
  provider_id text unique, amount_paise integer not null check(amount_paise > 0),
  status text not null default 'creating' check(status in('creating','ready','reconcile','paid','failed')),
  last_reconciled_at timestamptz, created_at timestamptz not null default now(), check((booking_id is null) <> (membership_id is null))
);
create table public.academy_payments (
  provider_payment_id text primary key, provider_order_id text,
  booking_id uuid references public.academy_bookings, membership_id uuid references public.academy_memberships,
  amount_paise integer not null check(amount_paise > 0), captured_at timestamptz not null,
  refund_required boolean not null default false, refunded_paise integer not null default 0,
  period_start timestamptz, period_end timestamptz,
  check((booking_id is null) <> (membership_id is null))
);
create table public.academy_refunds (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.academy_bookings,
  payment_id text not null references public.academy_payments,
  amount_paise integer not null check(amount_paise > 0), provider_refund_id text unique,
  status text not null default 'pending' check(status in('pending','processed','failed')),
  reason text not null, last_reconciled_at timestamptz, created_at timestamptz not null default now()
);
create unique index academy_one_pending_refund on public.academy_refunds(payment_id) where(status='pending');
create table public.academy_webhook_events (
  id text primary key, body_hash text not null, payload jsonb not null,
  status text not null default 'processing' check(status in('processing','processed','failed')),
  lease_until timestamptz not null default(now()+interval '30 seconds'), attempts integer not null default 1,
  created_at timestamptz not null default now(), processed_at timestamptz, next_attempt_at timestamptz not null default now()
);
create index academy_booking_customer on public.academy_bookings(customer_id,created_at desc);
create index academy_hold_expiry on public.academy_bookings(hold_expires_at) where(status='held');

-- Server service role is the sole Data API actor. A customer cannot write states,
-- impersonate a staff actor, inspect other customers, or settle their own payment.
do $$ declare t text; begin
  foreach t in array array['academy_customers','academy_courts','academy_allocations','academy_bookings','academy_blocks','academy_memberships','academy_attendance','academy_notes','academy_audit','academy_requests','academy_payment_attempts','academy_payments','academy_refunds','academy_webhook_events'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;

create function public.academy_booking_json(p_id uuid) returns jsonb language sql stable set search_path=public as $$
  select jsonb_build_object('id',b.id,'courtId',a.court_id,'courtName',c.name,'customerId',b.customer_id,'customerName',b.customer_name,
    'startsAt',a.starts_at,'endsAt',a.ends_at,'status',b.status,'paymentStatus',b.payment_status,'amountPaise',b.amount_paise,
    'refundedPaise',b.refunded_paise,'holdExpiresAt',b.hold_expires_at,'source',b.source,'reference',b.reference,'reason',b.reason,'createdAt',b.created_at)
  from academy_bookings b join academy_allocations a on a.id=b.id join academy_courts c on c.id=a.court_id where b.id=p_id
$$;
create function public.academy_membership_json(p_id uuid) returns jsonb language sql stable set search_path=public as $$
  select jsonb_build_object('id',m.id,'customerId',m.customer_id,'status',case when m.paid_through>now() then 'active' when m.status='active' then 'expired' else m.status end,
    'currentPeriodStart',m.current_period_start,'paidThrough',m.paid_through,'cancelAtPeriodEnd',m.cancel_at_period_end,'subscriptionId',m.subscription_id)
  from academy_memberships m where m.id=p_id
$$;
create function public.academy_expire() returns void language plpgsql set search_path=public as $$
begin
  with expired as(update academy_bookings set status='expired', payment_status='failed' where status='held' and hold_expires_at<=now() returning id)
  update academy_allocations set active=false where id in(select id from expired);
  update academy_memberships set status=case when cancel_at_period_end then 'cancelled' else 'past_due' end where status='active' and paid_through<=now();
end $$;

-- Each call is one PostgreSQL transaction, including request deduplication and
-- shared court allocation. Provider HTTP calls happen outside database locks.
create function public.academy_dispatch(p_action text, p_input jsonb default '{}', p_actor uuid default null) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare
  actor academy_customers%rowtype; b academy_bookings%rowtype;
  m academy_memberships%rowtype; attempt academy_payment_attempts%rowtype; req academy_requests%rowtype;
  pay academy_payments%rowtype; refund academy_refunds%rowtype; event_row academy_webhook_events%rowtype;
  entity uuid; court uuid; customer uuid; start_time timestamptz; end_time timestamptz; day date;
  key_value text; amount integer; refund_amount integer; previous jsonb; result jsonb;
  member boolean; own_name text; source_value text; payment_state text; event_time bigint;
begin
  if p_action='repair_customer' then
    if p_actor is null or not exists(select 1 from auth.users where id=p_actor) then raise exception 'AUTH_REQUIRED'; end if;
    insert into academy_customers(id,email,name,phone) values(p_actor,p_input->>'email',left(coalesce(nullif(p_input->>'name',''),'Academy player'),120),p_input->>'phone')
      on conflict(id) do update set email=excluded.email,name=excluded.name,phone=coalesce(excluded.phone,academy_customers.phone);
  end if;
  if p_actor is not null then select * into actor from academy_customers where id=p_actor; if actor.id is null then raise exception 'AUTH_REQUIRED'; end if; end if;
  if p_action in('session','account','hold','prepare_order','prepare_subscription','cancel_membership') and actor.id is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_action in('schedule','customers','manual_booking','booking_action','block','delete_block','note','attendance','reconciliation') and coalesce(actor.role,'customer') not in('staff','owner') then raise exception 'FORBIDDEN'; end if;
  perform academy_expire();

  if p_action in('session','repair_customer') then
    select * into m from academy_memberships where customer_id=p_actor order by (paid_through>now()) desc nulls last,created_at desc limit 1;
    return jsonb_build_object('user',jsonb_build_object('id',actor.id,'email',actor.email,'name',actor.name,'role',actor.role),'membership',academy_membership_json(m.id));
  elsif p_action='availability' then
    day:=(p_input->>'date')::date;
    if day<(now() at time zone 'Asia/Kolkata')::date or day>=(now() at time zone 'Asia/Kolkata')::date+14 then raise exception 'INVALID_REQUEST'; end if;
    member:=exists(select 1 from academy_memberships where customer_id=p_actor and current_period_start<=now() and paid_through>now());
    return jsonb_build_object('date',day,'timezone','Asia/Kolkata','generatedAt',now(),
      'courts',(select jsonb_agg(jsonb_build_object('id',id,'name',name,'number',number) order by number) from academy_courts),
      'slots',(select jsonb_agg(jsonb_build_object('id',c.id::text||'_'||day::text||'_'||h,'courtId',c.id,'startsAt',(day+make_time(h,0,0)) at time zone 'Asia/Kolkata','endsAt',((day+make_time(h,0,0)) at time zone 'Asia/Kolkata')+interval '1 hour',
        'pricePaise',case when exists(select 1 from academy_memberships where customer_id=p_actor and current_period_start<=((day+make_time(h,0,0)) at time zone 'Asia/Kolkata') and paid_through>((day+make_time(h,0,0)) at time zone 'Asia/Kolkata')) then 40000 else 50000 end,
        'available',((day+make_time(h,0,0)) at time zone 'Asia/Kolkata'>now()) and not exists(select 1 from academy_allocations x where x.court_id=c.id and x.active and tstzrange(x.starts_at,x.ends_at,'[)') && tstzrange((day+make_time(h,0,0)) at time zone 'Asia/Kolkata',((day+make_time(h,0,0)) at time zone 'Asia/Kolkata')+interval '1 hour','[)'))) order by h,c.number)
        from academy_courts c cross join generate_series(6,23) h));
  elsif p_action='account' then
    select * into m from academy_memberships where customer_id=p_actor order by (paid_through>now()) desc nulls last,created_at desc limit 1;
    return jsonb_build_object('user',jsonb_build_object('id',actor.id,'email',actor.email,'name',actor.name,'role',actor.role),
      'bookings',coalesce((select jsonb_agg(academy_booking_json(id) order by created_at desc) from academy_bookings where customer_id=p_actor),'[]'),
      'membership',academy_membership_json(m.id),'attendance',coalesce((select jsonb_agg(jsonb_build_object('id',id,'customerId',customer_id,'date',visit_date,'checkedInAt',checked_in_at) order by visit_date desc) from academy_attendance where customer_id=p_actor),'[]'));
  elsif p_action='schedule' then
    day:=(p_input->>'date')::date;
    return jsonb_build_object('date',day,'courts',(select jsonb_agg(jsonb_build_object('id',id,'name',name,'number',number) order by number) from academy_courts),
      'bookings',coalesce((select jsonb_agg(academy_booking_json(sb.id) order by a.starts_at) from academy_bookings sb join academy_allocations a on a.id=sb.id where(a.starts_at at time zone 'Asia/Kolkata')::date=day),'[]'),
      'blocks',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'courtId',a.court_id,'startsAt',a.starts_at,'endsAt',a.ends_at,'reason',x.reason)) from academy_blocks x join academy_allocations a on a.id=x.id where a.active and tstzrange(a.starts_at,a.ends_at,'[)') && tstzrange(day::timestamp at time zone 'Asia/Kolkata',(day+1)::timestamp at time zone 'Asia/Kolkata','[)')),'[]'),
      'metrics',(select jsonb_build_object('bookingCount',count(*),'collectedPaise',coalesce(sum(case when sb.source='online' then coalesce((select sum(ap.amount_paise) from academy_payments ap where ap.booking_id=sb.id),0) when sb.payment_status in('cash','external','partially_refunded','refunded') then sb.amount_paise else 0 end),0),
        'refundedPaise',coalesce(sum(case when sb.source='online' then coalesce((select sum(ar.amount_paise) from academy_refunds ar where ar.booking_id=sb.id and ar.status='processed'),0) else sb.refunded_paise end),0),'occupiedHours',coalesce(sum(case when a.active and sb.status not in('cancelled','expired') then extract(epoch from(a.ends_at-a.starts_at))/3600 else 0 end),0))
        from academy_bookings sb join academy_allocations a on a.id=sb.id where(a.starts_at at time zone 'Asia/Kolkata')::date=day));
  elsif p_action='customers' then
    return jsonb_build_object('customers',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'email',c.email,'phone',c.phone,
      'note',(select body from academy_notes where customer_id=c.id order by created_at desc limit 1),
      'membership',(select academy_membership_json(id) from academy_memberships where customer_id=c.id order by(paid_through>now()) desc nulls last,created_at desc limit 1),
      'attendance',coalesce((select jsonb_agg(jsonb_build_object('id',id,'customerId',customer_id,'date',visit_date,'checkedInAt',checked_in_at) order by visit_date desc) from academy_attendance where customer_id=c.id),'[]')) order by c.name) from academy_customers c),'[]'));
  elsif p_action='reconciliation' then
    return jsonb_build_object('generatedAt',now(),
      'attempts',coalesce((select jsonb_agg(jsonb_build_object('id',pa.id,'kind',case when pa.booking_id is null then 'membership' else 'court' end,'bookingId',pa.booking_id,'customerName',c.name,'amountPaise',pa.amount_paise,'providerId',pa.provider_id,'status',pa.status,'createdAt',pa.created_at,'lastCheckedAt',pa.last_reconciled_at) order by pa.created_at)
        from academy_payment_attempts pa join academy_customers c on c.id=pa.actor_id where pa.status in('creating','reconcile','ready')),'[]'),
      'refunds',coalesce((select jsonb_agg(jsonb_build_object('id',rf.id,'bookingId',rf.booking_id,'customerName',rb.customer_name,'paymentId',rf.payment_id,'providerRefundId',rf.provider_refund_id,'amountPaise',rf.amount_paise,'status',rf.status,'reason',rf.reason,'createdAt',rf.created_at,'lastCheckedAt',rf.last_reconciled_at) order by rf.created_at)
        from academy_refunds rf join academy_bookings rb on rb.id=rf.booking_id where rf.status in('pending','failed')),'[]'),
      'cancellations',coalesce((select jsonb_agg(jsonb_build_object('id',cm.id,'customerName',c.name,'subscriptionId',cm.subscription_id,'createdAt',cm.created_at,'lastCheckedAt',cm.last_reconciled_at) order by cm.created_at)
        from academy_memberships cm join academy_customers c on c.id=cm.customer_id where cm.cancellation_requested),'[]'),
      'webhooks',jsonb_build_object('failed',(select count(*) from academy_webhook_events where status='failed'),'processing',(select count(*) from academy_webhook_events where status='processing')));
  elsif p_action='note' then
    if length(trim(p_input->>'body')) not between 1 and 2000 then raise exception 'INVALID_REQUEST'; end if;
    insert into academy_notes(customer_id,actor_id,body) values((p_input->>'customerId')::uuid,p_actor,p_input->>'body') returning id into entity;
    insert into academy_audit(actor_id,action,entity_id) values(p_actor,'customer_note',entity); return jsonb_build_object('ok',true);
  elsif p_action='delete_block' then
    entity:=(p_input->>'blockId')::uuid;
    if not exists(select 1 from academy_blocks where id=entity) then raise exception 'NOT_FOUND'; end if;
    update academy_allocations set active=false where id=entity;
    insert into academy_audit(actor_id,action,entity_id) values(p_actor,p_action,entity); return jsonb_build_object('ok',true);
  end if;

  if p_action in('hold','manual_booking','block','booking_action','attendance') then
    key_value:=p_input->>'idempotencyKey';
    if key_value is null or key_value !~ '^[A-Za-z0-9_-]{10,100}$' then raise exception 'INVALID_REQUEST'; end if;
    perform pg_advisory_xact_lock(hashtextextended(p_actor::text||key_value,0));
    select * into req from academy_requests where actor_id=p_actor and request_key=key_value;
    if req.actor_id is not null then
      if req.action<>p_action or req.input<>p_input then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
      if p_action='block' then return jsonb_build_object('block',(select jsonb_build_object('id',x.id,'courtId',a.court_id,'startsAt',a.starts_at,'endsAt',a.ends_at,'reason',x.reason) from academy_blocks x join academy_allocations a on a.id=x.id where x.id=req.entity_id));
      elsif p_action='attendance' then return jsonb_build_object('attendance',(select jsonb_build_object('id',id,'customerId',customer_id,'date',visit_date,'checkedInAt',checked_in_at) from academy_attendance where id=req.entity_id));
      else return jsonb_build_object('booking',academy_booking_json(req.entity_id)); end if;
    end if;
  end if;

  if p_action in('hold','manual_booking','block') then
    if p_action='hold' then
      perform 1 from academy_customers where id=p_actor for update;
      if exists(select 1 from academy_bookings where customer_id=p_actor and status='held' and hold_expires_at>now()) then raise exception 'CONFLICT'; end if;
    end if;
    court:=(p_input->>'courtId')::uuid; start_time:=(p_input->>'startsAt')::timestamptz;
    end_time:=case when p_action='block' then(p_input->>'endsAt')::timestamptz else start_time+interval '1 hour' end;
    day:=(start_time at time zone 'Asia/Kolkata')::date;
    if day<(now() at time zone 'Asia/Kolkata')::date or day>=(now() at time zone 'Asia/Kolkata')::date+14 or end_time<=now() or end_time<=start_time or start_time<((day+time '06:00') at time zone 'Asia/Kolkata') or end_time>((day+1)::timestamp at time zone 'Asia/Kolkata') then raise exception 'INVALID_REQUEST'; end if;
    if p_action<>'block' and date_trunc('hour',start_time at time zone 'Asia/Kolkata')<>(start_time at time zone 'Asia/Kolkata') then raise exception 'INVALID_REQUEST'; end if;
    if p_action='hold' and start_time<=now() then raise exception 'INVALID_REQUEST'; end if;
    perform 1 from academy_courts where id=court for update; if not found then raise exception 'NOT_FOUND'; end if;
    entity:=gen_random_uuid();
    insert into academy_allocations(id,court_id,starts_at,ends_at) values(entity,court,start_time,end_time);
    if p_action='block' then
      if length(trim(p_input->>'reason')) not between 3 and 1000 then raise exception 'INVALID_REQUEST'; end if;
      insert into academy_blocks(id,reason) values(entity,p_input->>'reason');
      result:=jsonb_build_object('block',jsonb_build_object('id',entity,'courtId',court,'startsAt',start_time,'endsAt',end_time,'reason',p_input->>'reason'));
    else
      customer:=case when p_action='hold' then p_actor else nullif(p_input->>'customerId','')::uuid end;
      own_name:=case when p_action='hold' then actor.name else p_input->>'customerName' end;
      if length(trim(own_name)) not between 2 and 120 then raise exception 'INVALID_REQUEST'; end if;
      member:=exists(select 1 from academy_memberships where customer_id=customer and current_period_start<=start_time and paid_through>start_time);
      source_value:=case when p_action='hold' then 'online' else p_input->>'source' end;
      amount:=case when source_value='individual_play' and member then 0 when source_value='individual_play' then 12500 when member then 40000 else 50000 end;
      if p_action='manual_booking' and p_input ? 'amountPaise' and(p_input->>'amountPaise')::integer<>amount then
        if length(trim(coalesce(p_input->>'reason',''))) not between 3 and 1000 then raise exception 'INVALID_REQUEST'; end if;
        amount:=(p_input->>'amountPaise')::integer;
      end if;
      if amount not between 0 and 500000 then raise exception 'INVALID_REQUEST'; end if;
      payment_state:=case when p_action='hold' then 'pending' else coalesce(p_input->>'paymentStatus','pending') end;
      if p_action='manual_booking' and payment_state not in('pending','cash','external','not_required') then raise exception 'INVALID_REQUEST'; end if;
      if source_value in('playo','hudle','district') and length(trim(coalesce(p_input->>'reference','')))=0 then raise exception 'INVALID_REQUEST'; end if;
      if p_action='manual_booking' and payment_state in('cash','external','not_required') and length(trim(coalesce(p_input->>'reference','')))=0 and length(trim(coalesce(p_input->>'reason','')))<3 then raise exception 'INVALID_REQUEST'; end if;
      if source_value='individual_play' and amount=0 then
        if not member or day<>(now() at time zone 'Asia/Kolkata')::date then raise exception 'MEMBER_REQUIRED'; end if;
        select * into m from academy_memberships where customer_id=customer and current_period_start<=now() and paid_through>now() order by paid_through desc limit 1 for update;
        if exists(select 1 from academy_attendance where customer_id=customer and visit_date=day) then raise exception 'BENEFIT_USED'; end if;
        insert into academy_attendance(membership_id,customer_id,visit_date) values(m.id,customer,day);
        payment_state:='not_required';
      end if;
      insert into academy_bookings(id,customer_id,customer_name,status,payment_status,amount_paise,hold_expires_at,source,reference,reason)
        values(entity,customer,own_name,case when p_action='hold' then 'held' else 'confirmed' end,payment_state,amount,case when p_action='hold' then now()+interval '10 minutes' end,source_value,p_input->>'reference',p_input->>'reason');
      result:=jsonb_build_object('booking',academy_booking_json(entity));
    end if;
  elsif p_action='booking_action' then
    entity:=(p_input->>'bookingId')::uuid; select * into b from academy_bookings where id=entity for update;
    if b.id is null then raise exception 'NOT_FOUND'; end if;
    select starts_at into start_time from academy_allocations where id=entity;
    if p_input->>'action'='check_in' and start_time>now()+interval '15 minutes' then raise exception 'INVALID_TRANSITION'; end if;
    if p_input->>'action' in('complete','no_show') and start_time>now() then raise exception 'INVALID_TRANSITION'; end if;
    if p_input->>'action'='cancel' then
      if length(trim(coalesce(p_input->>'reason',''))) not between 3 and 1000 then raise exception 'INVALID_REQUEST'; end if;
      if b.status not in('held','confirmed','checked_in') then raise exception 'INVALID_TRANSITION'; end if;
      refund_amount:=coalesce((p_input->>'refundPaise')::integer,0);
      if refund_amount<0 or refund_amount>b.amount_paise-b.refunded_paise then raise exception 'INVALID_REQUEST'; end if;
      if refund_amount>0 and b.payment_status not in('paid','cash','external') then raise exception 'INVALID_TRANSITION'; end if;
      update academy_bookings set status='cancelled',reason=p_input->>'reason' where id=entity;
      update academy_allocations set active=false where id=entity;
      if refund_amount>0 then
        if b.source='online' then
          select * into pay from academy_payments where booking_id=entity and not refund_required limit 1;
          if pay.provider_payment_id is null then raise exception 'INVALID_TRANSITION'; end if;
          insert into academy_refunds(booking_id,payment_id,amount_paise,reason) values(entity,pay.provider_payment_id,refund_amount,p_input->>'reason');
          update academy_bookings set payment_status='refund_pending' where id=entity;
        else
          update academy_bookings set refunded_paise=refunded_paise+refund_amount,payment_status=case when refunded_paise+refund_amount=amount_paise then 'refunded' else 'partially_refunded' end where id=entity;
        end if;
      end if;
    elsif p_input->>'action'='check_in' and b.status='confirmed' then update academy_bookings set status='checked_in' where id=entity;
    elsif p_input->>'action'='complete' and b.status in('confirmed','checked_in') then update academy_bookings set status='completed' where id=entity;
    elsif p_input->>'action'='no_show' and b.status='confirmed' then update academy_bookings set status='no_show' where id=entity;
    else raise exception 'INVALID_TRANSITION'; end if;
    result:=jsonb_build_object('booking',academy_booking_json(entity));
  elsif p_action='attendance' then
    customer:=(p_input->>'customerId')::uuid; day:=(p_input->>'date')::date;
    if day<>(now() at time zone 'Asia/Kolkata')::date then raise exception 'INVALID_REQUEST'; end if;
    select * into m from academy_memberships where customer_id=customer and current_period_start<=now() and paid_through>now() order by paid_through desc limit 1 for update;
    if m.id is null then raise exception 'MEMBER_REQUIRED'; end if;
    insert into academy_attendance(membership_id,customer_id,visit_date) values(m.id,customer,day)
      on conflict(customer_id,visit_date) do update set customer_id=excluded.customer_id returning id into entity;
    result:=jsonb_build_object('attendance',(select jsonb_build_object('id',id,'customerId',customer_id,'date',visit_date,'checkedInAt',checked_in_at) from academy_attendance where id=entity));
  end if;
  if result is not null then
    insert into academy_requests values(p_actor,key_value,p_action,p_input,entity);
    insert into academy_audit(actor_id,action,entity_id,detail) values(p_actor,p_action,entity,p_input);
    return result;
  end if;

  if p_action in('prepare_order','prepare_subscription') then
    key_value:=p_input->>'idempotencyKey';
    if key_value is null or key_value !~ '^[A-Za-z0-9_-]{10,100}$' then raise exception 'INVALID_REQUEST'; end if;
    perform pg_advisory_xact_lock(hashtextextended(p_actor::text||key_value,0));
    select * into req from academy_requests where actor_id=p_actor and request_key=key_value;
    if req.actor_id is not null and(req.action<>p_action or req.input<>p_input) then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
  end if;
  if p_action='prepare_order' then
    entity:=(p_input->>'bookingId')::uuid;
    select * into b from academy_bookings where id=entity and customer_id=p_actor for update;
    if b.id is null then raise exception 'NOT_FOUND'; end if;
    if b.status<>'held' or b.hold_expires_at<=now() then raise exception 'HOLD_EXPIRED'; end if;
    select * into attempt from academy_payment_attempts where booking_id=entity;
    if attempt.id is null then
      insert into academy_payment_attempts(booking_id,actor_id,amount_paise) values(entity,p_actor,b.amount_paise) returning * into attempt;
      insert into academy_requests values(p_actor,key_value,p_action,p_input,attempt.id);
      return to_jsonb(attempt)||jsonb_build_object('create',true);
    end if;
    if attempt.status='ready' then
      insert into academy_requests values(p_actor,key_value,p_action,p_input,attempt.id) on conflict do nothing;
      return to_jsonb(attempt)||jsonb_build_object('create',false);
    end if;
    if attempt.status='creating' and attempt.created_at>now()-interval '30 seconds' then raise exception 'PAYMENT_IN_PROGRESS'; end if;
    raise exception 'RECONCILIATION_REQUIRED';
  elsif p_action='prepare_subscription' then
    perform 1 from academy_customers where id=p_actor for update;
    if req.actor_id is not null then
      select * into attempt from academy_payment_attempts where id=req.entity_id;
      select * into m from academy_memberships where id=attempt.membership_id;
      if m.status<>'pending' then raise exception 'INVALID_TRANSITION'; end if;
    else
    select * into m from academy_memberships where customer_id=p_actor and status in('pending','active','past_due') for update;
    end if;
    if m.id is not null and(m.paid_through>now() or m.cancellation_requested or m.status='past_due') then raise exception 'INVALID_TRANSITION'; end if;
    if m.id is null then insert into academy_memberships(customer_id) values(p_actor) returning * into m; end if;
    select * into attempt from academy_payment_attempts where membership_id=m.id;
    if attempt.id is null then
      insert into academy_payment_attempts(membership_id,actor_id,amount_paise) values(m.id,p_actor,250000) returning * into attempt;
      insert into academy_requests values(p_actor,key_value,p_action,p_input,attempt.id);
      return to_jsonb(attempt)||jsonb_build_object('create',true);
    end if;
    if attempt.status='ready' then
      insert into academy_requests values(p_actor,key_value,p_action,p_input,attempt.id) on conflict do nothing;
      return to_jsonb(attempt)||jsonb_build_object('create',false);
    end if;
    if attempt.status='creating' and attempt.created_at>now()-interval '30 seconds' then raise exception 'PAYMENT_IN_PROGRESS'; end if;
    raise exception 'RECONCILIATION_REQUIRED';
  elsif p_action='attach_provider' then
    select * into attempt from academy_payment_attempts where id=(p_input->>'attemptId')::uuid for update;
    if attempt.id is null or(p_input->>'amountPaise')::integer<>attempt.amount_paise then raise exception 'INVALID_REQUEST'; end if;
    if attempt.provider_id is not null and attempt.provider_id<>p_input->>'providerId' then raise exception 'CONFLICT'; end if;
    update academy_payment_attempts set provider_id=p_input->>'providerId',status='ready' where id=attempt.id;
    if attempt.membership_id is not null then update academy_memberships set subscription_id=p_input->>'providerId' where id=attempt.membership_id; end if;
    return jsonb_build_object('ok',true);
  elsif p_action='mark_reconcile' then
    update academy_payment_attempts set status='reconcile' where id=(p_input->>'attemptId')::uuid and provider_id is null; return jsonb_build_object('ok',true);
  elsif p_action='order_mapping' then
    select * into attempt from academy_payment_attempts where booking_id=(p_input->>'bookingId')::uuid and actor_id=p_actor;
    if attempt.id is null or attempt.provider_id is null then raise exception 'NOT_FOUND'; end if;
    return to_jsonb(attempt);
  elsif p_action='provider_mapping' then
    select * into attempt from academy_payment_attempts where provider_id=p_input->>'providerId';
    return case when attempt.id is null then null else to_jsonb(attempt) end;
  elsif p_action='settle_payment' then
    select * into attempt from academy_payment_attempts where provider_id=p_input->>'orderId' and booking_id is not null for update;
    if attempt.id is null or attempt.amount_paise<>(p_input->>'amountPaise')::integer then raise exception 'INVALID_REQUEST'; end if;
    select * into b from academy_bookings where id=attempt.booking_id for update;
    select * into pay from academy_payments where provider_payment_id=p_input->>'paymentId';
    if pay.provider_payment_id is not null then
      if pay.booking_id is distinct from b.id then raise exception 'CONFLICT'; end if;
      return jsonb_build_object('booking',academy_booking_json(b.id));
    end if;
    -- A different captured payment on the same booking is also refunded, never double-settled.
    member:=b.status='held' and b.hold_expires_at>now() and not exists(select 1 from academy_payments where booking_id=b.id and not refund_required);
    insert into academy_payments(provider_payment_id,provider_order_id,booking_id,amount_paise,captured_at,refund_required)
      values(p_input->>'paymentId',attempt.provider_id,b.id,attempt.amount_paise,(p_input->>'capturedAt')::timestamptz,not member);
    if member then
      update academy_bookings set status='confirmed',payment_status='paid',hold_expires_at=null where id=b.id;
      update academy_payment_attempts set status='paid' where id=attempt.id;
    else
      insert into academy_refunds(booking_id,payment_id,amount_paise,reason) values(b.id,p_input->>'paymentId',attempt.amount_paise,'Payment captured after reservation expired or already settled');
      if b.status in('expired','cancelled') then update academy_bookings set payment_status='refund_pending' where id=b.id; end if;
    end if;
    insert into academy_audit(action,entity_id,detail) values('gateway_capture',b.id,jsonb_build_object('paymentId',p_input->>'paymentId','late',not member));
    return jsonb_build_object('booking',academy_booking_json(b.id));
  elsif p_action='subscription_charge' then
    select * into m from academy_memberships where subscription_id=p_input->>'subscriptionId' for update;
    if m.id is null then raise exception 'NOT_FOUND'; end if;
    start_time:=(p_input->>'periodStart')::timestamptz; end_time:=(p_input->>'periodEnd')::timestamptz;
    if(p_input->>'amountPaise')::integer<>250000 or end_time<=start_time or start_time>now()+interval '5 minutes' then raise exception 'INVALID_REQUEST'; end if;
    select * into pay from academy_payments where provider_payment_id=p_input->>'paymentId';
    if pay.provider_payment_id is not null then
      if pay.membership_id is distinct from m.id then raise exception 'CONFLICT'; end if;
      return jsonb_build_object('membership',academy_membership_json(m.id));
    end if;
    insert into academy_payments(provider_payment_id,membership_id,amount_paise,captured_at,period_start,period_end) values(p_input->>'paymentId',m.id,250000,(p_input->>'capturedAt')::timestamptz,start_time,end_time);
    -- Older paid invoices must not replace the current paid period.
    update academy_memberships set current_period_start=case when paid_through is null or paid_through<end_time then start_time else current_period_start end,
      paid_through=greatest(coalesce(paid_through,end_time),end_time),status=case when end_time>now() then 'active' else status end where id=m.id;
    update academy_payment_attempts set status='paid' where membership_id=m.id;
    insert into academy_audit(action,entity_id,detail) values('membership_charge',m.id,jsonb_build_object('paymentId',p_input->>'paymentId','periodEnd',end_time));
    return jsonb_build_object('membership',academy_membership_json(m.id));
  elsif p_action='subscription_reversal' then
    select * into pay from academy_payments where provider_payment_id=p_input->>'paymentId' for update;
    if pay.membership_id is null then return jsonb_build_object('ignored',true); end if;
    refund_amount:=(p_input->>'refundedPaise')::integer;
    if refund_amount<=0 or refund_amount>pay.amount_paise then raise exception 'INVALID_REQUEST'; end if;
    select * into m from academy_memberships where id=pay.membership_id for update;
    update academy_payments set refunded_paise=greatest(refunded_paise,refund_amount) where provider_payment_id=pay.provider_payment_id;
    select period_start,period_end into start_time,end_time from academy_payments where membership_id=m.id and refunded_paise=0 order by period_end desc limit 1;
    update academy_memberships set current_period_start=start_time,paid_through=end_time,status=case when end_time>now() then 'active' when cancel_at_period_end then 'cancelled' else 'past_due' end where id=m.id;
    insert into academy_audit(action,entity_id,detail) values('membership_payment_reversed',m.id,jsonb_build_object('paymentId',pay.provider_payment_id,'refundedPaise',refund_amount));
    return jsonb_build_object('membership',academy_membership_json(m.id));
  elsif p_action='membership_state' then
    select * into m from academy_memberships where subscription_id=p_input->>'subscriptionId' for update;
    if m.id is null then return jsonb_build_object('ignored',true); end if;
    event_time:=(p_input->>'eventTime')::bigint;
    if event_time<m.provider_updated_at then return jsonb_build_object('ignored',true); end if;
    update academy_memberships set provider_updated_at=event_time,
      cancel_at_period_end=cancel_at_period_end or p_input->>'state' in('cancelled','completed'),
      status=case when paid_through>now() then 'active' when p_input->>'state' in('cancelled','completed') then 'cancelled' when p_input->>'state' in('halted','pending','paused') then 'past_due' else status end where id=m.id;
    return jsonb_build_object('membership',academy_membership_json(m.id));
  elsif p_action='cancel_membership' then
    select * into m from academy_memberships where customer_id=p_actor and(not(p_input ? 'membershipId') or id=(p_input->>'membershipId')::uuid) order by created_at desc limit 1 for update;
    if m.id is null then raise exception 'NOT_FOUND'; end if;
    if not coalesce((p_input->>'providerConfirmed')::boolean,false) then
      if not m.cancel_at_period_end then update academy_memberships set cancellation_requested=true where id=m.id; end if;
      return to_jsonb(m);
    end if;
    update academy_memberships set cancel_at_period_end=true,cancellation_requested=false,status=case when paid_through>now() then 'active' else 'cancelled' end where id=m.id;
    insert into academy_audit(actor_id,action,entity_id) values(p_actor,p_action,m.id);
    return jsonb_build_object('membership',academy_membership_json(m.id));
  elsif p_action='refund_finish' then
    select * into refund from academy_refunds where id=(p_input->>'refundId')::uuid for update;
    if refund.id is null then raise exception 'NOT_FOUND'; end if;
    if refund.status='processed' then return jsonb_build_object('ok',true); end if;
    if(p_input->>'amountPaise')::integer<>refund.amount_paise or p_input->>'paymentId'<>refund.payment_id then raise exception 'INVALID_REQUEST'; end if;
    update academy_refunds set provider_refund_id=p_input->>'providerRefundId',status=case when p_input->>'status'='processed' then 'processed' when p_input->>'status'='failed' then 'failed' else 'pending' end where id=refund.id;
    if p_input->>'status'='processed' then
      select * into pay from academy_payments where provider_payment_id=refund.payment_id;
      if not pay.refund_required then
        update academy_bookings set refunded_paise=refunded_paise+refund.amount_paise,payment_status=case when refunded_paise+refund.amount_paise=amount_paise then 'refunded' else 'partially_refunded' end where id=refund.booking_id;
      elsif not exists(select 1 from academy_payments where booking_id=refund.booking_id and not refund_required) then
        update academy_bookings set refunded_paise=least(amount_paise,refund.amount_paise),payment_status='refunded' where id=refund.booking_id;
      end if;
      insert into academy_audit(action,entity_id,detail) values('refund_processed',refund.booking_id,jsonb_build_object('refundId',refund.id,'amountPaise',refund.amount_paise));
    end if;
    return jsonb_build_object('ok',true);
  elsif p_action='refund_lookup' then
    return(select to_jsonb(r) from academy_refunds r where provider_refund_id=p_input->>'providerRefundId');
  elsif p_action='claim_event' then
    perform pg_advisory_xact_lock(hashtextextended(p_input->>'eventId',1));
    select * into event_row from academy_webhook_events where id=p_input->>'eventId' for update;
    if event_row.id is not null then
      if event_row.body_hash<>p_input->>'bodyHash' then raise exception 'CONFLICT'; end if;
      if event_row.status='processed' then return jsonb_build_object('claimed',false,'processed',true); end if;
      if event_row.status='processing' and event_row.lease_until>now() then return jsonb_build_object('claimed',false,'processed',false); end if;
      update academy_webhook_events set status='processing',lease_until=now()+interval '30 seconds',attempts=attempts+1 where id=event_row.id;
    else insert into academy_webhook_events(id,body_hash,payload) values(p_input->>'eventId',p_input->>'bodyHash',p_input->'payload'); end if;
    return jsonb_build_object('claimed',true);
  elsif p_action='finish_event' then
    update academy_webhook_events set status=case when(p_input->>'success')::boolean then 'processed' else 'failed' end,processed_at=case when(p_input->>'success')::boolean then now() end,
      next_attempt_at=now()+make_interval(secs=>least(power(2,least(attempts,12)),3600)::integer) where id=p_input->>'eventId';
    return jsonb_build_object('ok',true);
  elsif p_action='job_checked' then
    entity:=(p_input->>'id')::uuid;
    if p_input->>'kind'='attempt' then update academy_payment_attempts set last_reconciled_at=now() where id=entity;
    elsif p_input->>'kind'='membership' then update academy_memberships set last_reconciled_at=now() where id=entity;
    elsif p_input->>'kind'='refund' then update academy_refunds set last_reconciled_at=now() where id=entity;
    else raise exception 'INVALID_REQUEST'; end if;
    return jsonb_build_object('ok',true);
  elsif p_action='jobs' then
    return jsonb_build_object('attempts',coalesce((select jsonb_agg(to_jsonb(x)) from(select * from academy_payment_attempts where status in('creating','reconcile') and created_at<now()-interval '30 seconds' order by last_reconciled_at nulls first,created_at limit 10)x),'[]'),
      'refunds',coalesce((select jsonb_agg(to_jsonb(x)) from(select * from academy_refunds where status='pending' order by last_reconciled_at nulls first,created_at limit 10)x),'[]'),
      'events',coalesce((select jsonb_agg(to_jsonb(x)) from(select * from academy_webhook_events where(status='failed' and next_attempt_at<=now()) or(status='processing' and lease_until<=now()) order by next_attempt_at limit 10)x),'[]'),
      'subscriptions',coalesce((select jsonb_agg(to_jsonb(x)) from(select * from academy_memberships where subscription_id is not null and(status in('active','pending','past_due','expired') or paid_through>now()) order by last_reconciled_at nulls first,created_at limit 10)x),'[]'),
      'cancellations',coalesce((select jsonb_agg(to_jsonb(x)) from(select * from academy_memberships where cancellation_requested and subscription_id is not null order by last_reconciled_at nulls first,created_at limit 10)x),'[]'),
      'orders',coalesce((select jsonb_agg(to_jsonb(x)) from(select * from academy_payment_attempts where booking_id is not null and status='ready' order by last_reconciled_at nulls first,created_at limit 10)x),'[]'));
  elsif p_action='booking_read' then
    entity:=(p_input->>'bookingId')::uuid;
    if p_actor is not null and not exists(select 1 from academy_bookings where id=entity and customer_id=p_actor) and actor.role not in('owner','staff') then raise exception 'NOT_FOUND'; end if;
    return jsonb_build_object('booking',academy_booking_json(entity));
  elsif p_action='expire' then return jsonb_build_object('ok',true);
  end if;
  raise exception 'INVALID_REQUEST';
end $$;

revoke all on function public.academy_booking_json(uuid), public.academy_membership_json(uuid), public.academy_expire(), public.academy_dispatch(text,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.academy_booking_json(uuid), public.academy_membership_json(uuid), public.academy_expire(), public.academy_dispatch(text,jsonb,uuid) to service_role;

-- If deployed to an older project, the old public SECURITY DEFINER RPCs must
-- remain unreachable even if someone calls its Data API directly.
do $$ declare f record; t record; begin
  for f in select oid::regprocedure as signature from pg_proc where pronamespace='public'::regnamespace and (proname in('book_slot_for_current_user','cancel_booking_for_current_user','confirm_booking_from_stripe','create_booking_hold_for_current_user','expire_stale_booking_holds','bootstrap_sideout_for_current_user','bootstrap_sideout_demo_for_current_user') or proname like '%_as_admin' or proname='log_operator_activity') loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
  end loop;
  for t in select tablename from pg_tables where schemaname='public' and tablename in('bookings','booking_payments','booking_holds','wallet_ledger_entries','customer_packs','customer_memberships','admin_roles','users','customer_profiles','offers','offer_redemptions','payments','stripe_checkout_sessions','stripe_webhook_events') loop
    execute format('revoke insert,update,delete on public.%I from anon,authenticated',t.tablename);
  end loop;
end $$;
