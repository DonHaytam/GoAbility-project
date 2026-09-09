const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ uri: process.env.DB_URL, ssl: { rejectUnauthorized: false }, multipleStatements: true });
  const [cols] = await c.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'forum_posts' AND COLUMN_NAME = 'likes_count'");
  if (cols.length === 0) {
    await c.query('ALTER TABLE forum_posts ADD COLUMN likes_count INTEGER DEFAULT 0 AFTER view_count');
    console.log('ALTER forum_posts.likes_count: OK');
  } else {
    console.log('forum_posts.likes_count: already present');
  }
  await c.query(`CREATE TABLE IF NOT EXISTS post_likes (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_post_like (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  console.log('CREATE post_likes: OK');
  await c.query(`CREATE TABLE IF NOT EXISTS story_likes (
    id VARCHAR(36) PRIMARY KEY,
    story_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_story_like (story_id, user_id),
    FOREIGN KEY (story_id) REFERENCES success_stories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  console.log('CREATE story_likes: OK');
  await c.end();
  console.log('MIGRATION COMPLETE');
})().catch(e => { console.error('ERR: ' + e.code + ' ' + e.message); process.exit(1); });