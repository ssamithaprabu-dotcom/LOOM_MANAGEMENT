# Loomatrix – Smart Loom Monitoring & Control System (LOOM_MANAGEMENT)

An industrial-grade supervisory monitoring and machine management system built with React, Vite, Tailwind CSS, Express, and SQL database (SQLite / MySQL).

## Features

- Secure authentication with JWT and bcrypt password hashing
- Industrial operational dashboard with real-time status and telemetry
- Dynamic multi-set production rules (Take-up and Meter progression)
- Comprehensive loom management with search, filter, sort, add, edit, and cascade delete
- Controller Wi-Fi configuration with genuine TCP socket testing
- Supervisory machine control actions (START, STOP, REVERSE, SINGLE TAKE) with audit logs
- Dual-theme interface (Light & Dark mode) with responsive layout
- SQL relational persistence supporting SQLite and MySQL

## Demo Credentials

- Username: admin
- Password: admin123

## Local Development

```bash
# Install dependencies
npm install

# Start backend server (Port 5000)
npm run server

# Start frontend dev server (Port 5173)
npm run dev
```

Open: http://localhost:5173/

## Production Build

```bash
npm run build
```

