import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { AvailabilityService, Reservation, Vehicle } from './availability.service';

export interface BookingRequest {
  vehicleId: string;
  startDateTime: string;
  durationMins: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

export interface BookingResponse {
  success: boolean;
  booking?: Reservation;
  reason?: string;
}

const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data');

export class BookingService {
  private readonly availability = new AvailabilityService();

  async scheduleBooking(request: BookingRequest): Promise<BookingResponse> {
    const vehicles = await this.loadVehicles();
    const reservations = await this.loadReservations();
    const vehicle = vehicles.find((item) => item.id === request.vehicleId);

    if (!vehicle) {
      return { success: false, reason: 'Unknown vehicle ID.' };
    }

    const availability = await this.availability.requestAvailability({
      location: vehicle.location,
      vehicleType: vehicle.type,
      startDateTime: request.startDateTime,
      durationMins: request.durationMins,
    });

    const isAvailable = availability.vehicles.some((candidate) => candidate.id === request.vehicleId);
    if (!isAvailable) {
      return { success: false, reason: 'The requested slot is not available for this vehicle.' };
    }

    const newReservation: Reservation = {
      id: Math.max(0, ...reservations.map((item) => item.id)) + 1,
      vehicleId: request.vehicleId,
      startDateTime: request.startDateTime,
      endDateTime: new Date(new Date(request.startDateTime).getTime() + request.durationMins * 60_000).toISOString(),
      customerName: request.customerName,
      customerPhone: request.customerPhone,
      customerEmail: request.customerEmail,
    };

    const updatedReservations = [...reservations, newReservation];
    await writeFile(path.join(DATA_DIR, 'reservations.json'), JSON.stringify({ reservations: updatedReservations }, null, 2), 'utf8');

    return { success: true, booking: newReservation };
  }

  private async loadVehicles(): Promise<Vehicle[]> {
    const file = await readFile(path.join(DATA_DIR, 'vehicles.json'), 'utf8');
    return JSON.parse(file).vehicles as Vehicle[];
  }

  private async loadReservations(): Promise<Reservation[]> {
    const file = await readFile(path.join(DATA_DIR, 'reservations.json'), 'utf8');
    return JSON.parse(file).reservations as Reservation[];
  }
}
