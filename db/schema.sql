create table if not exists users (
  id text primary key,
  name text not null,
  email text not null unique,
  password text not null,
  reset_requested_at text,
  workspace_name text not null,
  workspace_description text not null,
  avatar text not null,
  bio text not null,
  skills text not null,
  github text not null
);

create table if not exists members (
  id text primary key,
  name text not null,
  email text not null,
  role text not null
);

create table if not exists billing (
  id integer primary key,
  plan text not null,
  amount text not null,
  member_limit integer not null,
  renewal text not null,
  card_name text,
  card_last4 text,
  stripe_customer_id text,
  stripe_subscription_id text
);

create table if not exists app_meta (
  key text primary key,
  value text not null
);

create table if not exists tasks (
  id text primary key,
  title text not null,
  priority text not null,
  meta text not null,
  status text not null,
  due text not null,
  updated text not null
);

create table if not exists snippets (
  id text primary key,
  title text not null,
  tags jsonb not null,
  code text not null,
  score text not null,
  review jsonb not null
);

create table if not exists activity (
  id bigint generated always as identity primary key,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id text primary key,
  author text not null,
  text text not null,
  time text not null,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id text primary key,
  title text not null,
  body text not null,
  unread boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_id_idx on sessions(user_id);
create index if not exists sessions_expires_at_idx on sessions(expires_at);
