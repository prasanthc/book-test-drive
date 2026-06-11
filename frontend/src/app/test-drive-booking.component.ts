import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-test-drive-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './test-drive-booking.component.html',
  styleUrls: ['./test-drive-booking.component.css'],
})
export class TestDriveBookingComponent {
  @Input() vehicleType = '';
  @Input() location = 'dublin';

  private readonly http = inject(HttpClient);

  selectedDate = this.nextDateString(1);
  selectedTime = '09:00';
  customerFirstName = '';
  customerLastName = '';
  customerPhone = '';
  customerEmail = '';

  availabilityMessage = 'Select a date and time to see available vehicles.';
  availableVehicles: Array<{ id: string; type: string; location: string }> = [];
  bookingMessage = '';

  readonly next14Days = this.buildNext14Days();

  checkAvailability(): void {
    const startDateTime = `${this.selectedDate}T${this.selectedTime}:00Z`;

    this.availabilityMessage = 'Checking available vehicles...';
    this.bookingMessage = '';

    this.http
      .post<any>('http://localhost:3000/availability', {
        location: this.location,
        vehicleType: this.vehicleType,
        startDateTime,
        durationMins: 45,
      })
      .subscribe({
        next: (response) => {
          this.availableVehicles = response.vehicles ?? [];
          if (response.available) {
            this.availabilityMessage = `${response.vehicles.length} vehicle(s) available for this slot. The service balances demand across the least-booked cars.`;
          } else {
            this.availabilityMessage = response.reason || 'No vehicles are available for this slot.';
          }
        },
        error: () => {
          this.availabilityMessage = 'Unable to reach the backend service on http://localhost:3000.';
          this.availableVehicles = [];
        },
      });
  }

  bookTestDrive(vehicleId: string): void {
    const startDateTime = `${this.selectedDate}T${this.selectedTime}:00Z`;

    this.bookingMessage = 'Reserving your slot...';

    this.http
      .post<any>('http://localhost:3000/bookings', {
        vehicleId,
        startDateTime,
        durationMins: 45,
        customerName: this.customerFirstName +' '+ this.customerLastName,
        customerPhone: this.customerPhone,
        customerEmail: this.customerEmail,
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.bookingMessage = `Booking confirmed for ${vehicleId}. Reference #${response.booking.id}.`;
          } else {
            this.bookingMessage = response.reason || 'The slot could not be reserved.';
          }
        },
        error: () => {
          this.bookingMessage = 'Booking failed. Verify the backend is running.';
        },
      });
  }

  private buildNext14Days(): Array<{ label: string; value: string }> {
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() + index + 1);
      return {
        label: date.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
        value: date.toISOString().slice(0, 10),
      };
    });
  }

  private nextDateString(offset: number): string {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + offset);
    return date.toISOString().slice(0, 10);
  }
}
