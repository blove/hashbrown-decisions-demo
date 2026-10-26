/** A scheduled flight in the demo's fixed timetable. */
export interface Flight {
  readonly flightNumber: string;
  readonly from: string;
  readonly to: string;
  /** Departure time as an ISO datetime. */
  readonly departs: string;
  /** Arrival time as an ISO datetime. */
  readonly arrives: string;
  /** The lowest economy fare in US dollars. */
  readonly price: number;
}

/** A trip the traveller has already booked. */
export interface Booking {
  readonly reference: string;
  readonly flightNumber: string;
  readonly from: string;
  readonly to: string;
  readonly departs: string;
  readonly status: 'confirmed' | 'delayed' | 'cancelled';
}

/** The lowest fare on one day of the week. */
export interface DayFare {
  /** The day as an ISO date. */
  readonly day: string;
  readonly lowest: number | null;
}

/** The demo's timetable: one week of Portland and Seattle flights. */
export const FLIGHTS: readonly Flight[] = [
  { flightNumber: 'HB 101', from: 'Portland', to: 'Seattle', departs: '2026-11-02T07:05', arrives: '2026-11-02T08:00', price: 129 },
  { flightNumber: 'HB 117', from: 'Portland', to: 'Seattle', departs: '2026-11-02T17:40', arrives: '2026-11-02T18:35', price: 164 },
  { flightNumber: 'HB 103', from: 'Portland', to: 'Seattle', departs: '2026-11-03T09:15', arrives: '2026-11-03T10:10', price: 98 },
  { flightNumber: 'HB 105', from: 'Portland', to: 'Seattle', departs: '2026-11-04T12:30', arrives: '2026-11-04T13:25', price: 112 },
  { flightNumber: 'HB 107', from: 'Portland', to: 'Seattle', departs: '2026-11-05T06:45', arrives: '2026-11-05T07:40', price: 87 },
  { flightNumber: 'HB 109', from: 'Portland', to: 'Seattle', departs: '2026-11-06T15:20', arrives: '2026-11-06T16:15', price: 149 },
  { flightNumber: 'HB 111', from: 'Portland', to: 'Seattle', departs: '2026-11-07T10:00', arrives: '2026-11-07T10:55', price: 104 },
  { flightNumber: 'HB 202', from: 'Seattle', to: 'Portland', departs: '2026-11-02T19:10', arrives: '2026-11-02T20:05', price: 118 },
  { flightNumber: 'HB 204', from: 'Seattle', to: 'Portland', departs: '2026-11-04T08:20', arrives: '2026-11-04T09:15', price: 92 },
  { flightNumber: 'HB 301', from: 'Portland', to: 'San Francisco', departs: '2026-11-03T11:00', arrives: '2026-11-03T13:05', price: 189 },
  { flightNumber: 'HB 303', from: 'Portland', to: 'San Francisco', departs: '2026-11-05T16:30', arrives: '2026-11-05T18:35', price: 156 },
];

/** The traveller's existing trips. */
export const BOOKINGS: readonly Booking[] = [
  { reference: 'HBX7Q2', flightNumber: 'HB 103', from: 'Portland', to: 'Seattle', departs: '2026-11-03T09:15', status: 'delayed' },
  { reference: 'HBM4K9', flightNumber: 'HB 204', from: 'Seattle', to: 'Portland', departs: '2026-11-04T08:20', status: 'confirmed' },
];

/**
 * Flights between two cities, earliest first. City names match without
 * regard to case or surrounding spaces.
 *
 * @param flights - The timetable to search.
 * @param route - The departure and destination cities.
 * @returns The matching flights, sorted by departure time.
 */
export function findFlights(
  flights: readonly Flight[],
  route: { from: string; to: string },
): Flight[] {
  const same = (a: string, b: string) =>
    a.trim().toLowerCase() === b.trim().toLowerCase();

  return flights
    .filter((flight) => same(flight.from, route.from) && same(flight.to, route.to))
    .sort((a, b) => a.departs.localeCompare(b.departs));
}

/**
 * The cheapest flight, or null for an empty list. Ties go to the earlier one.
 *
 * @param flights - The flights to compare, earliest first.
 */
export function cheapestFlight(flights: readonly Flight[]): Flight | null {
  return flights.reduce<Flight | null>(
    (best, flight) => (best === null || flight.price < best.price ? flight : best),
    null,
  );
}

/**
 * The lowest fare for each of the seven days starting at `start`.
 *
 * @param flights - The flights to summarize.
 * @param start - The first day as an ISO date.
 */
export function faresByDay(flights: readonly Flight[], start: string): DayFare[] {
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(`${start}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    const day = date.toISOString().slice(0, 10);
    const prices = flights
      .filter((flight) => flight.departs.startsWith(day))
      .map((flight) => flight.price);

    return { day, lowest: prices.length === 0 ? null : Math.min(...prices) };
  });
}
