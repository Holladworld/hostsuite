create or replace function public.begin_service_provisioning(p_service_instance_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_no integer;
  provider_name text;
begin
  update public.service_instances
  set status = 'provisioning', last_error = null
  where id = p_service_instance_id
    and status in ('paid', 'provisioning_failed')
  returning coalesce(provider, 'unconfigured') into provider_name;

  if not found then
    return null;
  end if;

  select coalesce(max(attempt_no), 0) + 1
    into next_no
  from public.provisioning_attempts
  where service_instance_id = p_service_instance_id;

  insert into public.provisioning_attempts(service_instance_id, attempt_no, provider, status)
  values (p_service_instance_id, next_no, provider_name, 'started');

  return next_no;
end;
$$;

grant execute on function public.begin_service_provisioning(uuid) to service_role;
