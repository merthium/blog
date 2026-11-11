-- Mevcut comments tablosunu ve yorumları değiştirmez.
CREATE TABLE IF NOT EXISTS comment_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL UNIQUE REFERENCES comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  notification_status TEXT NOT NULL DEFAULT 'none'
    CHECK (notification_status IN ('none', 'pending', 'sent', 'failed', 'uncertain')),
  notification_message_id TEXT,
  notified_at INTEGER
);
CREATE TABLE IF NOT EXISTS comment_subscriptions (
  comment_id INTEGER PRIMARY KEY REFERENCES comments(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comment_replies_comment_id ON comment_replies(comment_id);
