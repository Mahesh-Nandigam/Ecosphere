-- ==========================================================
-- ECOSPHERE DATABASE SCHEMA & SECURITY POLICIES
-- Copy and run this script in the Supabase SQL Editor.
-- ==========================================================

-- 1. USERS PROFILE TABLE
-- Links to auth.users. Automatically populated on user signup or upserted.
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  avatar_emoji text default '🌎',
  joined_date timestamp with time zone default timezone('utc'::text, now()) not null,
  points integer default 320 not null,
  level integer default 2 not null,
  co2_target numeric default 14.5 not null,
  current_co2 numeric default 12.8 not null,
  eco_score integer default 82 not null,
  stats_transport numeric default 4.8 not null,
  stats_food numeric default 3.6 not null,
  stats_energy numeric default 3.2 not null,
  stats_lifestyle numeric default 1.2 not null
);

-- Enable RLS on users profile
alter table public.users enable row level security;

create policy "Users can create their own profile" on public.users 
  for insert with check (auth.uid() = id);

create policy "Users can view all profiles for leaderboard" on public.users 
  for select using (auth.role() = 'authenticated');

create policy "Users can edit their own profile" on public.users 
  for update using (auth.uid() = id);


-- 2. CARBON PRESETS (ACTIVITIES) TABLE
create table if not exists public.carbon_activities (
  id uuid default gen_random_uuid() primary key,
  category text not null,
  title text not null,
  value numeric not null,
  unit text not null,
  co2_avoided numeric not null,
  co2_produced numeric not null,
  points_reward integer not null
);

-- Enable RLS
alter table public.carbon_activities enable row level security;

create policy "Everyone can view presets" on public.carbon_activities 
  for select using (true);


-- 3. CARBON LOGS TABLE
create table if not exists public.carbon_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  category text not null,
  activity text not null,
  value numeric not null,
  unit text not null,
  co2_avoided numeric not null,
  co2_produced numeric not null,
  points_earned integer not null
);

-- Enable RLS
alter table public.carbon_logs enable row level security;

create policy "Users can manage their own logs" on public.carbon_logs 
  for all using (auth.uid() = user_id);


-- 4. SUSTAINABILITY CHALLENGES TABLE
create table if not exists public.sustainability_challenges (
  id text primary key,
  title text not null,
  description text not null,
  category text not null,
  difficulty text not null,
  duration_days integer not null,
  points_reward integer not null,
  co2_savings_est numeric not null
);

-- Enable RLS
alter table public.sustainability_challenges enable row level security;

create policy "Everyone can view challenges" on public.sustainability_challenges 
  for select using (true);


-- 5. USER CHALLENGES TABLE (Junction)
create table if not exists public.user_challenges (
  user_id uuid references public.users(id) on delete cascade not null,
  challenge_id text references public.sustainability_challenges(id) on delete cascade not null,
  progress integer default 0 not null,
  status text default 'available' not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, challenge_id)
);

-- Enable RLS
alter table public.user_challenges enable row level security;

create policy "Users can manage their own challenge progress" on public.user_challenges 
  for all using (auth.uid() = user_id);


-- 6. ACHIEVEMENTS TABLE
create table if not exists public.achievements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  badge_emoji text default '🏆' not null,
  points_reward integer not null,
  criteria_type text not null,
  criteria_value numeric not null
);

-- Enable RLS
alter table public.achievements enable row level security;

create policy "Everyone can view achievements" on public.achievements 
  for select using (true);


-- 7. USER ACHIEVEMENTS TABLE (Junction)
create table if not exists public.user_achievements (
  user_id uuid references public.users(id) on delete cascade not null,
  achievement_id uuid references public.achievements(id) on delete cascade not null,
  earned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, achievement_id)
);

-- Enable RLS
alter table public.user_achievements enable row level security;

create policy "Users can view their own achievements" on public.user_achievements 
  for all using (auth.uid() = user_id);


-- 8. COACH RECOMMENDATIONS TABLE
create table if not exists public.coach_recommendations (
  id uuid default gen_random_uuid() primary key,
  category text not null,
  title text not null,
  description text not null,
  co2_savings numeric not null,
  difficulty text not null,
  points_reward integer not null
);

