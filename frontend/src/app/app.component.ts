import { Component } from '@angular/core';

import { TestDriveBookingComponent } from './test-drive-booking.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TestDriveBookingComponent],
  template: '<app-test-drive-booking [vehicleType]="\'tesla_modelx\'"></app-test-drive-booking>',
})
export class AppComponent {}
