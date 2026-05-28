async function buildFullState({ query, queryOne, passwordResetLog, sessionUserId = null, formatUser }) {
  const [usersResult, membersResult, billing, tasksResult, snippetsResult, activityResult, commentsResult, notificationsResult, resetLog] = await Promise.all([
    query("select * from users order by id asc"),
    query("select * from members order by id asc"),
    queryOne("select * from billing where id = 1"),
    query("select * from tasks order by id asc"),
    query("select * from snippets order by id asc"),
    query("select message from activity order by id desc"),
    query("select id, author, text, time from comments order by created_at desc, id desc"),
    query("select id, title, body, unread from notifications order by created_at desc, id desc"),
    passwordResetLog()
  ]);

  return {
    users: usersResult.rows.map(formatUser),
    sessionUserId,
    members: membersResult.rows,
    billing: {
      plan: billing?.plan || "Free",
      amount: billing?.amount || "Rs 0/month",
      memberLimit: billing?.member_limit || 5,
      renewal: billing?.renewal || "Not applicable",
      savedCard: billing?.card_last4 ? { name: billing.card_name, masked: `**** **** **** ${billing.card_last4}` } : null
    },
    passwordResetLog: resetLog,
    tasks: tasksResult.rows,
    snippets: snippetsResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      tags: Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags || "[]"),
      code: row.code,
      score: row.score,
      review: Array.isArray(row.review) ? row.review : JSON.parse(row.review || "[]")
    })),
    activity: activityResult.rows.map((row) => row.message),
    comments: commentsResult.rows,
    notifications: notificationsResult.rows.map((row) => ({ ...row, unread: Boolean(row.unread) }))
  };
}

module.exports = { buildFullState };
