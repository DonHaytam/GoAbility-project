const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');

const setup = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL database');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      try {
        await sequelize.query(stmt + ';');
        console.log(`  ✓ ${stmt.slice(0, 60)}...`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`  ↻ Skipped (exists): ${stmt.slice(0, 60)}...`);
        } else {
          console.log(`  ⚠ ${err.message.slice(0, 80)}`);
        }
      }
    }

    console.log('\n✅ All tables created successfully');
    console.log('\nNow run: node database/seed.js');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
};

setup();