-- Enable RLS
alter table public.coach_recommendations enable row level security;

create policy "Everyone can view coach recommendations" on public.coach_recommendations 
  for select using (true);


-- ==========================================================
-- DATABASE SEEDS
-- Prepopulate defaults if they don't already exist
-- ==========================================================

-- Seed activities/presets
insert into public.carbon_activities (category, title, value, unit, co2_avoided, co2_produced, points_reward) values
  ('transport', 'Rode electric bike instead of driving', 10, 'km', 2.1, 0.0, 25),
  ('transport', 'Took electric train (commute)', 25, 'km', 4.2, 0.3, 35),
  ('transport', 'Carpooled with coworkers', 15, 'km', 1.8, 1.2, 15),
  ('food', 'Ate vegetarian or vegan meal', 1, 'meal', 1.5, 0.4, 20),
  ('food', 'Purchased local organic produce', 1, 'count', 0.8, 0.1, 15),
  ('food', 'Composted organic food waste', 1, 'count', 0.5, 0.0, 10),
  ('energy', 'Transition to LED bulbs (Replace 5)', 5, 'count', 0.75, 0.0, 40),
  ('energy', 'Set thermostat to 24°C in summer', 8, 'hours', 1.2, 0.0, 30),
  ('energy', 'Air-dried clothes instead of dryer', 1, 'load', 1.8, 0.0, 25),
  ('lifestyle', 'Brought reusable bags & bottles', 1, 'count', 0.3, 0.0, 10),
  ('lifestyle', 'Recycled plastics, paper & tin', 1, 'count', 0.4, 0.0, 10),
  ('lifestyle', 'Purchased second-hand clothing', 1, 'item', 4.5, 0.0, 50)
on conflict do nothing;

-- Seed challenges
insert into public.sustainability_challenges (id, title, description, category, difficulty, duration_days, points_reward, co2_savings_est) values
  ('ch_554433', 'Meatless Weekdays', 'Eat vegetarian or vegan meals from Monday to Friday.', 'food', 'medium', 5, 150, 12.5),
  ('ch_554434', 'Pedal Power Week', 'Commute via bike or walk for all trips under 5km.', 'transport', 'hard', 7, 250, 18.0),
  ('ch_554435', 'Zero Standby Power', 'Turn off all electronics at the power strip before bed.', 'energy', 'easy', 3, 60, 4.5)
on conflict do nothing;

-- Seed achievements
insert into public.achievements (title, description, badge_emoji, points_reward, criteria_type, criteria_value) values
  ('Carbon Cutter', 'Avoid 10kg of CO2 emissions total.', '🌳', 100, 'total_co2_avoided', 10.0),
  ('Level Climber', 'Reach Level 3 on the platform.', '📈', 150, 'level', 3.0),
  ('Challenge Crusher', 'Complete your first Eco Challenge.', '🏆', 200, 'challenges_completed', 1.0)
on conflict do nothing;

-- Seed coach recommendations
insert into public.coach_recommendations (category, title, description, co2_savings, difficulty, points_reward) values
  ('energy', 'Transition to LED bulbs', 'Replace 5 halogen bulbs in your living room. Saves approx. 0.75kg CO2 per day.', 0.75, 'easy', 40),
  ('food', 'Adopt Meatless Monday', 'Enjoy entirely plant-based meals for one full day. Saves approx. 4.5kg CO2.', 4.5, 'easy', 50),
  ('transport', 'Commute via Electric Bike', 'Cycle a 10km commute instead of driving a petrol car. Saves approx. 2.1kg CO2.', 2.1, 'medium', 30),
  ('lifestyle', 'Ditch Single-Use Water Bottles', 'Use a steel bottle for 2 weeks. Saves approx. 1.2kg CO2 and prevents waste.', 1.2, 'easy', 25),
  ('energy', 'Unplug Idle Devices', 'Unplug your home office setup before bed. Saves approx. 0.3kg CO2 per night.', 0.3, 'easy', 15)
on conflict do nothing;
