-- Enable RLS
alter table if exists public.profiles enable row level security;
alter table if exists public.trading_strategies enable row level security;
alter table if exists public.trades enable row level security;
alter table if exists public.user_settings enable row level security;

-- Create tables
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.trading_strategies (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  type text not null check (type in ('scalping', 'day_trading', 'swing_trading')),
  timeframe text not null,
  indicators text[] not null,
  entry_conditions text[] not null,
  exit_conditions text[] not null,
  risk_percentage numeric not null,
  take_profit numeric not null,
  stop_loss numeric not null,
  parameters jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.trades (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  strategy_id uuid references public.trading_strategies(id) on delete set null,
  coin_id text not null,
  entry_price numeric not null,
  exit_price numeric,
  quantity numeric not null,
  side text not null check (side in ('long', 'short')),
  status text not null check (status in ('open', 'closed')),
  pnl numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  closed_at timestamp with time zone
);

create table if not exists public.user_settings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  favorite_coins text[] not null default array[]::text[],
  default_strategy uuid references public.trading_strategies(id) on delete set null,
  risk_per_trade numeric not null default 1.0,
  max_open_trades integer not null default 3,
  preferred_timeframes text[] not null default array['1h', '4h', '1d']::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can view their own strategies"
  on public.trading_strategies for select
  using (auth.uid() = user_id);

create policy "Users can insert their own strategies"
  on public.trading_strategies for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own strategies"
  on public.trading_strategies for update
  using (auth.uid() = user_id);

create policy "Users can delete their own strategies"
  on public.trading_strategies for delete
  using (auth.uid() = user_id);

create policy "Users can view their own trades"
  on public.trades for select
  using (auth.uid() = user_id);

create policy "Users can insert their own trades"
  on public.trades for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own trades"
  on public.trades for update
  using (auth.uid() = user_id);

create policy "Users can delete their own trades"
  on public.trades for delete
  using (auth.uid() = user_id);

create policy "Users can view their own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

-- Create functions and triggers
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create indexes
create index if not exists trades_user_id_idx on public.trades(user_id);
create index if not exists trades_strategy_id_idx on public.trades(strategy_id);
create index if not exists trades_coin_id_idx on public.trades(coin_id);
create index if not exists trading_strategies_user_id_idx on public.trading_strategies(user_id);
create index if not exists user_settings_user_id_idx on public.user_settings(user_id);
