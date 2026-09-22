create extension if not exists citext;

create table if not exists admin_users (
  email citext primary key,
  role text not null default 'demo' check (role in ('superadmin', 'admin', 'demo')),
  display_name text,
  created_at timestamptz not null default now()
);

alter table admin_users add column if not exists must_change_password boolean not null default false;

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
  kind text not null default 'other',
  created_at timestamptz not null default now()
);

alter table tags drop constraint if exists tags_kind_check;
alter table tags add constraint tags_kind_check
  check (kind in ('driver', 'team', 'circuit', 'country', 'principal', 'series', 'other'));

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  lead text,
  body text not null default '',
  cover_url text,
  cover_focus text not null default '50% 50%',
  category_id uuid references categories (id) on delete set null,
  author_email citext references admin_users (email) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'review', 'published')),
  featured boolean not null default false,
  reading_minutes integer,
  views integer not null default 0,
  facebook_post_id text,
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
  duration_seconds integer,
  thumbnail_url text,
  views integer not null default 0,
  published_at timestamptz,
  featured boolean not null default false,
  hidden boolean not null default false,
  position integer not null default 0,
  synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists facebook_posts (
  id uuid primary key default gen_random_uuid(),
  facebook_id text not null unique,
  message text,
  permalink_url text,
  image_url text,
  created_time timestamptz,
  visible boolean not null default false,
  synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists merch_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price integer,
  url text not null,
  image_url text,
  visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists site_popups (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  enabled boolean not null default false,
  trigger_kind text not null default 'first_visit'
    check (trigger_kind in ('first_visit', 'subpage')),
  pages jsonb not null default '[]'::jsonb,
  eyebrow text not null default '',
  title1 text not null default '',
  title2 text not null default '',
  body text not null default '',
  button text not null default '',
  link text not null default '',
  version bigint not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  status text not null default 'open' check (status in ('open', 'closed')),
  active boolean not null default false,
  starts_at timestamptz,
  closes_at timestamptz,
  closed_at timestamptz,
  hide_after_hours integer not null default 72,
  warn_before_min integer not null default 0,
  test_mode boolean not null default false,
  default_view text not null default 'percent' check (default_view in ('percent', 'count')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists poll_questions (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls (id) on delete cascade,
  title text not null default '',
  columns jsonb not null default '[]'::jsonb,
  has_votes boolean not null default true,
  vote_style text not null default 'updown' check (vote_style in ('updown', 'simple')),
  allow_suggestions boolean not null default false,
  live_sort boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references poll_questions (id) on delete cascade,
  cells jsonb not null default '[]'::jsonb,
  up_votes integer not null default 0,
  down_votes integer not null default 0,
  approved boolean not null default true,
  suggested boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references poll_options (id) on delete cascade,
  voter_id text not null,
  direction text not null check (direction in ('up', 'down')),
  created_at timestamptz not null default now(),
  unique (option_id, voter_id)
);

do $$
declare
  v_rows integer;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'races' and column_name = 'series'
  ) then
    execute 'select count(*) from races' into v_rows;

    if v_rows = 0 then
      drop table races cascade;
    end if;
  end if;
end $$;

create table if not exists race_series (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  source_key text unique,
  visible boolean not null default true,
  sort_order integer not null default 0,
  tag_id uuid references tags (id) on delete set null,
  featured_article_id uuid references articles (id) on delete set null,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table race_series add column if not exists tag_id uuid references tags (id) on delete set null;
alter table race_series add column if not exists featured_article_id uuid
  references articles (id) on delete set null;
alter table race_series add column if not exists cover_tone text;
alter table race_series add column if not exists cover_url text;
alter table race_series add column if not exists share_image_url text;

create or replace function ensure_series_tag()
returns trigger
language plpgsql
as $$
declare
  v_tag uuid;
begin
  insert into tags (slug, name, kind)
  values (new.slug, new.name, 'series')
  on conflict (slug) do update set kind = 'series', name = excluded.name
  returning id into v_tag;

  new.tag_id := v_tag;

  return new;
end;
$$;

drop trigger if exists race_series_ensure_tag on race_series;
create trigger race_series_ensure_tag
  before insert or update of slug, name on race_series
  for each row execute function ensure_series_tag();

create table if not exists races (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references race_series (id) on delete cascade,
  season integer not null,
  round integer,
  name text not null,
  location text,
  circuit text,
  country text,
  latitude double precision,
  longitude double precision,
  slug text,
  starts_at timestamptz,
  tbc boolean not null default false,
  note text,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists race_sessions (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references races (id) on delete cascade,
  kind text not null default 'other'
    check (kind in ('practice', 'qualifying', 'sprint_qualifying', 'sprint', 'warmup', 'race', 'other')),
  label text not null,
  starts_at timestamptz not null,
  created_at timestamptz not null default now()
);

insert into race_series (slug, name, source_key, sort_order) values
  ('f1', 'Forma-1', 'f1', 1),
  ('f2', 'Forma-2', 'f2', 2),
  ('f3', 'Forma-3', 'f3', 3),
  ('motogp', 'MotoGP', 'motogp', 4),
  ('indycar', 'IndyCar', 'indycar', 5)
on conflict (slug) do nothing;

insert into tags (slug, name, kind)
select slug, name, 'series' from race_series
on conflict (slug) do update set kind = 'series';

update race_series s set tag_id = t.id
from tags t
where t.slug = s.slug and t.kind = 'series' and s.tag_id is distinct from t.id;

create table if not exists site_settings (
  id boolean primary key default true check (id),
  sections_order jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table site_settings add column if not exists cover_design jsonb not null default '{}'::jsonb;
alter table site_settings add column if not exists cover_fallback_url text;

alter table articles add column if not exists cover_focus text not null default '50% 50%';
alter table articles alter column cover_focus set default '50% 50%';
alter table articles add column if not exists facebook_post_id text;
alter table articles add column if not exists primary_series_tag_id uuid
  references tags (id) on delete set null;

create index if not exists articles_primary_series_idx
  on articles (primary_series_tag_id, published_at desc)
  where primary_series_tag_id is not null;

update articles a
set primary_series_tag_id = (
  select j.tag_id
  from article_tags j
  join tags t on t.id = j.tag_id
  where j.article_id = a.id and t.kind = 'series'
)
where a.primary_series_tag_id is null
  and (
    select count(*)
    from article_tags j
    join tags t on t.id = j.tag_id
    where j.article_id = a.id and t.kind = 'series'
  ) = 1;

alter table articles add column if not exists search_vector tsvector generated always as (
  to_tsvector(
    'hungarian',
    coalesce(title, '') || ' ' || coalesce(lead, '') || ' ' || coalesce(body, '')
  )
) stored;

alter table articles drop constraint if exists articles_cover_focus_check;

update articles set cover_focus = case cover_focus
  when 'auto' then '50% 50%'
  when 'center' then '50% 50%'
  when 'north' then '50% 0%'
  when 'south' then '50% 100%'
  when 'west' then '0% 50%'
  when 'east' then '100% 50%'
end
where cover_focus in ('auto', 'center', 'north', 'south', 'west', 'east');

alter table articles add constraint articles_cover_focus_check
  check (cover_focus ~ '^[0-9]{1,3}% [0-9]{1,3}%$');

alter table videos add column if not exists duration_seconds integer;
alter table videos add column if not exists thumbnail_url text;
alter table videos add column if not exists hidden boolean not null default false;
alter table videos add column if not exists synced_at timestamptz;

create or replace function video_is_short(title text, seconds integer)
returns boolean
language sql
immutable
as $$
  select coalesce(seconds, 86400) < 180 or strpos(lower(title), '#shorts') > 0;
$$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'videos' and column_name = 'is_short'
  ) then
    alter table videos add column is_short boolean not null default false;
    update videos set is_short = video_is_short(title, duration_seconds);
    update videos set hidden = true where is_short;
  end if;
end;
$$;

create or replace function classify_video()
returns trigger
language plpgsql
as $$
begin
  new.is_short := video_is_short(new.title, new.duration_seconds);

  if tg_op = 'INSERT' and new.is_short then
    new.hidden := true;
  end if;

  return new;
end;
$$;

drop trigger if exists videos_classify on videos;
create trigger videos_classify
  before insert or update on videos
  for each row execute function classify_video();

create index if not exists articles_published_idx
  on articles (published_at desc)
  where status = 'published';

create index if not exists articles_category_idx on articles (category_id);

create index if not exists articles_featured_idx
  on articles (published_at desc)
  where featured;

create index if not exists articles_search_idx on articles using gin (search_vector);
create index if not exists article_tags_tag_idx on article_tags (tag_id);
create index if not exists videos_published_idx on videos (published_at desc);

create index if not exists facebook_posts_visible_idx
  on facebook_posts (created_time desc)
  where visible;

alter table polls add column if not exists closed_at timestamptz;
alter table polls add column if not exists hide_after_hours integer not null default 72;

update polls
set closed_at = coalesce(closes_at, updated_at)
where status = 'closed' and closed_at is null;

create index if not exists poll_questions_poll_idx on poll_questions (poll_id, sort_order);
create index if not exists poll_options_question_idx on poll_options (question_id, sort_order);
create index if not exists polls_active_idx on polls (active) where active;

create unique index if not exists races_round_idx
  on races (series_id, season, round) where round is not null;
create index if not exists races_starts_idx on races (starts_at);
create index if not exists races_series_idx on races (series_id, season, round);
create index if not exists race_sessions_race_idx on race_sessions (race_id, starts_at);
create index if not exists race_sessions_starts_idx on race_sessions (starts_at);

drop trigger if exists articles_set_updated_at on articles;
create trigger articles_set_updated_at
  before update on articles
  for each row execute function set_updated_at();

drop trigger if exists site_popups_set_updated_at on site_popups;
create trigger site_popups_set_updated_at
  before update on site_popups
  for each row execute function set_updated_at();

drop trigger if exists merch_products_set_updated_at on merch_products;
create trigger merch_products_set_updated_at
  before update on merch_products
  for each row execute function set_updated_at();

drop trigger if exists site_settings_set_updated_at on site_settings;
create trigger site_settings_set_updated_at
  before update on site_settings
  for each row execute function set_updated_at();

drop trigger if exists race_series_set_updated_at on race_series;
create trigger race_series_set_updated_at
  before update on race_series
  for each row execute function set_updated_at();

drop trigger if exists races_set_updated_at on races;
create trigger races_set_updated_at
  before update on races
  for each row execute function set_updated_at();

create or replace function stamp_race_start()
returns trigger
language plpgsql
as $$
begin
  update races
  set starts_at = (
    select min(starts_at) from race_sessions
    where race_id = coalesce(new.race_id, old.race_id) and kind = 'race'
  )
  where id = coalesce(new.race_id, old.race_id);

  return null;
end;
$$;

drop trigger if exists race_sessions_stamp_race on race_sessions;
create trigger race_sessions_stamp_race
  after insert or update or delete on race_sessions
  for each row execute function stamp_race_start();

create or replace function series_articles()
returns table (
  series_id uuid,
  article_id uuid,
  slug text,
  title text,
  cover_url text,
  cover_focus text,
  published_at timestamptz,
  reading_minutes integer
)
language sql
stable
as $$
  with newest as (
    select f.id from articles f
    where f.status = 'published' and f.published_at <= now()
    order by f.published_at desc
    limit 1
  ),
  picked as (
    select
      s.id as for_series,
      coalesce(
        (
          select p.id from articles p
          where p.id = s.featured_article_id
            and p.status = 'published'
            and p.published_at <= now()
        ),
        (
          select f.id from articles f
          where f.primary_series_tag_id = s.tag_id
            and f.status = 'published'
            and f.published_at <= now()
          order by f.published_at desc
          limit 1
        ),
        (
          select m.id from articles m
          join article_tags j on j.article_id = m.id
          where j.tag_id = s.tag_id
            and m.status = 'published'
            and m.published_at <= now()
          order by m.published_at desc
          limit 1
        ),
        (select n.id from newest n)
      ) as for_article
    from race_series s
    where s.visible
  )
  select
    k.for_series,
    a.id,
    a.slug,
    a.title,
    a.cover_url,
    a.cover_focus,
    a.published_at,
    a.reading_minutes
  from picked k
  join articles a on a.id = k.for_article;
$$;

grant execute on function series_articles() to anon, authenticated;

create or replace function apply_race_sync(p_source_key text, p_season integer, p_races jsonb)
returns integer
language plpgsql
as $$
declare
  v_series uuid;
  v_race uuid;
  v_row jsonb;
  v_session jsonb;
  v_count integer := 0;
begin
  select id into v_series from race_series where source_key = p_source_key;

  if v_series is null then
    return 0;
  end if;

  for v_row in select value from jsonb_array_elements(p_races)
  loop
    insert into races (
      series_id, season, round, name, location, circuit,
      latitude, longitude, slug, tbc, synced_at
    )
    values (
      v_series,
      p_season,
      (v_row ->> 'round')::integer,
      v_row ->> 'name',
      v_row ->> 'location',
      v_row ->> 'circuit',
      (v_row ->> 'latitude')::double precision,
      (v_row ->> 'longitude')::double precision,
      v_row ->> 'slug',
      coalesce((v_row ->> 'tbc')::boolean, false),
      now()
    )
    on conflict (series_id, season, round) where round is not null
    do update set
      name = excluded.name,
      location = coalesce(excluded.location, races.location),
      circuit = coalesce(excluded.circuit, races.circuit),
      latitude = coalesce(excluded.latitude, races.latitude),
      longitude = coalesce(excluded.longitude, races.longitude),
      slug = excluded.slug,
      tbc = excluded.tbc,
      synced_at = now()
    returning id into v_race;

    delete from race_sessions where race_id = v_race;

    for v_session in select value from jsonb_array_elements(v_row -> 'sessions')
    loop
      insert into race_sessions (race_id, kind, label, starts_at)
      values (
        v_race,
        v_session ->> 'kind',
        v_session ->> 'label',
        (v_session ->> 'starts_at')::timestamptz
      );
    end loop;

    v_count := v_count + 1;
  end loop;

  update race_series set synced_at = now() where id = v_series;

  return v_count;
end;
$$;

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

create or replace function enforce_featured_limit()
returns trigger
language plpgsql
as $$
begin
  if new.featured and (tg_op = 'INSERT' or not old.featured) then
    if (select count(*) from articles where featured) >= 3 then
      raise exception 'Legfeljebb 3 kiemelt cikk lehet.' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists articles_enforce_featured_limit on articles;
create trigger articles_enforce_featured_limit
  before insert or update on articles
  for each row execute function enforce_featured_limit();

create or replace function search_tags(search text default '', limit_count integer default 15)
returns table (id uuid, slug text, name text, kind text, uses bigint)
language sql
stable
as $$
  select t.id, t.slug, t.name, t.kind, count(link.article_id) as uses
  from tags t
  left join article_tags link on link.tag_id = t.id
  where search = '' or t.name ilike '%' || search || '%'
  group by t.id, t.slug, t.name, t.kind
  order by count(link.article_id) desc, t.name
  limit limit_count;
$$;

drop function if exists article_share(text);

create or replace function article_share(p_slug text)
returns table (
  title text,
  lead text,
  cover_url text,
  published_at timestamptz,
  updated_at timestamptz,
  series_cover_url text,
  series_share_url text,
  site_cover_url text
)
language sql
stable
set search_path = public
as $$
  select
    a.title,
    a.lead,
    a.cover_url,
    a.published_at,
    a.updated_at,
    s.cover_url,
    s.share_image_url,
    (select cover_fallback_url from site_settings limit 1)
  from articles a
  left join race_series s on s.tag_id = a.primary_series_tag_id and s.visible
  where a.slug = p_slug
    and a.status = 'published'
    and a.published_at <= now()
  limit 1;
$$;

grant execute on function article_share(text) to anon, authenticated;

create or replace function search_terms(p_text text)
returns text
language sql
immutable
as $$
  select nullif(string_agg(word || ':*', ' & ' order by position), '')
  from regexp_split_to_table(
    regexp_replace(lower(coalesce(p_text, '')), '[^[:alnum:][:space:]]', ' ', 'g'),
    '\s+'
  ) with ordinality as parts (word, position)
  where word <> '';
$$;

drop function if exists search_articles(text, integer);

create or replace function search_articles(p_query text, p_limit integer default 20)
returns table (
  id uuid,
  slug text,
  title text,
  lead text,
  reading_minutes integer,
  published_at timestamptz,
  category text,
  cover_url text,
  cover_focus text,
  series_slug text,
  series_name text
)
language sql
stable
set search_path = public
as $$
  select
    a.id,
    a.slug,
    a.title,
    a.lead,
    a.reading_minutes,
    a.published_at,
    c.name,
    a.cover_url,
    a.cover_focus,
    t.slug,
    t.name
  from articles a
  left join categories c on c.id = a.category_id
  left join tags t on t.id = a.primary_series_tag_id
  cross join (select search_terms(p_query) as terms) q
  where q.terms is not null
    and a.status = 'published'
    and a.published_at <= now()
    and a.search_vector @@ to_tsquery('hungarian', q.terms)
  order by
    ts_rank(a.search_vector, to_tsquery('hungarian', q.terms)) desc,
    a.published_at desc
  limit greatest(coalesce(p_limit, 20), 1);
$$;

grant execute on function search_articles(text, integer) to anon, authenticated;

drop trigger if exists polls_set_updated_at on polls;
create trigger polls_set_updated_at
  before update on polls
  for each row execute function set_updated_at();

create or replace function enforce_single_active_poll()
returns trigger
language plpgsql
as $$
begin
  update polls set active = false where id <> new.id and active;
  return null;
end;
$$;

drop trigger if exists polls_single_active on polls;
create trigger polls_single_active
  after insert or update of active on polls
  for each row when (new.active) execute function enforce_single_active_poll();

create or replace function stamp_poll_closed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'closed' and (tg_op = 'INSERT' or old.status is distinct from 'closed') then
    new.closed_at := least(coalesce(new.closes_at, now()), now());
  elsif new.status = 'open' then
    new.closed_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists polls_stamp_closed_at on polls;
create trigger polls_stamp_closed_at
  before insert or update on polls
  for each row execute function stamp_poll_closed_at();

create or replace function poll_is_open(target polls)
returns boolean
language sql
stable
as $$
  select target.status = 'open'
    and (target.starts_at is null or target.starts_at <= now())
    and (target.closes_at is null or target.closes_at > now());
$$;

create or replace function cast_vote(p_option uuid, p_voter text, p_dir text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_poll polls;
  v_question poll_questions;
  v_option poll_options;
  v_vote poll_votes;
begin
  if p_dir not in ('up', 'down') or p_voter is null or length(p_voter) < 8 then
    return jsonb_build_object('status', 'error');
  end if;

  select o.* into v_option from poll_options o where o.id = p_option and o.approved;

  if not found then
    return jsonb_build_object('status', 'error');
  end if;

  select q.* into v_question from poll_questions q where q.id = v_option.question_id;
  select p.* into v_poll from polls p where p.id = v_question.poll_id;

  if not v_question.has_votes or (p_dir = 'down' and v_question.vote_style = 'simple') then
    return jsonb_build_object('status', 'error');
  end if;

  if not poll_is_open(v_poll) then
    return jsonb_build_object('status', 'closed');
  end if;

  if v_poll.test_mode then
    if p_dir = 'up' then
      update poll_options set up_votes = up_votes + 1 where id = p_option;
    else
      update poll_options set down_votes = down_votes + 1 where id = p_option;
    end if;

    select o.* into v_option from poll_options o where o.id = p_option;
    return jsonb_build_object('status', 'ok', 'up', v_option.up_votes, 'down', v_option.down_votes);
  end if;

  select v.* into v_vote from poll_votes v where v.option_id = p_option and v.voter_id = p_voter;

  if not found then
    insert into poll_votes (option_id, voter_id, direction) values (p_option, p_voter, p_dir);

    if p_dir = 'up' then
      update poll_options set up_votes = up_votes + 1 where id = p_option;
    else
      update poll_options set down_votes = down_votes + 1 where id = p_option;
    end if;
  elsif v_vote.direction = p_dir then
    delete from poll_votes where id = v_vote.id;

    if p_dir = 'up' then
      update poll_options set up_votes = greatest(0, up_votes - 1) where id = p_option;
    else
      update poll_options set down_votes = greatest(0, down_votes - 1) where id = p_option;
    end if;
  else
    update poll_votes set direction = p_dir where id = v_vote.id;

    if p_dir = 'up' then
      update poll_options
        set up_votes = up_votes + 1, down_votes = greatest(0, down_votes - 1)
        where id = p_option;
    else
      update poll_options
        set down_votes = down_votes + 1, up_votes = greatest(0, up_votes - 1)
        where id = p_option;
    end if;
  end if;

  select o.* into v_option from poll_options o where o.id = p_option;
  return jsonb_build_object('status', 'ok', 'up', v_option.up_votes, 'down', v_option.down_votes);
end;
$$;

grant execute on function cast_vote(uuid, text, text) to anon, authenticated;

create or replace function suggest_option(p_question uuid, p_cells jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_poll polls;
  v_question poll_questions;
  v_pending integer;
begin
  select q.* into v_question from poll_questions q where q.id = p_question;

  if not found or not v_question.allow_suggestions then
    return jsonb_build_object('status', 'error');
  end if;

  if p_cells is null
    or jsonb_typeof(p_cells) <> 'array'
    or jsonb_array_length(p_cells) <> jsonb_array_length(v_question.columns)
  then
    return jsonb_build_object('status', 'error');
  end if;

  select p.* into v_poll from polls p where p.id = v_question.poll_id;

  if not poll_is_open(v_poll) then
    return jsonb_build_object('status', 'closed');
  end if;

  select count(*) into v_pending
    from poll_options where question_id = p_question and not approved;

  if v_pending >= 100 then
    return jsonb_build_object('status', 'full');
  end if;

  insert into poll_options (question_id, cells, approved, suggested, sort_order)
    values (p_question, p_cells, false, true, 9999);

  return jsonb_build_object('status', 'ok');
end;
$$;

grant execute on function suggest_option(uuid, jsonb) to anon, authenticated;

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

create or replace function complete_password_change()
returns boolean
language sql
security definer
set search_path = public
as $$
  update admin_users
  set must_change_password = false
  where email = (auth.jwt() ->> 'email')::citext
  returning true;
$$;

grant execute on function complete_password_change() to authenticated;

alter table admin_users enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table articles enable row level security;
alter table article_tags enable row level security;
alter table videos enable row level security;
alter table facebook_posts enable row level security;
alter table polls enable row level security;
alter table poll_questions enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;
alter table race_series enable row level security;
alter table races enable row level security;
alter table race_sessions enable row level security;
alter table merch_products enable row level security;
alter table site_popups enable row level security;
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

drop policy if exists facebook_posts_read on facebook_posts;
create policy facebook_posts_read on facebook_posts
  for select using (visible or is_staff());

drop policy if exists facebook_posts_write on facebook_posts;
create policy facebook_posts_write on facebook_posts
  for all using (can_edit()) with check (can_edit());

drop policy if exists polls_read on polls;
create policy polls_read on polls
  for select using (true);

drop policy if exists polls_write on polls;
create policy polls_write on polls
  for all using (can_edit()) with check (can_edit());

drop policy if exists poll_questions_read on poll_questions;
create policy poll_questions_read on poll_questions
  for select using (true);

drop policy if exists poll_questions_write on poll_questions;
create policy poll_questions_write on poll_questions
  for all using (can_edit()) with check (can_edit());

drop policy if exists poll_options_read on poll_options;
create policy poll_options_read on poll_options
  for select using (approved or is_staff());

drop policy if exists poll_options_write on poll_options;
create policy poll_options_write on poll_options
  for all using (can_edit()) with check (can_edit());

drop policy if exists poll_votes_read on poll_votes;
create policy poll_votes_read on poll_votes
  for select using (is_staff());

drop policy if exists race_series_read on race_series;
create policy race_series_read on race_series
  for select using (true);

drop policy if exists race_series_write on race_series;
create policy race_series_write on race_series
  for all using (can_edit()) with check (can_edit());

drop policy if exists races_read on races;
create policy races_read on races
  for select using (true);

drop policy if exists races_write on races;
create policy races_write on races
  for all using (can_edit()) with check (can_edit());

drop policy if exists race_sessions_read on race_sessions;
create policy race_sessions_read on race_sessions
  for select using (true);

drop policy if exists race_sessions_write on race_sessions;
create policy race_sessions_write on race_sessions
  for all using (can_edit()) with check (can_edit());

drop policy if exists site_popups_read on site_popups;
create policy site_popups_read on site_popups
  for select using (enabled or is_staff());

drop policy if exists site_popups_write on site_popups;
create policy site_popups_write on site_popups
  for all using (can_edit()) with check (can_edit());

drop policy if exists merch_products_read on merch_products;
create policy merch_products_read on merch_products
  for select using (visible or is_staff());

drop policy if exists merch_products_write on merch_products;
create policy merch_products_write on merch_products
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

do $$
declare
  target text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    return;
  end if;

  foreach target in array array['polls', 'poll_questions', 'poll_options'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = target
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target);
    end if;
  end loop;
end;
$$;

insert into site_settings (id) values (true)
on conflict (id) do nothing;

update site_settings
set sections_order = '[
  {"key": "latest", "visible": true},
  {"key": "featured", "visible": true},
  {"key": "videos", "visible": true},
  {"key": "calendar", "visible": true},
  {"key": "articles", "visible": true},
  {"key": "poll", "visible": true},
  {"key": "merch", "visible": true},
  {"key": "facebook", "visible": true},
  {"key": "community", "visible": true},
  {"key": "discounts", "visible": true}
]'::jsonb
where not exists (
  select 1
  from jsonb_array_elements(
    case when jsonb_typeof(sections_order) = 'array' then sections_order else '[]'::jsonb end
  ) entry
  where jsonb_typeof(entry) = 'object' and entry ? 'key'
);
