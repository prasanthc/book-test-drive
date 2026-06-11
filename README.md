# Nevo Test Drive Service

This workspace contains:

- Backend: Node.js + Express service for availability checks and booking reservations
- Frontend: Angular booking component for a simple EV test-drive UI

## Run the backend

```bash
cd backend
npm install
npm run dev
```

The API will be available at http://localhost:3000.

## Run the frontend

```bash
cd frontend
npm install
npm run start
```

The Angular UI will be available at http://localhost:4200.

## API overview

- POST /availability
- POST /bookings
