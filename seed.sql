-- Seed Real Teams (Premier League 2024/25 - projected list)
insert into real_teams (name, short_name) values
('Arsenal', 'ARS'),
('Aston Villa', 'AVL'),
('Bournemouth', 'BOU'),
('Brentford', 'BRE'),
('Brighton', 'BHA'),
('Chelsea', 'CHE'),
('Crystal Palace', 'CRY'),
('Everton', 'EVE'),
('Fulham', 'FUL'),
('Ipswich Town', 'IPS'),
('Leicester City', 'LEI'),
('Liverpool', 'LIV'),
('Manchester City', 'MCI'),
('Manchester United', 'MUN'),
('Newcastle United', 'NEW'),
('Nottingham Forest', 'NFO'),
('Southampton', 'SOU'),
('Tottenham Hotspur', 'TOT'),
('West Ham United', 'WHU'),
('Wolverhampton Wanderers', 'WOL')
on conflict do nothing;

-- Initialize Gameweeks (Example: GW 1)
insert into gameweeks (number, start_date, end_date, status) values
(1, '2025-08-16 12:00:00+00', '2025-08-19 23:59:59+00', 'upcoming');
