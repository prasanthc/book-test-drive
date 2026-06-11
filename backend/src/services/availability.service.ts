import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Vehicle {
  id: string;
  type: string;
  location: string;
  availableFromTime: string;
  availableToTime: string;
  availableDays: string[];
  minimumMinutesBetweenBookings: number;
}

export interface Reservation {
  id: number;
  vehicleId: string;
  startDateTime: string;
  endDateTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface AvailabilityRequest {
  location: string;
  vehicleType: string;
  startDateTime: string;
  durationMins: number;
}

export interface AvailabilityResponse {
  available: boolean;
  vehicles: Vehicle[];
  requestedAt: string;
  reason?: string;
}

const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data');

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseTime(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function toUtcDate(value: string): Date {
  return new Date(value);
}

function dayName(date: Date): string {
  return ['sun', 'mon', 'tue', 'wed', 'thur', 'fri', 'sat'][date.getUTCDay()];
}

function overlaps(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && endA > startB;
}

function hasMinimumBuffer(reservationStart: number, reservationEnd: number, requestedStart: number, requestedEnd: number, minimumMinutes: number): boolean {
  const bufferStart = requestedStart - minimumMinutes * 60 * 1000;
  const bufferEnd = requestedEnd + minimumMinutes * 60 * 1000;
  return reservationStart < bufferEnd && reservationEnd > bufferStart;
}

export class AvailabilityService {
  async requestAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    const vehicles = await this.loadVehicles();
    const reservations = await this.loadReservations();

    const requestedStart = toUtcDate(request.startDateTime);
    const requestedEnd = new Date(requestedStart.getTime() + request.durationMins * 60_000);

    const candidates = vehicles.filter((vehicle) => {
      const matchesLocation = normalize(vehicle.location) === normalize(request.location);
      const matchesType = !request.vehicleType || normalize(vehicle.type).includes(normalize(request.vehicleType)) || normalize(request.vehicleType).includes(normalize(vehicle.type));

      if (!matchesLocation || !matchesType) {
        return false;
      }

      const weekday = dayName(requestedStart);
      if (!vehicle.availableDays.includes(weekday)) {
        return false;
      }

      const fromMinutes = parseTime(vehicle.availableFromTime);
      const toMinutes = parseTime(vehicle.availableToTime);
      const requestedStartMinutes = requestedStart.getUTCHours() * 60 + requestedStart.getUTCMinutes();
      const requestedEndMinutes = requestedEnd.getUTCHours() * 60 + requestedEnd.getUTCMinutes();

      if (requestedStartMinutes < fromMinutes || requestedEndMinutes > toMinutes) {
        return false;
      }

      const existingReservations = reservations.filter((reservation) => reservation.vehicleId === vehicle.id);
      const hasConflict = existingReservations.some((reservation) => {
        const currentStart = toUtcDate(reservation.startDateTime).getTime();
        const currentEnd = toUtcDate(reservation.endDateTime).getTime();
        const withinOverlap = overlaps(requestedStart.getTime(), requestedEnd.getTime(), currentStart, currentEnd);
        if (withinOverlap) {
          return true;
        }

        return hasMinimumBuffer(
          currentStart,
          currentEnd,
          requestedStart.getTime(),
          requestedEnd.getTime(),
          vehicle.minimumMinutesBetweenBookings,
        );
      });

      return !hasConflict;
    });

    const ranked = candidates
      .map((vehicle) => ({
        vehicle,
        bookingCount: reservations.filter((reservation) => reservation.vehicleId === vehicle.id).length,
      }))
      .sort((left, right) => left.bookingCount - right.bookingCount || left.vehicle.id.localeCompare(right.vehicle.id));

    return {
      available: ranked.length > 0,
      vehicles: ranked.map((entry) => entry.vehicle),
      requestedAt: new Date().toISOString(),
      reason: ranked.length > 0 ? undefined : 'No vehicles are available for the requested location, day, or time slot.',
    };
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
