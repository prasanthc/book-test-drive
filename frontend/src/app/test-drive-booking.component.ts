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

  validationMessage = '';

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
    if (!this.validateAvailabilityForm()) {
      return;
    }

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
    if (!this.validateBookingForm()) {
      return;
    }

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

  private validateAvailabilityForm(): boolean {
    if (!this.customerFirstName.trim() || !this.customerLastName.trim()) {
      this.availabilityMessage = 'Please enter your first and last name before checking availability.';
      return false;
    }

    if (!this.customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.customerEmail)) {
      this.availabilityMessage = 'Please enter a valid email address before checking availability.';
      return false;
    }

    if (!this.location || !this.location.trim()) {
      this.availabilityMessage = 'Please select a location before checking availability.';
      return false;
    }

    if (!this.vehicleType || !this.vehicleType.trim()) {
      this.availabilityMessage = 'Vehicle type is required for availability lookup.';
      return false;
    }

    if (!this.selectedDate || !this.selectedTime) {
      this.availabilityMessage = 'Please choose a valid date and time.';
      return false;
    }

    const selectedDate = new Date(`${this.selectedDate}T${this.selectedTime}:00Z`);
    const now = new Date();
    const maxAllowed = new Date();
    maxAllowed.setUTCDate(now.getUTCDate() + 14);

    if (Number.isNaN(selectedDate.getTime())) {
      this.availabilityMessage = 'Please choose a valid date and time.';
      return false;
    }

    if (selectedDate < now) {
      this.availabilityMessage = 'Please select a future date and time.';
      return false;
    }

    if (selectedDate > maxAllowed) {
      this.availabilityMessage = 'Availability can only be checked for the next 14 days.';
      return false;
    }

    return true;
  }

  private validateBookingForm(): boolean {
    if (!this.customerFirstName.trim() || !this.customerLastName.trim()) {
      this.bookingMessage = 'Please enter your first and last name.';
      return false;
    }

    if (!this.customerPhone.trim()) {
      this.bookingMessage = 'Please enter a phone number.';
      return false;
    }

    if (!this.customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.customerEmail)) {
      this.bookingMessage = 'Please enter a valid email address.';
      return false;
    }

    return true;
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
