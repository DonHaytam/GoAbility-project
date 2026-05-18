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

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8+
- npm or yarn

### 1. Database Setup
```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE goability"

# Run schema
mysql -u root -p goability < backend-mysql/database/schema.sql

# Seed demo data
cd backend-mysql
node database/seed.js
```

### 2. Backend Setup
```bash
cd backend-mysql
npm install
# Edit backend-mysql/.env with your MySQL credentials
npm run dev          # Runs on port 5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev          # Runs on port 3000
```

### 4. Access the Platform
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api

##  Demo Accounts

| Role    | Email             | Password    |
|---------|-------------------|-------------|
| Admin   | admin@test.com    | password123 |
| Coach   | coach@test.com    | password123 |
| Athlete | athlete@test.com  | password123 |

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

