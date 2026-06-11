import express from 'express';

import { AvailabilityService } from './services/availability.service';
import { BookingService } from './services/booking.service';
import { validateAvailabilityInput, validateBookingInput } from './validation';

const app = express();
const port = Number(process.env.PORT || 3000);
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const requestBuckets = new Map<string, number[]>();

function rateLimit(req: any, res: any, next: any): void {
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.ip || 'unknown';
  const now = Date.now();
  const recentRequests = (requestBuckets.get(ip) || []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  recentRequests.push(now);
  requestBuckets.set(ip, recentRequests);

  if (recentRequests.length > RATE_LIMIT_MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please wait a minute and try again.',
    });
    return;
  }

  next();
}

app.use(express.json());
app.use(rateLimit);
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
    validateAvailabilityInput(req.body);
    const result = await availability.requestAvailability(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to check availability.' });
  }
});

app.post('/bookings', async (req, res) => {
  try {
    validateBookingInput(req.body);
    const result = await booking.scheduleBooking(req.body);
    res.status(result.success ? 201 : 409).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Unable to create booking.' });
  }
});

app.listen(port, () => {
  console.log(`Nevo backend listening on http://localhost:${port}`);
});
