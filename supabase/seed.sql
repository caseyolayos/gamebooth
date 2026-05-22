-- Seed demo games
-- Run this after schema.sql

insert into public.games (id, league, home_team, away_team, home_score, away_score, status, period, game_clock, start_time, venue, broadcast_count)
values
  (
    uuid_generate_v4(),
    'NBA',
    'Warriors',
    'Lakers',
    91, 87,
    'live',
    'Q3',
    '7:42',
    now() - interval '90 minutes',
    'Chase Center',
    3
  ),
  (
    uuid_generate_v4(),
    'MLB',
    'Yankees',
    'Red Sox',
    4, 3,
    'live',
    'Top 7th',
    '',
    now() - interval '120 minutes',
    'Yankee Stadium',
    2
  ),
  (
    uuid_generate_v4(),
    'NFL',
    'Eagles',
    'Cowboys',
    0, 0,
    'upcoming',
    null,
    null,
    now() + interval '3 hours',
    'Lincoln Financial Field',
    0
  ),
  (
    uuid_generate_v4(),
    'UFC',
    'Main Card',
    'UFC 300',
    0, 0,
    'upcoming',
    null,
    null,
    now() + interval '2 days',
    'T-Mobile Arena',
    0
  ),
  (
    uuid_generate_v4(),
    'NBA',
    'Heat',
    'Celtics',
    0, 0,
    'upcoming',
    null,
    null,
    now() + interval '26 hours',
    'Kaseya Center',
    0
  ),
  (
    uuid_generate_v4(),
    'MLB',
    'Giants',
    'Dodgers',
    0, 0,
    'upcoming',
    null,
    null,
    now() + interval '5 hours',
    'Oracle Park',
    0
  );

-- Note: Demo broadcast rooms require actual user profiles with UUIDs from auth.users
-- They will be created when real users go live. 
-- The app falls back to hardcoded demo data if the tables are empty.
