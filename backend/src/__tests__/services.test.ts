import { describe, it, expect } from 'vitest';

import { AvailabilityService } from '../services/availability.service';
import { BookingService } from '../services/booking.service';

const availability = new AvailabilityService();
const booking = new BookingService();

describe('Nevo scheduling service', () => {
  it('finds an available Tesla for Dublin at the requested time', async () => {
    const result = await availability.requestAvailability({
      location: 'dublin',
      vehicleType: 'tesla_model3',
      startDateTime: '2023-11-01T09:00:00Z',
      durationMins: 45,
    });

    expect(result.available).toBe(true);
    expect(result.vehicles.length).toBeGreaterThan(0);
    expect(result.vehicles[0].location).toBe('dublin');
  });

  it('reserves a booking when the slot is free', async () => {
    const reservation = await booking.scheduleBooking({
      vehicleId: 'tesla_1001',
      startDateTime: '2024-11-01T09:00:00Z',
      durationMins: 45,
      customerName: 'Jane Doe',
      customerPhone: '+353853333333',
      customerEmail: 'jane@example.com',
    });

    expect(reservation.success).toBe(true);
    expect(reservation.booking).toMatchObject({
      vehicleId: 'tesla_1001',
      customerEmail: 'jane@example.com',
    });
  });
});
