-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  display_name text,
  avatar_emoji text default '🎙️',
  bio text,
  role text default 'listener', -- 'broadcaster' | 'listener'
  favorite_teams text[] default '{}',
  total_broadcasts int default 0,
  total_listeners int default 0,
  follower_count int default 0,
  created_at timestamptz default now()
);

-- Games
create table public.games (
  id uuid primary key default uuid_generate_v4(),
  league text not null, -- NBA, NFL, MLB, NHL, UFC, COLLEGE
  home_team text not null,
  away_team text not null,
  home_score int default 0,
  away_score int default 0,
  status text default 'upcoming', -- upcoming, live, final
  period text, -- Q1, Q2, H1, 1st, R1, etc.
  game_clock text, -- '5:23'
  start_time timestamptz not null,
  venue text,
  broadcast_count int default 0,
  created_at timestamptz default now()
);

-- Broadcast rooms
create table public.broadcast_rooms (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid references public.games(id) on delete cascade,
  broadcaster_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  vibe_tag text not null,
  status text default 'live', -- live, ended
  listener_count int default 0,
  livekit_room_name text unique,
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- Room listeners (for tracking)
create table public.room_listeners (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.broadcast_rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  left_at timestamptz,
  unique(room_id, user_id)
);

-- Sync markers (set by broadcaster)
create table public.sync_markers (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.broadcast_rooms(id) on delete cascade,
  game_id uuid references public.games(id) on delete cascade,
  period text not null,
  game_clock text not null,
  broadcaster_timestamp timestamptz default now(),
  created_at timestamptz default now()
);

-- Listener sync offsets
create table public.listener_offsets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  room_id uuid references public.broadcast_rooms(id) on delete cascade,
  offset_ms int default 0,
  provider_preset text,
  updated_at timestamptz default now(),
  unique(user_id, room_id)
);

-- Chat messages
create table public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.broadcast_rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  username text not null,
  message text not null,
  created_at timestamptz default now()
);

-- Follows
create table public.follows (
  id uuid primary key default uuid_generate_v4(),
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);

-- Reports
create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.broadcast_rooms(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz default now()
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.broadcast_rooms enable row level security;
alter table public.room_listeners enable row level security;
alter table public.sync_markers enable row level security;
alter table public.listener_offsets enable row level security;
alter table public.chat_messages enable row level security;
alter table public.follows enable row level security;
alter table public.reports enable row level security;

-- Profiles: public read, own write
create policy "Public profiles" on public.profiles for select using (true);
create policy "Own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "Own profile update" on public.profiles for update using (auth.uid() = id);
create policy "Own profile delete" on public.profiles for delete using (auth.uid() = id);

-- Games: public read, admin write (we'll insert via service key)
create policy "Public games read" on public.games for select using (true);

-- Broadcast rooms: public read, broadcaster write
create policy "Public rooms read" on public.broadcast_rooms for select using (true);
create policy "Broadcaster room insert" on public.broadcast_rooms for insert with check (auth.uid() = broadcaster_id);
create policy "Broadcaster room update" on public.broadcast_rooms for update using (auth.uid() = broadcaster_id);
create policy "Broadcaster room delete" on public.broadcast_rooms for delete using (auth.uid() = broadcaster_id);

-- Chat: public read, auth write
create policy "Public chat read" on public.chat_messages for select using (true);
create policy "Auth chat write" on public.chat_messages for insert with check (auth.uid() = user_id);

-- Sync markers: public read, broadcaster write
create policy "Public sync read" on public.sync_markers for select using (true);
create policy "Broadcaster sync write" on public.sync_markers for insert with check (
  auth.uid() = (select broadcaster_id from public.broadcast_rooms where id = room_id)
);

-- Listener offsets: own only
create policy "Own offsets select" on public.listener_offsets for select using (auth.uid() = user_id);
create policy "Own offsets insert" on public.listener_offsets for insert with check (auth.uid() = user_id);
create policy "Own offsets update" on public.listener_offsets for update using (auth.uid() = user_id);
create policy "Own offsets delete" on public.listener_offsets for delete using (auth.uid() = user_id);

-- Follows: public read, own write
create policy "Public follows read" on public.follows for select using (true);
create policy "Own follows insert" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Own follows delete" on public.follows for delete using (auth.uid() = follower_id);

-- Reports: auth insert only
create policy "Auth reports" on public.reports for insert with check (auth.uid() = reporter_id);

-- Enable realtime for key tables
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.sync_markers;
alter publication supabase_realtime add table public.broadcast_rooms;
