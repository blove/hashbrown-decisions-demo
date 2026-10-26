import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { createUiKit, exposeComponent, exposeMarkdown } from '@hashbrownai/angular';
import { s } from '@hashbrownai/core';
import { cardOptions } from '../../shared/decisions';

const time = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });

/** One flight the assistant found. */
@Component({
  selector: 'app-flight-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card">
      <header><strong>{{ flightNumber() }}</strong><span class="price">\${{ price() }}</span></header>
      <p>{{ from() }} → {{ to() }}</p>
      <p class="muted">{{ time(departs()) }}</p>
    </article>
  `,
})
export class FlightCard {
  readonly flightNumber = input.required<string>();
  readonly from = input.required<string>();
  readonly to = input.required<string>();
  readonly departs = input.required<string>();
  readonly price = input.required<number>();
  protected readonly time = time;
}

/** One of the traveller's booked trips. */
@Component({
  selector: 'app-booking-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card">
      <header><strong>{{ reference() }}</strong><span class="status" [attr.data-status]="status()">{{ status() }}</span></header>
      <p>{{ flightNumber() }} · {{ from() }} → {{ to() }}</p>
      <p class="muted">{{ time(departs()) }}</p>
    </article>
  `,
})
export class BookingCard {
  readonly reference = input.required<string>();
  readonly flightNumber = input.required<string>();
  readonly from = input.required<string>();
  readonly to = input.required<string>();
  readonly departs = input.required<string>();
  readonly status = input.required<'confirmed' | 'delayed' | 'cancelled'>();
  protected readonly time = time;
}

/** Markdown is never part of the card decision, and always available. */
export const proseKit = createUiKit({
  components: [exposeMarkdown()],
  selectable: false,
});

export const flightCard = exposeComponent(FlightCard, {
  ...cardOptions[0],
  input: {
    flightNumber: s.string('The flight number, such as HB 103'),
    from: s.string('The departure city'),
    to: s.string('The destination city'),
    departs: s.string('The departure time, copied from the tool result'),
    price: s.number('The fare in US dollars'),
  },
});

export const bookingCard = exposeComponent(BookingCard, {
  ...cardOptions[1],
  input: {
    reference: s.string('The booking reference'),
    flightNumber: s.string('The booked flight number'),
    from: s.string('The departure city'),
    to: s.string('The destination city'),
    departs: s.string('The departure time, copied from the tool result'),
    status: s.enumeration('The booking status', ['confirmed', 'delayed', 'cancelled']),
  },
});
