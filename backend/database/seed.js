const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database. Seeding...');

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash('password123', salt);

    // Seed Users
    await sequelize.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, phone, city, bio, is_active) VALUES
      ('admin@test.com', $1, 'Admin', 'User', 'admin', '+212 6XX-XXXXXX', 'Casablanca', 'Platform administrator', true),
      ('coach@test.com', $1, 'Dr. Amina', 'El Fassi', 'coach', '+212 6XX-XXXXXX', 'Rabat', 'Sports medicine specialist with 15 years in adaptive sports', true),
      ('athlete@test.com', $1, 'Ahmed', 'Benali', 'athlete', '+212 6XX-XXXXXX', 'Casablanca', 'Para-athlete, wheelchair racing', true)
      ON CONFLICT (email) DO NOTHING;
    `, { bind: [hash] });

    console.log('✓ Users seeded');

    // Seed Products
    await sequelize.query(`
      INSERT INTO products (seller_id, name, slug, description, category, price, rental_price, is_rentable, condition, brand, stock_count, featured, disability_compatibility) VALUES
      (1, 'Racing Wheelchair Carbon', 'racing-wheelchair-carbon-1', 'Professional-grade carbon fiber racing wheelchair. Lightweight design for maximum speed and performance.', 'Wheelchair', 25000, 1500, true, 'new', 'Quickie', 5, true, ARRAY['Physical']),
      (1, 'Basketball Wheelchair', 'basketball-wheelchair-1', 'Specialized wheelchair designed for basketball with enhanced stability and maneuverability.', 'Wheelchair', 18000, 1000, true, 'new', 'RGK', 8, true, ARRAY['Physical']),
      (1, 'Prosthetic Running Blade', 'prosthetic-running-blade-1', 'Carbon fiber running blade for below-knee amputees. Designed for competitive running.', 'Prosthetic', 35000, null, false, 'new', 'Össur', 3, true, ARRAY['Physical']),
      (1, 'Swimming Prosthetic Leg', 'swimming-prosthetic-leg-1', 'Waterproof prosthetic leg designed for swimming and water sports.', 'Prosthetic', 15000, 800, true, 'new', 'Ottobock', 4, true, ARRAY['Physical']),
      (1, 'Tactile Sports Watch', 'tactile-sports-watch-1', 'Braille-enabled sports watch with GPS tracking and heart rate monitoring for visually impaired athletes.', 'Visual Aid', 4500, 200, true, 'new', 'FeelTheWay', 15, false, ARRAY['Visual']),
      (1, 'Guide Running Tether', 'guide-running-tether-1', 'Professional guide running tether system for visually impaired runners and their guides.', 'Visual Aid', 350, null, false, 'new', 'RunAlly', 50, false, ARRAY['Visual']),
      (1, 'Hearing Aid Sports Pro', 'hearing-aid-sports-pro-2', 'Water-resistant hearing aid optimized for sports with wind noise reduction and Bluetooth.', 'Hearing Aid', 8500, 400, true, 'new', 'Phonak', 10, false, ARRAY['Hearing']),
      (1, 'Adaptive Yoga Mat', 'adaptive-yoga-mat-1', 'Extra-wide non-slip yoga mat with alignment guides for wheelchair users.', 'Sports Apparel', 450, null, false, 'new', 'GoAbility', 30, false, ARRAY['Physical', 'Visual'])
      ON CONFLICT (slug) DO NOTHING;
    `);

    console.log('✓ Products seeded');

    // Seed Training Programs
    await sequelize.query(`
      INSERT INTO training_programs (coach_id, name, description, category, disability_type, difficulty, duration_weeks, sessions_per_week, price, is_published) VALUES
      (2, 'Wheelchair Strength Foundation', 'Build foundational strength for wheelchair sports. Focus on upper body, core stability, and cardiovascular endurance.', 'Strength Training', 'Physical', 'beginner', 8, 4, 0, true),
      (2, 'Para Athletics Performance', 'Advanced training program for competitive para-athletics. Includes sprint drills, technique work, and race strategy.', 'Athletics', 'Physical', 'advanced', 12, 5, 299, true),
      (2, 'Adaptive Yoga & Flexibility', 'Gentle yoga and flexibility program adapted for various disabilities. Improve mobility, reduce pain, and enhance well-being.', 'Flexibility', 'Physical', 'beginner', 6, 3, 0, true),
      (2, 'Goalball Training Program', 'Complete training program for Goalball players. Catching, throwing, defensive positioning, and team tactics.', 'Team Sports', 'Visual', 'intermediate', 10, 4, 149, true)
    `);

    console.log('✓ Training programs seeded');

    // Seed Training Sessions
    await sequelize.query(`
      INSERT INTO training_sessions (program_id, title, description, video_url, duration_minutes, week_number, day_number, exercises) VALUES
      (1, 'Upper Body Strength', 'Push-ups, pull-ups, and shoulder presses adapted for wheelchair athletes', NULL, 45, 1, 1, '[]'),
      (1, 'Core Stability', 'Core exercises focusing on balance and rotational strength', NULL, 40, 1, 2, '[]'),
      (1, 'Cardio Intervals', 'High-intensity interval training using arm ergometer', NULL, 30, 1, 3, '[]'),
      (1, 'Recovery & Stretching', 'Active recovery session with targeted stretching', NULL, 35, 1, 4, '[]')
    `);

    console.log('✓ Training sessions seeded');

    // Seed Forum Posts
    await sequelize.query(`
      INSERT INTO forum_posts (user_id, title, content, category, is_pinned, is_approved) VALUES
      (3, 'Welcome to GoAbility Community!', 'Welcome everyone! This is your space to connect, share experiences, and support each other. Feel free to introduce yourself!', 'General', true, true),
      (3, 'Looking for wheelchair basketball team in Casablanca', 'Hi all! I am looking for a wheelchair basketball team in the Casablanca area. Any recommendations?', 'Equipment', false, true),
      (3, 'Best exercises for shoulder strength?', 'As a wheelchair user, I want to improve my shoulder strength for better mobility and sports performance. Any tips?', 'Training', false, true),
      (2, 'Upcoming Adaptive Sports Workshop', 'Announcing our upcoming workshop on adaptive sports techniques. Open to all levels!', 'Events', false, true)
    `);

    console.log('✓ Forum posts seeded');

    // Seed Events
    await sequelize.query(`
      INSERT INTO events (organizer_id, title, description, event_type, event_date, location, max_participants) VALUES
      (2, 'Casablanca Adaptive Sports Day', 'A day of adaptive sports activities including wheelchair basketball, tennis, and athletics.', 'competition', '2026-07-15 09:00:00', 'Casablanta Sports Complex', 100),
      (2, 'Workshop: Choosing Your Sports Wheelchair', 'Learn how to choose the right wheelchair for your sport from our expert coaches.', 'workshop', '2026-06-20 14:00:00', 'Online', 50),
      (1, 'GoAbility Community Meetup', 'Monthly community meetup to connect, share experiences, and plan upcoming events.', 'meetup', '2026-06-01 18:00:00', 'Rabat Community Center', 30)
    `);

    console.log('✓ Events seeded');

    // Seed Associations
    await sequelize.query(`
      INSERT INTO associations (name, description, city, type, is_verified, email, phone) VALUES
      ('Moroccan Association for Adaptive Sports', 'National organization promoting adaptive sports across Morocco.', 'Rabat', 'Sports Federation', true, 'contact@amss.ma', '+212 5XX-XXXXXX'),
      ('Casablanca Paralympic Club', 'Local club providing training and competition opportunities for para-athletes.', 'Casablanca', 'Sports Club', true, 'info@cpc.ma', '+212 5XX-XXXXXX'),
      ('Association Avenir pour Tous', 'NGO focused on inclusive sports for children with disabilities.', 'Marrakech', 'NGO', true, 'contact@avenirpourtous.ma', '+212 5XX-XXXXXX')
    `);

    console.log('✓ Associations seeded');

    // Seed Success Stories
    await sequelize.query(`
      INSERT INTO success_stories (user_id, title, content, is_approved, is_featured) VALUES
      (3, 'From Accident to Athlete: My Journey with GoAbility', 'After my accident in 2023, I thought my sports career was over. GoAbility connected me with the right equipment and coaches. Now I am training for the 2028 Paralympics! This platform changed my life completely.', true, true),
      (3, 'Finding Community Through Sports', 'When I moved to Casablanca, I felt isolated. Through GoAbility I found a wheelchair basketball team and made incredible friends. Sports brought back my confidence.', true, true)
    `);

    console.log('✓ Success stories seeded');

    // Seed Contact Messages
    await sequelize.query(`
      INSERT INTO contact_messages (name, email, subject, message) VALUES
      ('Fatima Zahra', 'fatima@example.com', 'Partnership Inquiry', 'Dear GoAbility team, I would like to explore partnership opportunities between our association and your platform. We support over 200 athletes with disabilities in Marrakech.')
    `);

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
