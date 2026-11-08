create table if not exists public.provisioning_attempts (
  id uuid primary key default gen_random_uuid(),
  service_instance_id uuid not null references public.service_instances(id) on delete cascade,
  attempt_no integer not null,
  provider text not null,
  status text not null check (status in ('started', 'succeeded', 'failed')),
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  unique(service_instance_id, attempt_no)
);

create index if not exists provisioning_attempts_instance_idx
  on public.provisioning_attempts(service_instance_id, created_at desc);

alter table public.provisioning_attempts enable row level security;

create policy "Customers can read own provisioning attempts"
  on public.provisioning_attempts for select
  using (
    exists (
      select 1
      from public.service_instances si
      where si.id = provisioning_attempts.service_instance_id
        and si.user_id = auth.uid()
    )
  );

create or replace function public.next_provisioning_attempt(p_service_instance_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_no integer;
begin
  select coalesce(max(attempt_no), 0) + 1
    into next_no
  from public.provisioning_attempts
  where service_instance_id = p_service_instance_id;
  return next_no;
end;
$$;

grant execute on function public.next_provisioning_attempt(uuid) to service_role;
