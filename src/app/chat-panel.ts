import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  createTool,
  RenderMessageComponent,
  uiChatResource,
  uiDecisionResource,
} from '@hashbrownai/angular';
import { createHttpDecisionTransport, s } from '@hashbrownai/core';
import { cardOptions } from '../../shared/decisions';
import { BOOKINGS, findFlights, FLIGHTS } from '../../shared/flights';
import { bookingCard, flightCard, proseKit } from './cards';
import { Probabilities } from './probabilities';

const EXAMPLES = [
  'Find me a flight from Portland to Seattle',
  'Is my Seattle trip still on time?',
];

/** Step 3: a decision narrows the chat's cards before each message is sent. */
@Component({
  selector: 'app-chat-panel',
  imports: [Probabilities, RenderMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="split">
      <div class="transcript">
        @for (message of chat.value(); track $index) {
          @if (message.role === 'user') {
            <p class="bubble user">{{ message.content }}</p>
          } @else if (message.role === 'assistant') {
            <div class="bubble assistant"><hb-render-message [message]="message" /></div>
          } @else if (message.role === 'error') {
            <p role="alert">The assistant didn't answer. Try again.</p>
          }
        } @empty {
          <p class="muted">Ask about flights or your trips.</p>
        }
        @if (narrowed.isDeciding()) {
          <p class="muted"><span class="spinner" aria-hidden="true"></span> Choosing cards…</p>
        } @else if (chat.isLoading()) {
          <p class="muted"><span class="spinner" aria-hidden="true"></span> Answering…</p>
        }
        <form class="field-row" (submit)="$event.preventDefault(); send()">
          <input
            aria-label="Message"
            placeholder="Ask Flight Desk"
            [value]="draft()"
            (input)="draft.set($any($event.target).value)"
          />
          <button type="submit" class="primary" [disabled]="!draft().trim() || chat.isLoading()">Send</button>
        </form>
        <div class="chips">
          @for (example of examples; track example) {
            <button type="button" class="chip" (click)="draft.set(example)">{{ example }}</button>
          }
        </div>
      </div>
      <aside>
        <app-probabilities caption="cards for this turn" [rows]="cardRows()" />
        @if (narrowed.decisionError()) {
          <p class="muted">The decision failed, so the chat got every card.</p>
        }
      </aside>
    </div>
  `,
})
export class ChatPanel {
  protected readonly examples = EXAMPLES;
  protected readonly draft = signal(EXAMPLES[0]);

  protected readonly chat = uiChatResource({
    system: `You are Flight Desk, a travel assistant. Use findFlights for new flights and findBookings for the traveller's trips.
Show each flight with a FlightCard and each booking with a BookingCard, copying values from the tool result.
Add one short Markdown sentence before the cards. If a city is missing, ask for it instead of guessing.`,
    components: [proseKit, flightCard, bookingCard],
    tools: [
      createTool({
        name: 'findFlights',
        description: 'Search the timetable for flights between two cities.',
        schema: s.object('A flight search', {
          from: s.string('The departure city, as the traveller named it'),
          to: s.string('The destination city, as the traveller named it'),
        }),
        handler: async (route) => findFlights(FLIGHTS, route).slice(0, 3),
      }),
      createTool({
        name: 'findBookings',
        description: "List the traveller's booked trips and their status.",
        schema: s.object('No input', {}),
        handler: async () => BOOKINGS,
      }),
    ],
  });

  protected readonly narrowed = uiDecisionResource({
    chat: this.chat,
    select: { max: 2 },
    minConfidence: 0.7,
    system: 'Provided by the server.',
    transport: createHttpDecisionTransport({ url: '/api/decide/cards' }),
  });

  protected readonly cardRows = computed(() => {
    const value = this.narrowed.decision.value() as Record<string, boolean> | null;
    const meta = this.narrowed.decision.meta() as Record<string, { probability: number }> | null;
    return cardOptions.map(({ name }) => ({
      label: name,
      value: meta?.[name]?.probability ?? 0,
      chosen: value?.[name] === true,
    }));
  });

  protected send(): void {
    const content = this.draft().trim();
    if (!content) return;
    this.narrowed.sendMessage(content);
    this.draft.set('');
  }
}
