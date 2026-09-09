const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ uri: process.env.DB_URL, ssl: { rejectUnauthorized: false } });
  const [t] = await c.query("SHOW TABLES LIKE '%like%'");
  console.log('LIKE TABLES: ' + JSON.stringify(t.map(r => Object.values(r)[0])));
  const [tv] = await c.query("SHOW TABLES LIKE 'forum%'");
  console.log('FORUM TABLES: ' + JSON.stringify(tv.map(r => Object.values(r)[0])));
  const [p] = await c.query('SHOW COLUMNS FROM forum_posts');
  console.log('forum_posts cols: ' + p.map(x => x.Field).join(', '));
  const [pl] = await c.query('SHOW COLUMNS FROM post_likes').catch(e => 'ERR ' + e.code);
  console.log('post_likes cols: ' + (Array.isArray(pl) ? pl.map(x => x.Field).join(', ') : pl));
  const [st] = await c.query('SHOW COLUMNS FROM success_stories');
  console.log('success_stories cols: ' + st.map(x => x.Field).join(', '));
  const [sl] = await c.query('SHOW COLUMNS FROM story_likes').catch(e => 'ERR ' + e.code);
  console.log('story_likes cols: ' + (Array.isArray(sl) ? sl.map(x => x.Field).join(', ') : sl));
  await c.end();
})().catch(e => { console.error('ERR: ' + e.code + ' ' + e.message); process.exit(1); });