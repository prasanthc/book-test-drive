import express from 'express';

import { AvailabilityService } from './services/availability.service';
import { BookingService } from './services/booking.service';

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

const availability = new AvailabilityService();
const booking = new BookingService();

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'Nevo test drive backend' });
});

app.post('/availability', async (req, res) => {
  try {
    const result = await availability.requestAvailability(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to check availability.' });
  }
});

app.post('/bookings', async (req, res) => {
  try {
    const result = await booking.scheduleBooking(req.body);
    res.status(result.success ? 201 : 409).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Unable to create booking.' });
  }
});

app.listen(port, () => {
  console.log(`Nevo backend listening on http://localhost:${port}`);
});
