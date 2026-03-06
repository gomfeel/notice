-- Allow each requester to insert its own user row
-- Needed for first-write bootstrap when using x-notice-user-id or auth.uid()

drop policy if exists "users_insert_own" on public.users;

create policy "users_insert_own"
on public.users for insert
with check (public.notice_request_user_id() = id);
