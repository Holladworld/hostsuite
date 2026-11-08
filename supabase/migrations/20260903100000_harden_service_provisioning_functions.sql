revoke all on function public.create_service_instances_for_order(uuid) from public;
revoke all on function public.create_service_instances_for_order(uuid) from anon;
revoke all on function public.create_service_instances_for_order(uuid) from authenticated;
grant execute on function public.create_service_instances_for_order(uuid) to service_role;

revoke all on function public.next_provisioning_attempt(uuid) from public;
revoke all on function public.next_provisioning_attempt(uuid) from anon;
revoke all on function public.next_provisioning_attempt(uuid) from authenticated;
grant execute on function public.next_provisioning_attempt(uuid) to service_role;

revoke all on function public.begin_service_provisioning(uuid) from public;
revoke all on function public.begin_service_provisioning(uuid) from anon;
revoke all on function public.begin_service_provisioning(uuid) from authenticated;
grant execute on function public.begin_service_provisioning(uuid) to service_role;
