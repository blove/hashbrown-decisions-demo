import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { cheapestFlight, faresByDay, type Flight } from '../../shared/flights';

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

/** Every flight in departure order. */
@Component({
  selector: 'app-flight-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="view">
      <h3>All flights · Portland → Seattle</h3>
      <table>
        <tbody>
          @for (flight of flights(); track flight.flightNumber) {
            <tr>
              <td>{{ day(flight.departs) }}</td>
              <td>{{ time(flight.departs) }} – {{ time(flight.arrives) }}</td>
              <td>{{ flight.flightNumber }}</td>
              <td class="price">\${{ flight.price }}</td>
            </tr>
          }
        </tbody>
      </table>
    </section>
  `,
})
export class FlightList {
  readonly flights = input.required<readonly Flight[]>();
  protected readonly time = time;
  protected readonly day = (iso: string) => day(iso.slice(0, 10));
}

/** The single cheapest fare. */
@Component({
  selector: 'app-cheapest-fare',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (cheapest(); as flight) {
      <section class="view hero">
        <p class="eyebrow">Cheapest fare this week</p>
        <p class="big">\${{ flight.price }}</p>
        <p>{{ flight.flightNumber }} · {{ day(flight.departs) }} · {{ time(flight.departs) }}</p>
      </section>
    }
  `,
})
export class CheapestFare {
  readonly flights = input.required<readonly Flight[]>();
  protected readonly cheapest = computed(() => cheapestFlight(this.flights()));
  protected readonly time = time;
  protected readonly day = (iso: string) => day(iso.slice(0, 10));
}

/** The lowest fare on each day of the week. */
@Component({
  selector: 'app-fare-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="view">
      <h3>Lowest fare by day</h3>
      <div class="calendar">
        @for (fare of fares(); track fare.day) {
          <div class="calendar-day" [class.best]="fare.lowest === best()">
            <span>{{ day(fare.day) }}</span>
            <strong>{{ fare.lowest === null ? '—' : '$' + fare.lowest }}</strong>
          </div>
        }
      </div>
    </section>
  `,
})
export class FareCalendar {
  readonly flights = input.required<readonly Flight[]>();
  readonly start = input.required<string>();
  protected readonly fares = computed(() => faresByDay(this.flights(), this.start()));
  protected readonly best = computed(() =>
    Math.min(...this.fares().flatMap((fare) => (fare.lowest === null ? [] : [fare.lowest]))),
  );
  protected readonly day = day;
}
