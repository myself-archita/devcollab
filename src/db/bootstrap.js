async function runBootstrap({ query, queryOne, hashPassword, createId }) {
  await query(`
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
      card_last4 text
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
  `);

  await query("create index if not exists sessions_user_id_idx on sessions(user_id)");
  await query("create index if not exists sessions_expires_at_idx on sessions(expires_at)");

  const counts = await queryOne("select count(*)::int as count from users");
  if (counts?.count > 0) return;

  await query(
    `insert into users (
      id, name, email, password, reset_requested_at, workspace_name,
      workspace_description, avatar, bio, skills, github
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      "u1",
      "Demo User",
      "demo@devcollab.app",
      await hashPassword("dev12345"),
      null,
      "Atlas Labs",
      "Student developer workspace",
      "DU",
      "Full-stack builder collaborating on hackathon products.",
      "React, Node.js, UI Design",
      "https://github.com/demo-user"
    ]
  );

  const members = [
    ["m1", "Archita Guha Roy", "archita@devcollab.app", "Owner"],
    ["m2", "Riya Sen", "riya@devcollab.app", "Admin"],
    ["m3", "Ankush Patel", "ankush@devcollab.app", "Member"],
    ["m4", "Shruti Paul", "shruti@devcollab.app", "Member"],
    ["m5", "Viewer Bot", "viewer@devcollab.app", "Viewer"]
  ];
  for (const member of members) {
    await query("insert into members (id, name, email, role) values ($1, $2, $3, $4)", member);
  }

  await query("insert into billing (id, plan, amount, member_limit, renewal, card_name, card_last4) values (1, 'Free', 'Rs 0/month', 5, 'Not applicable', null, null) on conflict (id) do nothing");
  await query("insert into app_meta (key, value) values ('passwordResetLog', 'No reset requests yet.') on conflict (key) do nothing");

  const tasks = [
    ["t1", "Improve wiki page linking", "p2", "Docs", "todo", "May 22", "1h ago"],
    ["t2", "Notification digest", "p1", "Backend", "todo", "May 23", "3h ago"],
    ["t3", "Build OAuth login system", "p0", "Auth", "progress", "Today", "2d ago"],
    ["t4", "AI blocker detector", "p1", "AI", "progress", "Today", "6h ago"],
    ["t5", "Billing plan gate", "p1", "Payments", "review", "May 21", "20m ago"],
    ["t6", "Workspace role system", "p2", "Core", "done", "Done", "Yesterday"]
  ];
  for (const task of tasks) {
    await query("insert into tasks (id, title, priority, meta, status, due, updated) values ($1, $2, $3, $4, $5, $6, $7)", task);
  }
}

module.exports = { runBootstrap };
