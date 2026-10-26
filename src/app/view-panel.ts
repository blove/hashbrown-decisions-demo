import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { UiDecisionComponent, uiDecisionResource } from '@hashbrownai/angular';
import { createHttpDecisionTransport } from '@hashbrownai/core';
import { VIEW_CONTEXT, viewOptions } from '../../shared/decisions';
import { findFlights, FLIGHTS } from '../../shared/flights';
import { CheapestFare, FareCalendar, FlightList } from './flight-views';
import { Probabilities, toRows } from './probabilities';

const EXAMPLES = [
  'What times can I fly up to Seattle?',
  'Just show me the cheapest way to get there.',
  'I can go any day next week, which day is best?',
];

/** The flights every view shows; the model never writes them. */
const flights = findFlights(FLIGHTS, { from: 'Portland', to: 'Seattle' });

/** Step 2: a decision picks one of three app-built views. */
@Component({
  selector: 'app-view-panel',
  imports: [FlightList, Probabilities, UiDecisionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="field-row" (submit)="$event.preventDefault(); choose()">
      <label class="field">
        <span>How would you like to see Portland → Seattle flights?</span>
        <input [value]="prompt()" (input)="prompt.set($any($event.target).value)" />
      </label>
      <button type="submit" class="primary" [disabled]="!prompt().trim()">Choose a view</button>
    </form>
    <div class="chips">
      @for (example of examples; track example) {
        <button type="button" class="chip" (click)="prompt.set(example); choose()">{{ example }}</button>
      }
    </div>

    <div class="split">
      <div class="stage">
        @if (picked.isLoading()) {
          <p class="muted"><span class="spinner" aria-hidden="true"></span> Choosing a view…</p>
        } @else if (picked.error()) {
          <p role="alert">Could not choose a view. Showing every flight.</p>
          <app-flight-list [flights]="flights" />
        } @else if (request() && picked.ids().length === 0) {
          <p class="muted">No confident choice, so here is every flight.</p>
          <app-flight-list [flights]="flights" />
        } @else {
          <hb-ui-decision [resource]="picked" />
        }
      </div>
      @if (picked.decision.meta(); as meta) {
        <app-probabilities caption="pick" [rows]="pickRows()" />
      }
    </div>
  `,
})
export class ViewPanel {
  protected readonly examples = EXAMPLES;
  protected readonly flights = flights;
  protected readonly prompt = signal(EXAMPLES[2]);
  protected readonly request = signal<string | null>(null);

  protected readonly picked = uiDecisionResource({
    input: this.request,
    system: VIEW_CONTEXT,
    candidates: [
      { ...viewOptions[0], component: FlightList, inputs: { flights } },
      { ...viewOptions[1], component: CheapestFare, inputs: { flights } },
      { ...viewOptions[2], component: FareCalendar, inputs: { flights, start: '2026-11-02' } },
    ],
    select: 'one',
    minConfidence: 0.7,
    transport: createHttpDecisionTransport({ url: '/api/decide/view' }),
  });

  protected readonly pickRows = computed(() => {
    const meta = this.picked.decision.meta() as { pick?: { probabilities: Record<string, number> } } | null;
    return meta?.pick ? toRows(meta.pick.probabilities, this.picked.ids()[0]) : [];
  });

  protected choose(): void {
    const prompt = this.prompt().trim();
    if (prompt) this.request.set(prompt);
  }
}
