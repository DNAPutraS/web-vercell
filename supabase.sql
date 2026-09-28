create table posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  created_at timestamptz default now()
);
create table post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  path text not null,
  url text not null,
  position int default 0
);

alter table posts enable row level security;
alter table post_images enable row level security;

create policy "publik boleh lihat postingan" on posts for select using (true);
create policy "admin kelola postingan" on posts for all to authenticated using (true) with check (true);
create policy "publik boleh lihat gambar" on post_images for select using (true);
create policy "admin kelola gambar" on post_images for all to authenticated using (true) with check (true);

insert into storage.buckets (id, name, public) values ('images', 'images', true) on conflict do nothing;
create policy "publik boleh lihat file" on storage.objects for select using (bucket_id = 'images');
create policy "admin kelola file" on storage.objects for all to authenticated
  using (bucket_id = 'images') with check (bucket_id = 'images');
