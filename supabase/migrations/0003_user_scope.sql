-- Transitional user-scope migration
-- 목적:
-- 1) links 테이블에 user_id를 명시적으로 저장
-- 2) 인증 세션(auth.uid) 또는 x-notice-user-id 헤더 기반으로 RLS 동작

alter table public.links
  add column if not exists user_id uuid;

-- 기존 데이터 백필: folder_id를 통해 소유자 추론
update public.links l
set user_id = f.user_id
from public.folders f
where l.folder_id = f.id
  and l.user_id is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'links_user_id_fkey'
      and conrelid = 'public.links'::regclass
  ) then
    alter table public.links
      add constraint links_user_id_fkey
      foreign key (user_id)
      references public.users(id)
      on delete cascade;
  end if;
end$$;

create index if not exists idx_links_user_id on public.links(user_id);

-- 요청 컨텍스트에서 사용자 ID 추출:
-- 1순위 auth.uid(), 2순위 x-notice-user-id 헤더(UUID 형식일 때만)
create or replace function public.notice_request_user_id()
returns uuid
language sql
stable
as $$
  select coalesce(
    auth.uid(),
    (
      case
        when (current_setting('request.headers', true)::jsonb ->> 'x-notice-user-id')
             ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then (current_setting('request.headers', true)::jsonb ->> 'x-notice-user-id')::uuid
        else null
      end
    )
  );
$$;

grant execute on function public.notice_request_user_id() to anon, authenticated;

-- 기존 정책 재정의
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "folders_select_own" on public.folders;
drop policy if exists "folders_insert_own" on public.folders;
drop policy if exists "folders_update_own" on public.folders;
drop policy if exists "folders_delete_own" on public.folders;
drop policy if exists "links_select_own" on public.links;
drop policy if exists "links_insert_own" on public.links;
drop policy if exists "links_update_own" on public.links;
drop policy if exists "links_delete_own" on public.links;
drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_delete_own" on public.tasks;

-- users
create policy "users_select_own"
on public.users for select
using (public.notice_request_user_id() = id);

create policy "users_update_own"
on public.users for update
using (public.notice_request_user_id() = id)
with check (public.notice_request_user_id() = id);

-- folders
create policy "folders_select_own"
on public.folders for select
using (public.notice_request_user_id() = user_id);

create policy "folders_insert_own"
on public.folders for insert
with check (public.notice_request_user_id() = user_id);

create policy "folders_update_own"
on public.folders for update
using (public.notice_request_user_id() = user_id)
with check (public.notice_request_user_id() = user_id);

create policy "folders_delete_own"
on public.folders for delete
using (public.notice_request_user_id() = user_id);

-- links
create policy "links_select_own"
on public.links for select
using (public.notice_request_user_id() = user_id);

create policy "links_insert_own"
on public.links for insert
with check (
  public.notice_request_user_id() = user_id
  and (
    folder_id is null
    or exists (
      select 1
      from public.folders f
      where f.id = links.folder_id
        and f.user_id = links.user_id
    )
  )
);

create policy "links_update_own"
on public.links for update
using (public.notice_request_user_id() = user_id)
with check (
  public.notice_request_user_id() = user_id
  and (
    folder_id is null
    or exists (
      select 1
      from public.folders f
      where f.id = links.folder_id
        and f.user_id = links.user_id
    )
  )
);

create policy "links_delete_own"
on public.links for delete
using (public.notice_request_user_id() = user_id);

-- tasks
create policy "tasks_select_own"
on public.tasks for select
using (public.notice_request_user_id() = user_id);

create policy "tasks_insert_own"
on public.tasks for insert
with check (public.notice_request_user_id() = user_id);

create policy "tasks_update_own"
on public.tasks for update
using (public.notice_request_user_id() = user_id)
with check (public.notice_request_user_id() = user_id);

create policy "tasks_delete_own"
on public.tasks for delete
using (public.notice_request_user_id() = user_id);
