import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { decisionResource } from '@hashbrownai/angular';
import { createHttpDecisionTransport } from '@hashbrownai/core';
import { ROUTE_CONTEXT, routeSchema } from '../../shared/decisions';
import { routeAction } from '../../shared/route-action';
import { Probabilities, toRows } from './probabilities';

const EXAMPLES = [
  'Any cheap flights from Portland to Seattle on Thursday?',
  'My flight to Seattle is delayed AGAIN and I have a meeting at noon.',
  'Can I bring a ski bag as my checked bag?',
  'What a great view from the window seat!',
];

const ACTIONS = {
  idle: { label: 'Waiting for a message', tone: 'idle' },
  search: { label: 'Open flight search', tone: 'go' },
  bookings: { label: 'Open my trips', tone: 'go' },
  help: { label: 'Open the help centre', tone: 'go' },
  assistant: { label: 'Send to the assistant', tone: 'unsure' },
  escalate: { label: 'Hand to a person, now', tone: 'alert' },
} as const;

/** Step 1: one decision routes a message as you type. */
@Component({
  selector: 'app-route-panel',
  imports: [Probabilities],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="field">
      <span>Type a message from a traveller</span>
      <textarea
        rows="2"
        [value]="text()"
        (input)="text.set($any($event.target).value)"
      ></textarea>
    </label>
    <div class="chips">
      @for (example of examples; track example) {
        <button type="button" class="chip" (click)="text.set(example)">{{ example }}</button>
      }
    </div>

    <div class="result">
      <div class="badge" [attr.data-tone]="action().tone">
        @if (route.isLoading()) {
          <span class="spinner" aria-hidden="true"></span>
        }
        <strong>{{ action().label }}</strong>
        @if (route.value(); as value) {
          <span class="muted">intent {{ value.intent }} · {{ route.meta()?.intent?.confidence?.toFixed(2) }}</span>
        }
      </div>

      @if (route.error()) {
        <p role="alert">The decision failed, so the message goes to the assistant.</p>
      }

      @if (route.value(); as value) {
        @if (route.meta(); as meta) {
          <div class="charts">
            <app-probabilities caption="intent" [rows]="intentRows()" />
            <app-probabilities caption="urgent" [rows]="[{ label: 'yes', value: meta.urgent.probability, chosen: value.urgent }]" />
            <app-probabilities [caption]="'frustration · score ' + meta.frustration.score.toFixed(2)" [rows]="frustrationRows()" />
          </div>
          <details>
            <summary>Typed value</summary>
            <pre>{{ json(value) }}</pre>
          </details>
        }
      }
    </div>
  `,
})
export class RoutePanel {
  protected readonly examples = EXAMPLES;
  protected readonly text = signal(EXAMPLES[1]);

  protected readonly route = decisionResource({
    schema: routeSchema,
    input: computed(() => {
      const text = this.text().trim();
      return text.length < 3 ? null : text;
    }),
    system: ROUTE_CONTEXT,
    debounce: 200,
    transport: createHttpDecisionTransport({ url: '/api/decide/route' }),
  });

  protected readonly action = computed(() => {
    const value = this.route.value();
    const meta = this.route.meta();
    return ACTIONS[routeAction(value && meta ? { value, meta } : null).kind];
  });

  protected readonly intentRows = computed(() => {
    const meta = this.route.meta();
    return meta ? toRows(meta.intent.probabilities, this.route.value()?.intent) : [];
  });

  protected readonly frustrationRows = computed(() => {
    const meta = this.route.meta();
    return meta ? toRows(meta.frustration.probabilities, this.route.value()?.frustration) : [];
  });


  protected json(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }
}
