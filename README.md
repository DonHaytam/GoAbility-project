# GoAbility (HandiSport Connect)

**The leading inclusive sports technology platform for people with disabilities in Morocco and beyond.**

## Mission

Empowering people with physical disabilities through adaptive sports equipment, personalized training programs, performance tracking, and a supportive community ecosystem.

## Tech Stack

### Frontend
- **Next.js 14** - React framework with SSR
- **React 18** - UI components
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations
- **Chart.js / Recharts** - Data visualization
- **i18next** - Multilingual (English, French, Arabic)

### Backend
- **Node.js** - Runtime
- **Express.js** - REST API
- **JWT** - Authentication
- **MySQL** - Database
- **Sequelize** - ORM

##  Project Structure

```
goability-platform/
├── backend-mysql/              # Active Express API
│   ├── server.js              # Express server entry point
│   ├── config/database.js     # MySQL configuration
│   ├── database/
│   │   ├── schema.sql         # Complete database schema
│   │   └── seed.js            # Demo data seeder
│   ├── middleware/auth.js     # JWT authentication middleware
│   ├── routes/                # API routes
│   │   ├── auth.js            # Authentication (register/login)
│   │   ├── users.js           # User management
│   │   ├── products.js        # Marketplace products
│   │   ├── orders.js          # Order management
│   │   ├── training.js        # Training programs & progress
│   │   ├── community.js       # Forum, events, stories
│   │   ├── payments.js        # Fake payments
│   │   ├── analytics.js       # Dashboard analytics
│   │   ├── contact.js         # Contact form
│   │   └── messages.js        # Messaging system
│   └── node_modules/
├── frontend/
│   ├── pages/                 # Next.js pages
│   │   ├── index.js           # Home page
│   │   ├── about.js           # About project
│   │   ├── training.js        # Training programs
│   │   ├── community.js       # Community hub
│   │   ├── contact.js         # Contact form
│   │   ├── marketplace/       # Marketplace pages
│   │   ├── auth/              # Login/Register
│   │   ├── dashboard/         # Athlete dashboard
│   │   ├── coach/             # Coach dashboard
│   │   └── admin/             # Admin panel
│   ├── components/            # Reusable components
│   ├── context/AuthContext.js # Auth state management
│   ├── lib/
│   │   ├── api.js             # API client (axios)
│   │   └── i18n.js            # i18next configuration
│   └── styles/globals.css     # Global styles & Tailwind
└── README.md
```

## Getting Started (Local Development)

### Prerequisites
- **Node.js** 18+ (Download: https://nodejs.org)
- **MySQL** 8+ (Download: https://dev.mysql.com/downloads/installer/)
- **npm** (comes with Node.js)
- **Git** (Download: https://git-scm.com)

### Step 1: Clone & Install
```bash
git clone https://github.com/DonHaytam/GoAbility-project.git
cd GoAbility-project

# Install backend dependencies
cd backend-mysql
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Database Setup

**Option A: Local MySQL (recommended for new devs)**
```bash
# Open MySQL command line or MySQL Workbench and run:
CREATE DATABASE goability;
USE goability;
SOURCE backend-mysql/database/schema.sql;
```
Then seed demo data:
```bash
cd backend-mysql
cp .env.example .env    # Create your .env file
node database/seed.js
```

**Option B: Remote MySQL (e.g. Aiven)**
Edit `backend-mysql/.env`:
```env
DB_URL=mysql://username:password@host:3306/dbname?ssl-mode=REQUIRED
DB_SSL=true
JWT_SECRET=your_random_secret_here
```

### Step 3: Configure Environment
Edit `backend-mysql/.env` (copy from `.env.example` if needed):
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=goability
DB_USER=root
DB_PASSWORD=
JWT_SECRET=your_random_64_char_secret
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Step 4: Start the Backend
```bash
cd backend-mysql
npm run dev    # Starts on http://localhost:5000
```

### Step 5: Start the Frontend (new terminal)
```bash
cd frontend
npm run dev    # Starts on http://localhost:3000
```

### Step 6: Access the Platform
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health check:** http://localhost:5000/api/health

### Troubleshooting
| Problem | Solution |
|---------|----------|
| `EADDRINUSE :::5000` | Port 5000 is busy. Run `taskkill /F /IM node.exe` (Windows) or `killall node` (Mac/Linux) |
| `ECONNREFUSED` | Backend isn't running. Start it with `npm run dev` in `backend-mysql/` |
| `429 Too Many Requests` | Rate limiter triggered. Restart the backend (`Ctrl+C`, then `npm run dev`) |
| Database connection error | Check your `.env` DB credentials and make sure MySQL is running |
| `Please install mysql2 package` | Run `npm install` in `backend-mysql/` |

##  Brand Identity

### Colors
- **Primary:** Dark Navy #0B2545, Ocean Blue #134074, Cyan #0077B6
- **Secondary:** Green Gradient (#70C1B3 → #52B788), Apple Green #74C69D
- **Background:** Light Gray #F8F9FA

### Design Philosophy
Medical credibility + Sports energy + Modern startup + Accessibility-first

##  Features

### Public Pages
- Hero section with mission statement
- Problem/Solution overview
- Social impact metrics & testimonials
- Complete marketplace with search/filters
- Training programs catalog
- Community forum, events, stories

### User Roles & Dashboards

#### Athlete Dashboard
- Personal & disability profile
- Order history & tracking
- Training enrollment & progress
- Performance charts & analytics
- Saved products & messages

#### Coach Dashboard
- Athlete management
- Program creation & management
- Progress reports
- Communication tools

#### Admin Dashboard
- User management (CRUD, role control)
- Product management
- Order management & status updates
- Platform analytics & KPIs
- Community moderation

### Key Capabilities
- JWT authentication with role-based access
- Buy/Rent marketplace system
- Fake payment demo workflow
- Multilingual (EN/FR/AR) with RTL support
- WCAG accessibility standards
- Responsive design (mobile → desktop)
- Search & advanced filters

