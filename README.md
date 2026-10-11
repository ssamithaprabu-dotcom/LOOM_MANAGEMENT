# Loom Monitoring & Control System

A frontend-only industrial loom monitoring dashboard built with React, Vite, Tailwind CSS, React Router, Lucide React, and Recharts.

## Features

- Secure demo login with localStorage state persistence
- Dark professional factory control-room dashboard
- Live monitoring cards for each loom
- Summary metric cards with automatic state updates
- Loom management table with search, filter, sort, add, edit, and delete flows
- Dynamic set configuration generation and Wi-Fi configuration UI
- Control panel with START, STOP, REVERSE, and SINGLE TAKE actions
- Confirmation dialogs, toasts, and notification center
- Local storage persistence for user state, looms, notifications, and settings

## Demo credentials

- Username: admin
- Password: admin123

## Local development

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 4173
```

Then open:

- http://localhost:4173/

## Production build

```bash
npm run build
```
