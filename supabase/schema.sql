create extension if not exists citext;

create table if not exists admin_users (
  email citext primary key,
  role text not null default 'demo' check (role in ('superadmin', 'admin', 'demo')),
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function current_admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from admin_users where email = (auth.jwt() ->> 'email')::citext;
$$;

create or replace function is_staff()
returns boolean
language sql
stable
as $$
  select current_admin_role() is not null;
$$;

create or replace function can_edit()
returns boolean
language sql
stable
as $$
  select current_admin_role() in ('superadmin', 'admin');
$$;

create or replace function is_superadmin()
returns boolean
language sql
stable
as $$
  select current_admin_role() = 'superadmin';
$$;

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null then
    return new;
  end if;

  insert into admin_users (email, role)
  values (new.email, 'demo')
  on conflict (email) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null default 'other' check (kind in ('driver', 'team', 'circuit', 'other')),
  created_at timestamptz not null default now()
);

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  lead text,
  body text not null default '',
  cover_url text,
  category_id uuid references categories (id) on delete set null,
  author_email citext references admin_users (email) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'review', 'published')),
  featured boolean not null default false,
  reading_minutes integer,
  views integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector(
      'hungarian',
      coalesce(title, '') || ' ' || coalesce(lead, '') || ' ' || coalesce(body, '')
    )
  ) stored
);

create table if not exists article_tags (
  article_id uuid not null references articles (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (article_id, tag_id)
);

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  youtube_id text not null unique,
  title text not null,
  duration text,
  views integer not null default 0,
  published_at timestamptz,
  featured boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists races (
  id uuid primary key default gen_random_uuid(),
  series text not null default 'f1',
  name text not null,
  circuit text,
  country text,
  starts_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists site_settings (
  id boolean primary key default true check (id),
  sections_order jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists articles_published_idx
  on articles (published_at desc)
  where status = 'published';

create index if not exists articles_category_idx on articles (category_id);
create index if not exists articles_search_idx on articles using gin (search_vector);
create index if not exists article_tags_tag_idx on article_tags (tag_id);
create index if not exists videos_published_idx on videos (published_at desc);
create index if not exists races_starts_idx on races (starts_at);

drop trigger if exists articles_set_updated_at on articles;
create trigger articles_set_updated_at
  before update on articles
  for each row execute function set_updated_at();

drop trigger if exists site_settings_set_updated_at on site_settings;
create trigger site_settings_set_updated_at
  before update on site_settings
  for each row execute function set_updated_at();

create or replace function enforce_publish_rights()
returns trigger
language plpgsql
as $$
begin
  if auth.jwt() is null or (auth.jwt() ->> 'role') = 'service_role' then
    return new;
  end if;

  if new.status = 'published'
    and (tg_op = 'INSERT' or old.status is distinct from 'published')
    and not is_superadmin()
  then
    raise exception 'Publikalni csak superadmin tud.' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists articles_enforce_publish_rights on articles;
create trigger articles_enforce_publish_rights
  before insert or update on articles
  for each row execute function enforce_publish_rights();

create or replace function increment_article_views(article_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update articles
  set views = views + 1
  where slug = article_slug and status = 'published';
$$;

alter table admin_users enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table articles enable row level security;
alter table article_tags enable row level security;
alter table videos enable row level security;
alter table races enable row level security;
alter table site_settings enable row level security;

drop policy if exists admin_users_read on admin_users;
create policy admin_users_read on admin_users
  for select using (is_staff());

drop policy if exists admin_users_write on admin_users;
create policy admin_users_write on admin_users
  for all using (is_superadmin()) with check (is_superadmin());

drop policy if exists categories_read on categories;
create policy categories_read on categories
  for select using (true);

drop policy if exists categories_write on categories;
create policy categories_write on categories
  for all using (can_edit()) with check (can_edit());

drop policy if exists tags_read on tags;
create policy tags_read on tags
  for select using (true);

drop policy if exists tags_write on tags;
create policy tags_write on tags
  for all using (can_edit()) with check (can_edit());

drop policy if exists articles_read on articles;
create policy articles_read on articles
  for select using (
    (status = 'published' and published_at <= now()) or is_staff()
  );

drop policy if exists articles_write on articles;
create policy articles_write on articles
  for all using (can_edit()) with check (can_edit());

drop policy if exists article_tags_read on article_tags;
create policy article_tags_read on article_tags
  for select using (true);

drop policy if exists article_tags_write on article_tags;
create policy article_tags_write on article_tags
  for all using (can_edit()) with check (can_edit());

drop policy if exists videos_read on videos;
create policy videos_read on videos
  for select using (true);

drop policy if exists videos_write on videos;
create policy videos_write on videos
  for all using (can_edit()) with check (can_edit());

drop policy if exists races_read on races;
create policy races_read on races
  for select using (true);

drop policy if exists races_write on races;
create policy races_write on races
  for all using (can_edit()) with check (can_edit());

drop policy if exists site_settings_read on site_settings;
create policy site_settings_read on site_settings
  for select using (true);

drop policy if exists site_settings_write on site_settings;
create policy site_settings_write on site_settings
  for all using (can_edit()) with check (can_edit());

insert into categories (slug, name, position) values
  ('forma-1', 'Forma-1', 1),
  ('motogp', 'MotoGP', 2),
  ('forma-2', 'Forma-2', 3),
  ('wrc', 'WRC', 4),
  ('hosszutav', 'Hosszútáv', 5),
  ('esports', 'eSports', 6)
on conflict (slug) do nothing;

insert into admin_users (email, role)
select email, 'demo' from auth.users where email is not null
on conflict (email) do nothing;

insert into admin_users (email, role)
values ('superadmin@ge.com', 'superadmin')
on conflict (email) do update set role = 'superadmin';

insert into site_settings (id, sections_order) values
  (true, '["latest-video", "video-grid", "articles", "facebook", "poll", "next-race", "join"]'::jsonb)
on conflict (id) do nothing;
