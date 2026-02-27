-- Enable RLS
alter table public.users enable row level security;
alter table public.folders enable row level security;
alter table public.links enable row level security;
alter table public.tasks enable row level security;

-- users policies
create policy "users_select_own"
on public.users for select
using (auth.uid() = id);

create policy "users_update_own"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- folders policies
create policy "folders_select_own"
on public.folders for select
using (auth.uid() = user_id);

create policy "folders_insert_own"
on public.folders for insert
with check (auth.uid() = user_id);

create policy "folders_update_own"
on public.folders for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "folders_delete_own"
on public.folders for delete
using (auth.uid() = user_id);

-- links policies
create policy "links_select_own"
on public.links for select
using (
  exists (
    select 1
    from public.folders f
    where f.id = links.folder_id
      and f.user_id = auth.uid()
  )
);

create policy "links_insert_own"
on public.links for insert
with check (
  folder_id is null
  or exists (
    select 1
    from public.folders f
    where f.id = links.folder_id
      and f.user_id = auth.uid()
  )
);

create policy "links_update_own"
on public.links for update
using (
  folder_id is null
  or exists (
    select 1
    from public.folders f
    where f.id = links.folder_id
      and f.user_id = auth.uid()
  )
)
with check (
  folder_id is null
  or exists (
    select 1
    from public.folders f
    where f.id = links.folder_id
      and f.user_id = auth.uid()
  )
);

create policy "links_delete_own"
on public.links for delete
using (
  folder_id is null
  or exists (
    select 1
    from public.folders f
    where f.id = links.folder_id
      and f.user_id = auth.uid()
  )
);

-- tasks policies
create policy "tasks_select_own"
on public.tasks for select
using (auth.uid() = user_id);

create policy "tasks_insert_own"
on public.tasks for insert
with check (auth.uid() = user_id);

create policy "tasks_update_own"
on public.tasks for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "tasks_delete_own"
on public.tasks for delete
using (auth.uid() = user_id);