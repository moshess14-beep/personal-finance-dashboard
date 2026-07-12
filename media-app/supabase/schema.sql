-- הרצה חד-פעמית: פותחים את הפרויקט ב-supabase.com → SQL Editor → מדביקים הכול → Run.
-- כל טבלה מוגנת ב-Row Level Security כך שכל משתמש רואה ורושם רק את הנתונים שלו.

create table if not exists public.items (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.items enable row level security;

create policy if not exists "items: owner read" on public.items
  for select using (auth.uid() = user_id);
create policy if not exists "items: owner insert" on public.items
  for insert with check (auth.uid() = user_id);
create policy if not exists "items: owner update" on public.items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "items: owner delete" on public.items
  for delete using (auth.uid() = user_id);

create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy if not exists "settings: owner read" on public.settings
  for select using (auth.uid() = user_id);
create policy if not exists "settings: owner upsert" on public.settings
  for insert with check (auth.uid() = user_id);
create policy if not exists "settings: owner update" on public.settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- אחסון תמונות (צילומי המסך שהועלו) — bucket פרטי, כל משתמש רואה רק תיקייה בשם ה-user id שלו
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', false)
on conflict (id) do nothing;

create policy if not exists "item-images: owner read" on storage.objects
  for select using (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy if not exists "item-images: owner write" on storage.objects
  for insert with check (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy if not exists "item-images: owner delete" on storage.objects
  for delete using (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- מאפשר לכל המכשירים לקבל עדכונים חיים כשמשהו משתנה (Realtime)
alter publication supabase_realtime add table public.items;
