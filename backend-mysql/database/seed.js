const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database. Seeding...\n');

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash('password123', salt);

    const adminId = uuidv4();
    const coachId = uuidv4();
    const athleteId = uuidv4();

    await sequelize.query(
      `INSERT IGNORE INTO users (id, email, password_hash, first_name, last_name, role, phone, city, bio, is_active) VALUES
      (?, ?, ?, 'Admin', 'User', 'admin', '+212 6XX-XXXXXX', 'Casablanca', 'Platform administrator', true)`,
      { replacements: [adminId, 'admin@test.com', hash] }
    );
    await sequelize.query(
      `INSERT IGNORE INTO users (id, email, password_hash, first_name, last_name, role, phone, city, bio, is_active) VALUES
      (?, ?, ?, 'Dr. Amina', 'El Fassi', 'coach', '+212 6XX-XXXXXX', 'Rabat', 'Sports medicine specialist with 15 years in adaptive sports', true)`,
      { replacements: [coachId, 'coach@test.com', hash] }
    );
    await sequelize.query(
      `INSERT IGNORE INTO users (id, email, password_hash, first_name, last_name, role, phone, city, bio, is_active) VALUES
      (?, ?, ?, 'Ahmed', 'Benali', 'athlete', '+212 6XX-XXXXXX', 'Casablanca', 'Para-athlete, wheelchair racing', true)`,
      { replacements: [athleteId, 'athlete@test.com', hash] }
    );

    console.log('✓ Users seeded');

    // Seed Products
    const p1 = uuidv4(), p2 = uuidv4(), p3 = uuidv4(), p4 = uuidv4(), p5 = uuidv4(), p6 = uuidv4(), p7 = uuidv4(), p8 = uuidv4();

    await sequelize.query(
      `INSERT IGNORE INTO products (id, seller_id, name, slug, description, category, price, rental_price, is_rentable, \`condition\`, brand, stock_count, featured, disability_compatibility) VALUES
      (?, ?, 'Racing Wheelchair Carbon', 'racing-wheelchair-carbon-1', 'Professional-grade carbon fiber racing wheelchair.', 'Wheelchair', 25000, 1500, true, 'new', 'Quickie', 5, true, ?),
      (?, ?, 'Basketball Wheelchair', 'basketball-wheelchair-1', 'Specialized wheelchair for basketball with enhanced stability.', 'Wheelchair', 18000, 1000, true, 'new', 'RGK', 8, true, ?),
      (?, ?, 'Prosthetic Running Blade', 'prosthetic-running-blade-1', 'Carbon fiber running blade for below-knee amputees.', 'Prosthetic', 35000, null, false, 'new', 'Össur', 3, true, ?),
      (?, ?, 'Swimming Prosthetic Leg', 'swimming-prosthetic-leg-1', 'Waterproof prosthetic leg for swimming and water sports.', 'Prosthetic', 15000, 800, true, 'new', 'Ottobock', 4, true, ?),
      (?, ?, 'Tactile Sports Watch', 'tactile-sports-watch-1', 'Braille-enabled sports watch with GPS tracking.', 'Visual Aid', 4500, 200, true, 'new', 'FeelTheWay', 15, false, ?),
      (?, ?, 'Guide Running Tether', 'guide-running-tether-1', 'Professional guide running tether system.', 'Visual Aid', 350, null, false, 'new', 'RunAlly', 50, false, ?),
      (?, ?, 'Hearing Aid Sports Pro', 'hearing-aid-sports-pro-2', 'Water-resistant hearing aid optimized for sports.', 'Hearing Aid', 8500, 400, true, 'new', 'Phonak', 10, false, ?),
      (?, ?, 'Adaptive Yoga Mat', 'adaptive-yoga-mat-1', 'Extra-wide non-slip yoga mat with alignment guides.', 'Sports Apparel', 450, null, false, 'new', 'GoAbility', 30, false, ?)`,
      { replacements: [
        p1, adminId, JSON.stringify(['Physical']),
        p2, adminId, JSON.stringify(['Physical']),
        p3, adminId, JSON.stringify(['Physical']),
        p4, adminId, JSON.stringify(['Physical']),
        p5, adminId, JSON.stringify(['Visual']),
        p6, adminId, JSON.stringify(['Visual']),
        p7, adminId, JSON.stringify(['Hearing']),
        p8, adminId, JSON.stringify(['Physical', 'Visual']),
      ]}
    );
    console.log('✓ Products seeded');

    // Seed Training Programs
    const tp1 = uuidv4(), tp2 = uuidv4(), tp3 = uuidv4(), tp4 = uuidv4();

    await sequelize.query(
      `INSERT IGNORE INTO training_programs (id, coach_id, name, description, category, disability_type, difficulty, duration_weeks, sessions_per_week, price, is_published) VALUES
      (?, ?, 'Wheelchair Strength Foundation', 'Build foundational strength for wheelchair sports.', 'Strength Training', 'Physical', 'beginner', 8, 4, 0, true),
      (?, ?, 'Para Athletics Performance', 'Advanced training for competitive para-athletics.', 'Athletics', 'Physical', 'advanced', 12, 5, 299, true),
      (?, ?, 'Adaptive Yoga & Flexibility', 'Gentle yoga program adapted for various disabilities.', 'Flexibility', 'Physical', 'beginner', 6, 3, 0, true),
      (?, ?, 'Goalball Training Program', 'Complete training for Goalball players.', 'Team Sports', 'Visual', 'intermediate', 10, 4, 149, true)`,
      { replacements: [tp1, coachId, tp2, coachId, tp3, coachId, tp4, coachId] }
    );
    console.log('✓ Training programs seeded');

    // Seed Training Sessions
    const ts1 = uuidv4(), ts2 = uuidv4(), ts3 = uuidv4(), ts4 = uuidv4();
    await sequelize.query(
      `INSERT IGNORE INTO training_sessions (id, program_id, title, description, duration_minutes, week_number, day_number, exercises) VALUES
      (?, ?, 'Upper Body Strength', 'Push-ups, pull-ups, and shoulder presses for wheelchair athletes', 45, 1, 1, '[]'),
      (?, ?, 'Core Stability', 'Core exercises focusing on balance and rotational strength', 40, 1, 2, '[]'),
      (?, ?, 'Cardio Intervals', 'High-intensity interval training using arm ergometer', 30, 1, 3, '[]'),
      (?, ?, 'Recovery & Stretching', 'Active recovery session with targeted stretching', 35, 1, 4, '[]')`,
      { replacements: [ts1, tp1, ts2, tp1, ts3, tp1, ts4, tp1] }
    );
    console.log('✓ Training sessions seeded');

    // Seed Forum Posts
    const fp1 = uuidv4(), fp2 = uuidv4(), fp3 = uuidv4(), fp4 = uuidv4();
    await sequelize.query(
      `INSERT IGNORE INTO forum_posts (id, user_id, title, content, category, is_pinned, is_approved) VALUES
      (?, ?, 'Welcome to GoAbility Community!', 'Welcome everyone! This is your space to connect, share experiences, and support each other.', 'General', true, true),
      (?, ?, 'Looking for wheelchair basketball team in Casablanca', 'Hi all! Looking for a wheelchair basketball team in Casablanca.', 'Equipment', false, true),
      (?, ?, 'Best exercises for shoulder strength?', 'As a wheelchair user, I want to improve shoulder strength. Any tips?', 'Training', false, true),
      (?, ?, 'Upcoming Adaptive Sports Workshop', 'Announcing our upcoming workshop on adaptive sports.', 'Events', false, true)`,
      { replacements: [fp1, athleteId, fp2, athleteId, fp3, athleteId, fp4, coachId] }
    );
    console.log('✓ Forum posts seeded');

    // Seed Events
    const ev1 = uuidv4(), ev2 = uuidv4(), ev3 = uuidv4();
    await sequelize.query(
      `INSERT IGNORE INTO events (id, organizer_id, title, description, event_type, event_date, location, max_participants) VALUES
      (?, ?, 'Casablanca Adaptive Sports Day', 'A day of adaptive sports activities.', 'competition', '2026-07-15 09:00:00', 'Casablanca Sports Complex', 100),
      (?, ?, 'Workshop: Choosing Your Sports Wheelchair', 'Learn to choose the right wheelchair for your sport.', 'workshop', '2026-06-20 14:00:00', 'Online', 50),
      (?, ?, 'GoAbility Community Meetup', 'Monthly community meetup.', 'meetup', '2026-06-01 18:00:00', 'Rabat Community Center', 30)`,
      { replacements: [ev1, coachId, ev2, adminId, ev3, adminId] }
    );
    console.log('✓ Events seeded');

    // Seed Associations
    const a1 = uuidv4(), a2 = uuidv4(), a3 = uuidv4();
    await sequelize.query(
      `INSERT IGNORE INTO associations (id, name, description, city, type, is_verified, email, phone) VALUES
      (?, 'Moroccan Association for Adaptive Sports', 'National organization promoting adaptive sports.', 'Rabat', 'Sports Federation', true, 'contact@amss.ma', '+212 5XX-XXXXXX'),
      (?, 'Casablanca Paralympic Club', 'Local club providing training for para-athletes.', 'Casablanca', 'Sports Club', true, 'info@cpc.ma', '+212 5XX-XXXXXX'),
      (?, 'Association Avenir pour Tous', 'NGO focused on inclusive sports for children with disabilities.', 'Marrakech', 'NGO', true, 'contact@avenirpourtous.ma', '+212 5XX-XXXXXX')`,
      { replacements: [a1, a2, a3] }
    );
    console.log('✓ Associations seeded');

    // Seed Success Stories
    const s1 = uuidv4(), s2 = uuidv4();
    await sequelize.query(
      `INSERT IGNORE INTO success_stories (id, user_id, title, content, is_approved, is_featured) VALUES
      (?, ?, 'From Accident to Athlete: My Journey with GoAbility', 'After my accident in 2023, I thought my sports career was over. GoAbility connected me with the right equipment and coaches. Now I am training for the 2028 Paralympics!', true, true),
      (?, ?, 'Finding Community Through Sports', 'Through GoAbility I found a wheelchair basketball team and made incredible friends. Sports brought back my confidence.', true, true)`,
      { replacements: [s1, athleteId, s2, athleteId] }
    );
    console.log('✓ Success stories seeded');

    // Seed Contact
    const c1 = uuidv4();
    await sequelize.query(
      `INSERT IGNORE INTO contact_messages (id, name, email, subject, message) VALUES
      (?, 'Fatima Zahra', 'fatima@example.com', 'Partnership Inquiry', 'I would like to explore partnership opportunities between our association and your platform.')`,
      { replacements: [c1] }
    );
    console.log('✓ Contact messages seeded');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDemo Accounts:');
    console.log('  Admin:   admin@test.com / password123');
    console.log('  Coach:   coach@test.com / password123');
    console.log('  Athlete: athlete@test.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
