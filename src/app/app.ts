import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ChatPanel } from './chat-panel';
import { RoutePanel } from './route-panel';
import { ViewPanel } from './view-panel';

const STEPS = [
  { id: 'route', title: 'Route a message', api: 'decisionResource()' },
  { id: 'view', title: 'Pick a view', api: 'uiDecisionResource() · candidates' },
  { id: 'chat', title: 'Narrow a chat', api: 'uiDecisionResource() · chat' },
] as const;

/** Flight Desk: three ways to use a decision model with Hashbrown. */
@Component({
  selector: 'app-root',
  imports: [ChatPanel, RoutePanel, ViewPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="masthead">
      <h1>Flight Desk</h1>
      <p>Decision models with Hashbrown</p>
    </header>
    <nav class="steps" role="tablist">
      @for (step of steps; track step.id; let i = $index) {
        <button type="button" role="tab" [attr.aria-selected]="active() === step.id" (click)="active.set(step.id)">
          <span class="step-number">{{ i + 1 }}</span>
          <span><strong>{{ step.title }}</strong><code>{{ step.api }}</code></span>
        </button>
      }
    </nav>
    <main class="panel">
      @switch (active()) {
        @case ('route') { <app-route-panel /> }
        @case ('view') { <app-view-panel /> }
        @case ('chat') { <app-chat-panel /> }
      }
    </main>
  `,
})
export class App {
  protected readonly steps = STEPS;
  protected readonly active = signal<(typeof STEPS)[number]['id']>('route');
}
