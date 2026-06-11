function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string): boolean {
  return /^\+?[0-9\s()-]{7,20}$/.test(value);
}

export function validateAvailabilityInput(input: unknown): asserts input is {
  location: string;
  vehicleType: string;
  startDateTime: string;
  durationMins: number;
} {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid availability request body.');
  }

  const { location, vehicleType, startDateTime, durationMins } = input as Record<string, unknown>;

  if (!isNonEmptyString(location) || !isNonEmptyString(vehicleType) || !isNonEmptyString(startDateTime)) {
    throw new Error('location, vehicleType and startDateTime are required.');
  }

  if (!Number.isInteger(durationMins) || durationMins <= 0 || durationMins > 180) {
    throw new Error('durationMins must be a positive integer up to 180.');
  }

  const start = new Date(startDateTime);
  if (Number.isNaN(start.getTime())) {
    throw new Error('startDateTime must be a valid ISO date string.');
  }
}

export function validateBookingInput(input: unknown): asserts input is {
  vehicleId: string;
  startDateTime: string;
  durationMins: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
} {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid booking request body.');
  }

  const { vehicleId, startDateTime, durationMins, customerName, customerPhone, customerEmail } = input as Record<string, unknown>;

  if (!isNonEmptyString(vehicleId) || !isNonEmptyString(startDateTime) || !isNonEmptyString(customerName) || !isNonEmptyString(customerPhone) || !isNonEmptyString(customerEmail)) {
    throw new Error('vehicleId, startDateTime, customerName, customerPhone and customerEmail are required.');
  }

  if (!Number.isInteger(durationMins) || durationMins <= 0 || durationMins > 180) {
    throw new Error('durationMins must be a positive integer up to 180.');
  }

  if (!isValidEmail(customerEmail)) {
    throw new Error('customerEmail must be a valid email address.');
  }

  if (!isValidPhone(customerPhone)) {
    throw new Error('customerPhone must be a valid phone number.');
  }

  const start = new Date(startDateTime);
  if (Number.isNaN(start.getTime())) {
    throw new Error('startDateTime must be a valid ISO date string.');
  }
}
