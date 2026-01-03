-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ⚠️ RESET: Drop tables if they exist to ensure clean slate (Order matters due to foreign keys)
drop table if exists lineup_players cascade;
drop table if exists lineups cascade;
drop table if exists player_performances cascade;
drop table if exists fixtures cascade;
drop table if exists gameweeks cascade;
drop table if exists roster_items cascade;
drop table if exists fantasy_teams cascade;
drop table if exists players cascade;
drop table if exists real_teams cascade;
drop table if exists app_settings cascade;

-- 1. APP SETTINGS (The "Brain" of the Rules)
create table app_settings (
    key text primary key,
    value jsonb not null,
    description text
);

-- Seed Initial Rules
insert into app_settings (key, value, description) values
('scoring_goal_bonus', '3', 'Points awarded for a goal'),
('scoring_assist_bonus', '1', 'Points awarded for an assist'),
('scoring_yellow_card_malus', '-0.5', 'Points deducted for a yellow card'),
('scoring_red_card_malus', '-1', 'Points deducted for a red card'),
('scoring_pen_scored_bonus', '3', 'Points for scoring a penalty'),
('scoring_pen_missed_malus', '-3', 'Points for missing a penalty'),
('scoring_pen_saved_bonus', '3', 'Points for saving a penalty'),
('scoring_clean_sheet_bonus', '2', 'Points for a Clean Sheet (GK/DEF only usually, logic in code)'),
('scoring_own_goal_malus', '-2', 'Points deducted for an own goal'),
('regulation_switch_enabled', 'true', 'Master switch to enable/disable Switch mechanics'),
('regulation_switch_plus_active', 'true', 'Enable Switch Plus');

-- 2. REAL TEAMS (Premier League Teams)
create table real_teams (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    short_name text not null, -- e.g. LIV, ARS
    logo_url text
);

-- 3. PLAYERS (The Registry)
create table players (
    id uuid primary key default uuid_generate_v4(),
    real_team_id uuid references real_teams(id),
    name text not null,
    role text not null check (role in ('GK', 'DEF', 'MID', 'ATT')), -- Basic roles
    is_gk_block boolean default false, -- If true, this represents a "Block" (e.g. "Liverpool GK Block")
    active boolean default true
);

-- 4. FANTASY TEAMS (The 8 Users)
create table fantasy_teams (
    id uuid primary key default uuid_generate_v4(),
    manager_name text not null,
    team_name text not null,
    credits_remaining numeric default 500,
    user_id uuid, -- Link to Supabase Auth if needed
    avatar_url text
);

-- 5. ROSTER (Association Players -> Fantasy Teams)
create table roster_items (
    id uuid primary key default uuid_generate_v4(),
    fantasy_team_id uuid references fantasy_teams(id) not null,
    player_id uuid references players(id) not null,
    purchase_price numeric default 0,
    contract_start date default current_date,
    contract_end date
);

-- 6. GAMEWEEKS
create table gameweeks (
    id uuid primary key default uuid_generate_v4(),
    number integer not null,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    status text default 'upcoming' check (status in ('upcoming', 'live', 'completed', 'calculating'))
);

-- 7. FIXTURES (Matches)
create table fixtures (
    id uuid primary key default uuid_generate_v4(),
    gameweek_id uuid references gameweeks(id),
    home_team_id uuid references real_teams(id),
    away_team_id uuid references real_teams(id),
    kickoff_time timestamp with time zone,
    finished boolean default false,
    home_score integer,
    away_score integer
);

-- 8. PLAYER PERFORMANCES (The VOTE + Events)
-- This is what the Admin populates manually
create table player_performances (
    id uuid primary key default uuid_generate_v4(),
    fixture_id uuid references fixtures(id),
    player_id uuid references players(id),
    minutes_played integer default 0,
    
    -- Manual Vote
    vote_base numeric(3,1), -- e.g. 6.5
    
    -- Specific Events (Count)
    goals_scored integer default 0,
    assists integer default 0,
    yellow_cards integer default 0,
    red_cards integer default 0,
    penalties_scored integer default 0,
    penalties_missed integer default 0,
    penalties_saved integer default 0,
    own_goals integer default 0,
    clean_sheet boolean default false,
    
    -- Calculated field (can be computed on fly, but good to store for history)
    fantasy_vote_total numeric(4,1) 
);

-- 9. LINEUPS (Formations submitted by users)
create table lineups (
    id uuid primary key default uuid_generate_v4(),
    gameweek_id uuid references gameweeks(id),
    fantasy_team_id uuid references fantasy_teams(id),
    module text, -- e.g. '3-4-3'
    is_valid boolean default true,
    created_at timestamp default now()
);

create table lineup_players (
    id uuid primary key default uuid_generate_v4(),
    lineup_id uuid references lineups(id),
    player_id uuid references players(id),
    position_index integer, -- 1-11 for starters, 12+ for bench
    is_starter boolean default false,
    is_captain boolean default false,
    is_vice_captain boolean default false,
    
    -- Switch Logic
    switch_type text check (switch_type in (null, 'base', 'plus')),
    switch_target_player_id uuid references players(id) -- Who they link with
);
