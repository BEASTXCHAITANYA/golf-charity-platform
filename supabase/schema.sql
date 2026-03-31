-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enums
create type user_role as enum ('user', 'admin');
create type subscription_status as enum ('active', 'inactive', 'lapsed');
create type subscription_plan as enum ('monthly', 'yearly');
create type draw_type as enum ('random', 'algorithmic');
create type draw_status as enum ('simulation', 'published');
create type payment_status as enum ('pending', 'paid');

-- Profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role user_role not null default 'user',
  subscription_status subscription_status not null default 'inactive',
  subscription_plan subscription_plan,
  subscription_end_date timestamptz,
  charity_id uuid,
  charity_percentage int not null default 10 check (charity_percentage >= 10),
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

-- Charities table
create table charities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null,
  image_url text,
  is_featured boolean not null default false,
  events jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- Add FK from profiles to charities
alter table profiles add constraint profiles_charity_id_fkey
  foreign key (charity_id) references charities(id) on delete set null;

-- Scores table
create table scores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  score int not null check (score >= 1 and score <= 45),
  played_at date not null,
  created_at timestamptz not null default now()
);

-- Auto-delete oldest score trigger (keep only 5 most recent)
create or replace function limit_scores_per_user()
returns trigger as $$
begin
  delete from scores
  where user_id = NEW.user_id
    and id not in (
      select id from scores
      where user_id = NEW.user_id
      order by played_at desc, created_at desc
      limit 5
    );
  return NEW;
end;
$$ language plpgsql;

create trigger enforce_score_limit
  after insert on scores
  for each row execute function limit_scores_per_user();

-- Draws table
create table draws (
  id uuid primary key default uuid_generate_v4(),
  month int not null check (month >= 1 and month <= 12),
  year int not null,
  drawn_numbers int[] not null,
  draw_type draw_type not null default 'random',
  status draw_status not null default 'simulation',
  prize_pool_total numeric not null default 0,
  jackpot_rollover numeric not null default 0,
  created_at timestamptz not null default now(),
  unique(month, year)
);

-- Draw entries table
create table draw_entries (
  id uuid primary key default uuid_generate_v4(),
  draw_id uuid not null references draws(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  user_numbers int[] not null,
  matched_numbers int[] not null default '{}',
  match_count int not null default 0,
  prize_won numeric not null default 0,
  proof_url text,
  payment_status payment_status not null default 'pending',
  unique(draw_id, user_id)
);

-- Subscriptions table
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  stripe_subscription_id text unique not null,
  plan subscription_plan not null,
  amount numeric not null,
  status text not null,
  created_at timestamptz not null default now()
);

-- Score frequency RPC for algorithmic draw
create or replace function get_score_frequencies()
returns table(score int, count bigint) as $$
begin
  return query
    select s.score, count(*) as count
    from scores s
    group by s.score
    order by count desc;
end;
$$ language plpgsql;

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Row Level Security
alter table profiles enable row level security;
alter table scores enable row level security;
alter table charities enable row level security;
alter table draws enable row level security;
alter table draw_entries enable row level security;
alter table subscriptions enable row level security;

-- Profiles RLS
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update all profiles" on profiles for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Scores RLS
create policy "Users can view own scores" on scores for select using (auth.uid() = user_id);
create policy "Users can insert own scores" on scores for insert with check (auth.uid() = user_id);
create policy "Users can delete own scores" on scores for delete using (auth.uid() = user_id);
create policy "Admins can view all scores" on scores for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Charities RLS (public read)
create policy "Anyone can view charities" on charities for select using (true);
create policy "Admins can manage charities" on charities for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Draws RLS
create policy "Active subscribers can view published draws" on draws for select using (
  status = 'published' and exists (
    select 1 from profiles where id = auth.uid() and subscription_status = 'active'
  )
);
create policy "Admins can manage draws" on draws for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Draw entries RLS
create policy "Users can view own entries" on draw_entries for select using (auth.uid() = user_id);
create policy "Admins can manage all entries" on draw_entries for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Subscriptions RLS
create policy "Users can view own subscriptions" on subscriptions for select using (auth.uid() = user_id);
create policy "Admins can view all subscriptions" on subscriptions for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
