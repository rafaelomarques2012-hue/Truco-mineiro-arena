-- PostgreSQL starter schema. Enable pgcrypto for UUIDs.
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  public_id text unique not null,
  display_name text not null check (char_length(display_name) between 2 and 40),
  email text,
  phone text,
  cpf_encrypted text, -- store only if legally necessary; encrypt outside DB/KMS
  created_at timestamptz not null default now()
);
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending','accepted','blocked')),
  created_at timestamptz not null default now(),
  unique(requester_id,addressee_id),
  check(requester_id <> addressee_id)
);
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  mode text not null check(mode in ('offline','casual')),
  player_count int not null check(player_count in (2,4)),
  status text not null default 'waiting' check(status in ('waiting','playing','finished','cancelled')),
  score_team_a int not null default 0,
  score_team_b int not null default 0,
  winner_team smallint check(winner_team in (0,1)),
  rules_version text not null default 'mineiro-fixed-v1',
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists match_players (
  match_id uuid not null references matches(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  seat smallint not null check(seat between 0 and 3),
  team smallint not null check(team in (0,1)),
  result text check(result in ('win','loss','draw')),
  primary key(match_id,seat)
);
create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  name text not null,
  email text not null,
  category text not null check(category in ('suggestion','bug','other')),
  message text not null check(char_length(message) between 3 and 5000),
  status text not null default 'new' check(status in ('new','read','resolved')),
  created_at timestamptz not null default now()
);
create table if not exists admin_roles (
  profile_id uuid primary key references profiles(id) on delete cascade,
  role text not null check(role in ('admin','support')),
  created_at timestamptz not null default now()
);
-- Demo ledger only: this is NOT a payment processor, wallet, escrow or PIX integration.
create table if not exists demo_ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  match_id uuid references matches(id) on delete set null,
  kind text not null check(kind in ('demo_credit','demo_debit','demo_prize')),
  amount_cents bigint not null,
  status text not null default 'demo_only' check(status='demo_only'),
  created_at timestamptz not null default now()
);
create index if not exists idx_friendships_addressee on friendships(addressee_id,status);
create index if not exists idx_matches_created on matches(created_at desc);
create index if not exists idx_support_status on support_messages(status,created_at desc);

-- Before production: enable RLS and define policies tied to authenticated auth.uid().
-- Never expose CPF, email, phone, private hands, admin metrics or ledger data publicly.
